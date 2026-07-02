// 買い目標到達 観測スペースのサーバー側トラッカー。
// GitHub Actions から20分ごとに実行され、結果を data/integrated-obs.json として公開する。
// これにより全端末で同じ観測状態・利確/損切カウントが共有される（従来はブラウザ毎のlocalStorage）。
//
// 到達判定の仕組み:
//   買い目標(buy)は毎回 現在価格×(1-0.5〜3%) で再計算されるため、同一スナップショット内では
//   price <= buy が構造的に成立しない。そこで「JST日付ごとに最初の実行時点の buy/tp/sl を固定保存」し、
//   以降の実行で現在価格がその固定目標に到達したかを判定する。
//   - 標準モード: price <= buy（目標として保存した水準まで実際に下がったら追跡開始）
//   - ゆるめモード: price <= min(buy × 1.02, 目標設定時の基準価格 × 0.999)
//     buyの割引率が2%未満（乖離率+4%以下の銘柄＝大多数）だと buy×1.02 が基準価格を超え、
//     夜間の stale な前日終値で即到達してしまうため、基準価格×0.999 を上限にして
//     「少なくとも基準価格から0.1%下がらないと到達しない」ことを保証する。
// 新規到達の判定は市場時間内（JST 平日 9:00〜15:30）のみ行う。夜間・休日は価格が
// 前日終値のまま動かず、実際には執行できない価格でのエントリーが記録されるため。
// 対象は統合銘柄ランキング上位の個別株（TARGET_LIMIT件、ETF/REIT/指数連動を除く）。
// 利確/損切は全銘柄の最新価格で判定する（ランキング圏外に落ちた銘柄も決済まで追跡）。

const fs = require("fs");
const path = require("path");

const RELAX_FACTOR = 1.02;
const RELAX_REF_CAP = 0.999; // ゆるめしきい値の上限: 目標設定時の基準価格 × 0.999
const TARGET_LIMIT = 15; // 標準表示10件 + ゆるめ表示15件をカバー
const CLOSED_LIMIT = 80;

// 仮想資金シミュレーション: 観測スペースへの追加を「購入」とみなし、利確/損切で資金を増減させる。
// 2種類の購入ルールを並行運用して比較できるようにする:
//   fixed: 1銘柄100万円固定（端株可・S株/ミニ株想定）。全銘柄が同じ重み＝戦略の期待値がそのまま資金曲線に出る
//   unit : 1単元（100株）購入。実際の発注（単元株取引）の再現。銘柄ごとに投入額が変わる
// 購入するのは BUY_CATEGORIES のシグナル区分のみ。「見送り」は実運用で買わないため対象外。
// 「監視継続」は観測実績が利確0回/損切11回（2026-07-02時点、標準5+ゆるめ6）と一方的に悪いため対象外。
// どちらも観測・カウントには従来通り残す（対照群として引き続き検証する）。
// 資金不足時はスキップとして記録（資金管理の検証）。標準/ゆるめで別々の資金を運用する。
const INITIAL_CAPITAL = Number(process.env.OBS_INITIAL_CAPITAL || 50000000);
const TRADE_BUDGET = Number(process.env.OBS_TRADE_BUDGET || 1000000);
const UNIT_SHARES = 100;
const PF_VARIANTS = ["fixed", "unit"];
const PF_HISTORY_LIMIT = 200;
const PF_SKIPPED_LIMIT = 40;
const BUY_CATEGORIES = new Set(["統合買い候補", "確認候補"]);

// 実戦候補の初期優先度（2026-07-02の検討結果）。成績（損益率）に差が付くまでの同率時の並び順:
//   標準 > ゆるめ … 標準は深い押し目(基準価格-0.5〜3%)エントリーでRR約2:1と構造的に有利。
//                    ゆるめは浅い押し目(-0.1%〜)で早く入る分、同じ利確/損切価格に対しRRが悪い
//   100万固定 > 1単元 … 全銘柄同額＝戦略の期待値がそのまま資金曲線に出る。1単元は株価で重みが偏る
// 損益率に差が出た後は評価額ベースで自動的に順位が入れ替わる（candidateRanking）。
const STRUCTURAL_PRIORITY = [
  { mode: "standard", variant: "fixed" },
  { mode: "standard", variant: "unit" },
  { mode: "relax", variant: "fixed" },
  { mode: "relax", variant: "unit" }
];

// LINE通知（買い目標到達＝仮想購入時）。標準/ゆるめ × 100万固定/1単元 の4バケットの結果を
// 1銘柄=1通にまとめて送る。LINE_ACCESS_TOKEN / LINE_USER_ID 未設定なら自動スキップ。
const MODE_LABELS = { standard: "標準", relax: "ゆるめ" };
// 標準/ゆるめを一目で見分けるための色分け絵文字（LINEはプレーンテキストなので色付き絵文字で代用）。
const MODE_EMOJI = { standard: "🔵", relax: "🟠" };
const VARIANT_LABELS = { fixed: "100万固定", unit: "1単元" };
const PAGE_URL = process.env.OBS_PAGE_URL || "https://p27dff96428v8m9-pixel.github.io/auto-kabu-screener/fund-flow-ai-system/";

function resolvePath(envName, fallback) {
  const value = process.env[envName];
  if (value) return path.resolve(process.cwd(), value);
  return path.resolve(process.cwd(), fallback);
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function jstDateKey(date = new Date()) {
  return new Date(date.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// 東証の取引時間（JST 平日 9:00〜15:30）かどうか。新規到達判定はこの間のみ行う。
// 祝日は判定してしまうが、価格が前日終値のまま動かないため到達は発生しない
// （標準は buy < 基準価格、ゆるめも基準価格×0.999 上限のため）。
function isMarketHoursJst(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 3600 * 1000);
  const day = jst.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minutes = jst.getUTCHours() * 60 + jst.getUTCMinutes();
  return minutes >= 9 * 60 && minutes <= 15 * 60 + 30;
}

function isIndexLinkedType(type = "", name = "") {
  return /ETF|投信|連動|REIT|リート/i.test(`${type} ${name}`);
}

function makeEmptyCounts() {
  return {
    "統合買い候補": { tp: 0, sl: 0 },
    "監視継続": { tp: 0, sl: 0 },
    "確認候補": { tp: 0, sl: 0 },
    "見送り": { tp: 0, sl: 0 }
  };
}

function getCategoryLabel(signal) {
  const s = String(signal || "");
  if (/統合.*買/.test(s)) return "統合買い候補";
  if (/監視|継続/.test(s)) return "監視継続";
  if (/確認/.test(s)) return "確認候補";
  return "見送り";
}

function makeEmptyPortfolio() {
  return {
    initialCapital: INITIAL_CAPITAL,
    cash: INITIAL_CAPITAL,
    positions: {},
    history: [],
    skipped: [],
    realizedPnl: 0,
    startedAt: null,
    tpCount: 0,
    slCount: 0
  };
}

function normalizeObs(obs) {
  if (!obs || typeof obs !== "object") obs = {};
  for (const key of ["standard", "relax"]) {
    if (!obs[key] || typeof obs[key] !== "object") {
      obs[key] = { active: [], closed: [], counts: makeEmptyCounts() };
    }
    const d = obs[key];
    if (!Array.isArray(d.active)) d.active = [];
    if (!Array.isArray(d.closed)) d.closed = [];
    if (!d.counts || typeof d.counts !== "object") d.counts = makeEmptyCounts();
    for (const cat of Object.keys(makeEmptyCounts())) {
      if (!d.counts[cat] || typeof d.counts[cat] !== "object") d.counts[cat] = { tp: 0, sl: 0 };
    }
  }
  if (!obs.targets || typeof obs.targets !== "object") obs.targets = {};
  if (!obs.portfolio || typeof obs.portfolio !== "object") obs.portfolio = {};
  for (const key of ["standard", "relax"]) {
    let m = obs.portfolio[key];
    // 旧形式（fixed単独・フラット構造）からの移行
    if (m && typeof m === "object" && Number.isFinite(Number(m.cash))) m = { fixed: m };
    if (!m || typeof m !== "object") m = {};
    for (const variant of PF_VARIANTS) {
      // 初期資金の設定が変わったら（増額など）そのバケットを作り直して全端末で公平に再スタートする。
      // 取りこぼし（資金不足スキップ）を避けるための資金変更は、過去の偏った成績を引き継がず仕切り直す。
      if (!m[variant] || typeof m[variant] !== "object" || Number(m[variant].initialCapital) !== INITIAL_CAPITAL) {
        m[variant] = makeEmptyPortfolio();
      }
      const p = m[variant];
      if (!Number.isFinite(Number(p.initialCapital)) || Number(p.initialCapital) <= 0) p.initialCapital = INITIAL_CAPITAL;
      if (!Number.isFinite(Number(p.cash))) p.cash = p.initialCapital;
      if (!p.positions || typeof p.positions !== "object") p.positions = {};
      if (!Array.isArray(p.history)) p.history = [];
      if (!Array.isArray(p.skipped)) p.skipped = [];
      if (!Number.isFinite(Number(p.realizedPnl))) p.realizedPnl = 0;
      if (!Number.isFinite(Number(p.tpCount))) p.tpCount = 0;
      if (!Number.isFinite(Number(p.slCount))) p.slCount = 0;
    }
    obs.portfolio[key] = m;
  }
  return obs;
}

// 到達＝購入。variant に応じて 100万円分（端株）または 1単元（100株）を取得する。
function tryBuy(pf, variant, code, name, signal, price, nowIso) {
  if (!pf.startedAt) pf.startedAt = nowIso;
  let shares;
  let cost;
  if (variant === "unit") {
    shares = UNIT_SHARES;
    cost = Math.round(UNIT_SHARES * price);
  } else {
    shares = Number((TRADE_BUDGET / price).toFixed(4));
    cost = TRADE_BUDGET;
  }
  if (Number(pf.cash) >= cost) {
    pf.cash = Math.round(Number(pf.cash) - cost);
    pf.positions[code] = { name, shares, entryPrice: price, investedAmount: cost, signal, entryAt: nowIso };
    return { action: "buy", shares, cost };
  }
  const reason = variant === "unit" ? `資金不足（1単元 ${cost.toLocaleString()}円）` : "資金不足";
  pf.skipped.unshift({ code, name, signal, price, at: nowIso, reason });
  if (pf.skipped.length > PF_SKIPPED_LIMIT) pf.skipped.length = PF_SKIPPED_LIMIT;
  return { action: "skip", cost, reason };
}

// LINE Messaging API でテキストを push 送信する（auto_trader.py / gas_code.gs と同じ方式）。
async function sendLine(message) {
  const token = process.env.LINE_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;
  if (!token || !userId) {
    console.log("LINE未設定のため通知をスキップ");
    return false;
  }
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: userId, messages: [{ type: "text", text: message }] })
    });
    if (!res.ok) {
      console.error(`LINE通知エラー: HTTP ${res.status} ${await res.text().catch(() => "")}`);
      return false;
    }
    console.log("LINE通知送信完了");
    return true;
  } catch (e) {
    console.error(`LINE通知エラー: ${e && e.message ? e.message : e}`);
    return false;
  }
}

// 1銘柄×1モードの買い目標到達イベント（100万固定/1単元の両方式の結果込み）をLINE本文に整形する。
// rankMap: "mode:variant" -> 実戦候補順位（candidateRanking）。どの通知を実弾にするかの目安を本文に併記する。
function buildBuyMessage(ev, rankMap) {
  const yen = (n) => `${Math.round(n).toLocaleString()}円`;
  const modeLabel = MODE_LABELS[ev.mode] || ev.mode;
  const emoji = MODE_EMOJI[ev.mode] || "🎯";
  const lines = [
    `${emoji}【${modeLabel}モード】買い目標到達（仮想売買）`,
    `${ev.name} (${ev.code})`,
    `区分: ${ev.category || "—"}`,
    `現在値 ${yen(ev.price)} ≤ ${modeLabel}基準 ${yen(ev.threshold)}`
  ];
  // ゆるめは min(買い目標×1.02, 基準価格×0.999) がしきい値なので、根拠を明示（標準は買い目標そのものなので省略）。
  if (ev.factor !== 1) lines.push(`(買い目標 ${yen(ev.buy)} ×${ev.factor}・基準値×0.999 の低い方)`);
  lines.push(`利確 ${ev.tp != null ? yen(ev.tp) : "—"} ／ 損切 ${ev.sl != null ? yen(ev.sl) : "—"}`);
  lines.push("──────────");
  for (const e of ev.entries) {
    const rank = rankMap ? rankMap[`${ev.mode}:${e.variant}`] : null;
    const variant = (VARIANT_LABELS[e.variant] || e.variant) + (rank ? `〔第${rank}候補〕` : "");
    if (e.action === "buy") {
      const detail = e.variant === "unit"
        ? `${e.shares}株（${Math.round(e.cost).toLocaleString()}円）`
        : `${Math.round(e.cost).toLocaleString()}円分`;
      lines.push(`${variant}: 買い ${detail}`);
    } else {
      lines.push(`${variant}: ${e.reason}`);
    }
  }
  lines.push(`詳細: ${PAGE_URL}`);
  return lines.join("\n");
}

// 利確/損切＝売却。保有していれば決済価格で現金に戻し、履歴に記録する。
function settlePosition(pf, item, exitType, exitPrice, nowIso) {
  const pos = pf.positions[item.code];
  if (!pos) return;
  const proceeds = Math.round(Number(pos.shares) * exitPrice);
  const pnl = proceeds - Number(pos.investedAmount);
  pf.cash = Math.round(Number(pf.cash) + proceeds);
  pf.realizedPnl = Math.round(Number(pf.realizedPnl) + pnl);
  // 100万固定・1単元それぞれの利確/損切回数を別々に集計する（観測スペースで分けて表示するため）。
  if (exitType === "tp") pf.tpCount = (Number(pf.tpCount) || 0) + 1;
  else if (exitType === "sl") pf.slCount = (Number(pf.slCount) || 0) + 1;
  pf.history.unshift({
    code: item.code,
    name: item.name || item.code,
    signal: item.signal,
    exitType,
    shares: pos.shares,
    investedAmount: pos.investedAmount,
    entryPrice: pos.entryPrice,
    exitPrice,
    proceeds,
    pnl,
    pnlPct: Number(((pnl / Number(pos.investedAmount)) * 100).toFixed(2)),
    entryAt: pos.entryAt,
    exitAt: nowIso
  });
  if (pf.history.length > PF_HISTORY_LIMIT) pf.history.length = PF_HISTORY_LIMIT;
  delete pf.positions[item.code];
}

// 公開ページの selectIntegratedRankingStocks / シートの selectSheetStocks と同じ選択ロジック
function selectRankedStocks(stocks, limit) {
  const picked = [];
  for (const stock of stocks || []) {
    if (picked.length >= limit) break;
    if (isIndexLinkedType(stock.type, stock.name)) continue;
    picked.push(stock);
  }
  return picked;
}

async function main() {
  const treasurePath = resolvePath("TREASURE_STOCKS_INPUT_PATH", path.join("docs", "fund-flow-ai-system", "data", "treasure-stocks.json"));
  const obsPath = resolvePath("INTEGRATED_OBS_PATH", path.join("docs", "fund-flow-ai-system", "data", "integrated-obs.json"));

  const treasure = readJson(treasurePath, {});
  const allStocks = Array.isArray(treasure.stocks) ? treasure.stocks : [];
  if (!allStocks.length) {
    console.log(JSON.stringify({ skipped: true, reason: "treasure-stocks.json has no stocks" }));
    return;
  }

  const priceMap = {};
  for (const stock of allStocks) {
    const code = String(stock.code || "").trim();
    const price = Number(stock.price);
    if (code && Number.isFinite(price) && price > 0) priceMap[code] = price;
  }

  const obs = normalizeObs(readJson(obsPath, {}));
  const today = jstDateKey();
  const nowIso = new Date().toISOString();
  const summary = { settled: 0, hits: { standard: 0, relax: 0 } };
  // この実行で新たに買い目標到達した銘柄を集約（code -> 4バケットの結果）。実行末に1銘柄=1通でLINE通知。
  const buyEvents = {};

  // workflow_dispatch の reset_portfolio 入力で仮想資金を初期化（観測カウント・履歴はそのまま）
  if (process.env.RESET_PORTFOLIO === "1" || process.env.RESET_PORTFOLIO === "true") {
    for (const key of ["standard", "relax"]) {
      for (const variant of PF_VARIANTS) obs.portfolio[key][variant] = makeEmptyPortfolio();
    }
    console.log(`RESET_PORTFOLIO: 仮想資金を${INITIAL_CAPITAL.toLocaleString()}円に初期化しました（標準/ゆるめ × 100万固定/1単元 すべて）`);
  }

  const modeDefs = [
    { key: "standard", factor: 1.0 },
    { key: "relax", factor: RELAX_FACTOR }
  ];

  // 1) 既存アクティブの利確/損切判定（ランキング圏外でも価格があれば決済まで追跡）
  for (const def of modeDefs) {
    const data = obs[def.key];
    const stillActive = [];
    for (const item of data.active) {
      const curPrice = priceMap[item.code];
      let resolved = null;
      if (Number.isFinite(curPrice)) {
        if (item.tp != null && curPrice >= Number(item.tp)) resolved = "tp";
        else if (item.sl != null && curPrice <= Number(item.sl)) resolved = "sl";
      }
      if (resolved) {
        const cat = getCategoryLabel(item.signal);
        data.counts[cat][resolved] = (data.counts[cat][resolved] || 0) + 1;
        data.closed.unshift({ ...item, exitType: resolved, exitPrice: curPrice, exitAt: nowIso });
        if (data.closed.length > CLOSED_LIMIT) data.closed.length = CLOSED_LIMIT;
        summary.settled += 1;

        // 仮想資金: 両方式とも保有していれば決済価格で売却し現金に戻す
        for (const variant of PF_VARIANTS) {
          settlePosition(obs.portfolio[def.key][variant], item, resolved, curPrice, nowIso);
        }
      } else {
        stillActive.push(item);
      }
    }
    data.active = stillActive;
  }

  // 2) 保存済みの固定目標に対する到達判定（目標は前回のJST日付切替時点の値）
  //    市場時間外は価格が前日終値のまま動かず、執行不可能な価格での到達＝購入になるため判定しない
  const marketOpen = isMarketHoursJst();
  if (!marketOpen) console.log("市場時間外（JST平日9:00〜15:30以外）のため新規到達判定をスキップ");
  for (const def of modeDefs) {
    if (!marketOpen) break;
    const data = obs[def.key];
    const activeCodes = new Set(data.active.map((it) => it.code));
    for (const [code, target] of Object.entries(obs.targets)) {
      if (activeCodes.has(code)) continue;
      const curPrice = priceMap[code];
      if (!Number.isFinite(curPrice)) continue;
      const buy = Number(target.buy);
      const sl = Number(target.sl);
      if (!Number.isFinite(buy) || buy <= 0) continue;
      // すでに損切ライン以下まで崩れている場合はエントリー機会として不適切なので追跡しない
      if (Number.isFinite(sl) && curPrice <= sl) continue;
      // ゆるめは buy×1.02 だが、目標設定時の基準価格×0.999 を上限にする
      // （buyの割引率が2%未満だと ×1.02 が基準価格を超え、下がっていないのに即到達するため）
      const refPrice = Number(target.price);
      let threshold = buy * def.factor;
      if (def.factor !== 1 && Number.isFinite(refPrice) && refPrice > 0) {
        threshold = Math.min(threshold, refPrice * RELAX_REF_CAP);
      }
      if (curPrice <= threshold) {
        data.active.push({
          code,
          name: target.name || code,
          buy,
          tp: Number.isFinite(Number(target.tp)) ? Number(target.tp) : null,
          sl: Number.isFinite(sl) ? sl : null,
          signal: target.signal || "見送り",
          targetSetAt: target.setDate || null,
          hitAt: nowIso,
          hitPrice: curPrice
        });
        activeCodes.add(code);
        summary.hits[def.key] += 1;

        // 仮想資金: 到達＝購入（fixed=100万円分・unit=1単元100株 の両方式で並行運用）。
        // 見送り・監視継続シグナルは購入対象外（対照群）、資金不足はスキップ記録
        if (BUY_CATEGORIES.has(getCategoryLabel(target.signal))) {
          // 通知は銘柄×モード単位（標準/ゆるめは達成基準もタイミングも違うため別通知）。
          // fixed/unit は同基準・同タイミングなので同じイベントにまとめる。
          const evKey = `${code}__${def.key}`;
          for (const variant of PF_VARIANTS) {
            const result = tryBuy(obs.portfolio[def.key][variant], variant, code, target.name || code, target.signal || "見送り", curPrice, nowIso);
            if (!buyEvents[evKey]) {
              buyEvents[evKey] = {
                code,
                name: target.name || code,
                mode: def.key,
                category: getCategoryLabel(target.signal),
                factor: def.factor,
                threshold,
                price: curPrice,
                buy,
                tp: Number.isFinite(Number(target.tp)) ? Number(target.tp) : null,
                sl: Number.isFinite(sl) ? sl : null,
                entries: []
              };
            }
            buyEvents[evKey].entries.push({ variant, ...result });
          }
        }
      }
    }
  }

  // 3) 目標の更新: 統合ランキング上位の個別株について、JST日付が変わった最初の実行で buy/tp/sl を固定
  //    圏外に落ちた銘柄の目標は削除（アクティブ分の決済追跡には影響しない）
  const ranked = selectRankedStocks(allStocks, TARGET_LIMIT);
  const rankedCodes = new Set(ranked.map((s) => String(s.code || "").trim()));
  for (const code of Object.keys(obs.targets)) {
    if (!rankedCodes.has(code)) delete obs.targets[code];
  }
  for (const stock of ranked) {
    const code = String(stock.code || "").trim();
    const buy = Number(stock.buy);
    if (!code || !Number.isFinite(buy) || buy <= 0) continue;
    const existing = obs.targets[code];
    // price（基準価格）を持たない旧形式の目標は、ゆるめの上限判定ができないため当日中でも再固定する
    if (existing && existing.setDate === today && Number.isFinite(Number(existing.price))) continue;
    const price = Number(stock.price);
    obs.targets[code] = {
      name: stock.name || code,
      buy,
      price: Number.isFinite(price) && price > 0 ? price : null,
      tp: Number.isFinite(Number(stock.tp)) ? Number(stock.tp) : null,
      sl: Number.isFinite(Number(stock.sl)) ? Number(stock.sl) : null,
      signal: stock.signal || "見送り",
      setDate: today
    };
  }

  // 4) 仮想資金の評価額を最新価格で算出（価格が取れない保有銘柄は取得額で据え置き評価）
  for (const key of ["standard", "relax"]) {
    for (const variant of PF_VARIANTS) {
      const pf = obs.portfolio[key][variant];
      let positionValue = 0;
      let invested = 0;
      for (const [code, pos] of Object.entries(pf.positions)) {
        const cur = priceMap[code];
        positionValue += Number.isFinite(cur) ? Number(pos.shares) * cur : Number(pos.investedAmount);
        invested += Number(pos.investedAmount);
      }
      pf.positionValue = Math.round(positionValue);
      pf.unrealizedPnl = Math.round(positionValue - invested);
      pf.equity = Math.round(Number(pf.cash) + positionValue);
      pf.updatedAt = nowIso;
    }
  }

  // 5) 実戦候補の優先順位: 4バケットを損益率でランク付けし、同率は STRUCTURAL_PRIORITY 順。
  //    どの通知・方式を実弾に使うか絞るための表示用（観測スペースのバッジ / LINE通知に反映）。
  const rankedCandidates = STRUCTURAL_PRIORITY.map((c, idx) => {
    const pf = obs.portfolio[c.mode][c.variant];
    const initial = Number(pf.initialCapital) || INITIAL_CAPITAL;
    return {
      mode: c.mode,
      variant: c.variant,
      equity: pf.equity,
      pnlPct: Number((((pf.equity - initial) / initial) * 100).toFixed(3)),
      decided: (Number(pf.tpCount) || 0) + (Number(pf.slCount) || 0),
      structuralOrder: idx
    };
  }).sort((a, b) => (b.pnlPct - a.pnlPct) || (a.structuralOrder - b.structuralOrder));
  const pcts = rankedCandidates.map((c) => c.pnlPct);
  obs.candidateRanking = {
    // basis: structural=まだ成績差が無く初期優先度で並んでいる / equity=損益率の実績で並んでいる
    basis: Math.max(...pcts) === Math.min(...pcts) ? "structural" : "equity",
    rankedAt: nowIso,
    items: rankedCandidates.map((c, i) => ({ rank: i + 1, ...c }))
  };

  obs.source = "github-actions-integrated-obs";
  obs.updatedAt = nowIso;
  obs.marketUpdatedAt = treasure.marketUpdatedAt || treasure.updatedAt || null;

  writeJson(obsPath, obs);

  // 新規に買い目標到達した銘柄を 1銘柄=1通 でLINE通知（4バケットの買い/資金不足を本文に併記）。
  const rankMap = Object.fromEntries(obs.candidateRanking.items.map((c) => [`${c.mode}:${c.variant}`, c.rank]));
  const notifyCodes = Object.keys(buyEvents);
  let notified = 0;
  for (const code of notifyCodes) {
    if (await sendLine(buildBuyMessage(buyEvents[code], rankMap))) notified += 1;
  }

  console.log(JSON.stringify({
    ...summary,
    marketOpen,
    notified,
    targets: Object.keys(obs.targets).length,
    standardActive: obs.standard.active.length,
    relaxActive: obs.relax.active.length,
    portfolio: Object.fromEntries(["standard", "relax"].map((key) => [key,
      Object.fromEntries(PF_VARIANTS.map((variant) => {
        const pf = obs.portfolio[key][variant];
        return [variant, { equity: pf.equity, cash: pf.cash, positions: Object.keys(pf.positions).length }];
      }))
    ])),
    updatedAt: nowIso
  }));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
