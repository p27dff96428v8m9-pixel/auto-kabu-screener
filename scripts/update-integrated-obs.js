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
//
// 価格の鮮度 (2026-07-08):
//   価格ソースの J-Quants 日足(EOD)は当日終値が18時台まで公開されないため、treasure-stocks.json の
//   価格だけでは場中の利確/損切・到達検知が原理的に不可能（みずほ利確が18:42通知になった実例）。
//   そこで判定対象の銘柄（保有中 active + 固定目標）に限り、より新しい場中価格で priceMap を
//   上書きして判定する。ソースは環境変数 OBS_PRICE_SOURCE で切り替え式:
//     yahoo     (既定) Yahoo Finance の遅延価格（約20分遅れ・APIキー不要）
//     tachibana 立花証券e支店API のリアルタイム価格（要口座。失敗時はyahooへ自動フォールバック）
//     off       上書きしない（従来のEODのみ。OBS_INTRADAY_PRICES=0 も同義・旧互換）
//   取得失敗時はEOD価格のまま判定する（従来動作）。
//
//   ★立花証券への切り替え手順（コード変更不要。口座開設後にGitHubのWeb画面だけで完了）:
//     1. https://www.e-shiten.jp/ で口座開設（無料）し、APIの利用申請をする
//     2. GitHubリポジトリの Settings > Secrets and variables > Actions を開く
//        - [Secrets] タブで New repository secret:
//            TACHIBANA_USER_ID  = e支店のログインID
//            TACHIBANA_PASSWORD = e支店のログインパスワード
//        - [Variables] タブで New repository variable:
//            OBS_PRICE_SOURCE = tachibana
//     3. 以後の実行から自動的にリアルタイム価格で判定される（切り戻しは変数を yahoo に変えるだけ）
//     ※価格取得だけなら第二パスワード（注文用）は不要。自動発注まで拡張する時に初めて必要になる。
//     ※APIのバージョンが上がってURLが変わったら Variables に TACHIBANA_API_BASE_URL を追加して
//       新URL（例 https://kabuka.e-shiten.jp/e_api_v4r6/）を設定すればよい。
// 地合い（marketRegime: TOPIX連動ETFの25日線判定）は参考情報として公開データに載せるのみで、
// エントリーは止めない。2026-07-02のバックテスト（5年×78銘柄）でフィルタ無しの方が
// 平均損益が良く（+1.63% vs +1.21%）、ユーザー判断でフィルタを撤去した。
// 対象は統合銘柄ランキング上位の個別株（TARGET_LIMIT件、ETF/REIT/指数連動を除く）。
// 利確/損切は全銘柄の最新価格で判定する（ランキング圏外に落ちた銘柄も決済まで追跡）。

const fs = require("fs");
const path = require("path");

const RELAX_FACTOR = 1.02;
const RELAX_REF_CAP = 0.999; // ゆるめしきい値の上限: 目標設定時の基準価格 × 0.999
const TARGET_LIMIT = 15; // 標準表示10件 + ゆるめ表示15件をカバー
const CLOSED_LIMIT = 80;

// 仮想資金シミュレーション: 観測スペースへの追加を「購入」とみなし、利確/損切で資金を増減させる。
// 3種類の購入ルールを並行運用して比較できるようにする:
//   fixed: 1銘柄100万円固定（端株可・S株/ミニ株想定）。全銘柄が同じ重み＝戦略の期待値がそのまま資金曲線に出る
//   unit : 1単元（100株）購入。実際の発注（単元株取引）の再現。銘柄ごとに投入額が変わる
//   risk : リスク均等（auto_trader.py の calc_lot_size と同じ考え方）。損切までの値幅から株数を逆算し、
//          どの銘柄も損切時の損失が RISK_BUDGET 円で揃う。損切幅が極端に狭い銘柄への過大集中を防ぐため
//          投入額は RISK_MAX_COST 円で頭打ち。損切ラインが無い銘柄は計算不能としてスキップ記録
// 購入するのは BUY_CATEGORIES のシグナル区分のみ。「見送り」は実運用で買わないため対象外。
// 「監視継続」は観測実績が利確0回/損切11回（2026-07-02時点、標準5+ゆるめ6）と一方的に悪いため対象外。
// どちらも観測・カウントには従来通り残す（対照群として引き続き検証する）。
// 資金不足時はスキップとして記録（資金管理の検証）。標準/ゆるめで別々の資金を運用する。
const INITIAL_CAPITAL = Number(process.env.OBS_INITIAL_CAPITAL || 50000000);
const TRADE_BUDGET = Number(process.env.OBS_TRADE_BUDGET || 1000000);
const UNIT_SHARES = 100;
const RISK_BUDGET = Number(process.env.OBS_RISK_BUDGET || 50000);
const RISK_MAX_COST = Number(process.env.OBS_RISK_MAX_COST || 5000000);
const PF_VARIANTS = ["fixed", "unit", "risk"];
const PF_HISTORY_LIMIT = 200;
const PF_SKIPPED_LIMIT = 40;
const BUY_CATEGORIES = new Set(["統合買い候補", "確認候補"]);

// 実戦候補の初期優先度（2026-07-02の検討結果）。成績（損益率）に差が付くまでの同率時の並び順:
//   標準 > ゆるめ … 標準は深い押し目(基準価格-0.5〜3%)エントリーでRR約2:1と構造的に有利。
//                    ゆるめは浅い押し目(-0.1%〜)で早く入る分、同じ利確/損切価格に対しRRが悪い
//   100万固定 > 1単元 … 全銘柄同額＝戦略の期待値がそのまま資金曲線に出る。1単元は株価で重みが偏る
// 損益率に差が出た後は評価額ベースで自動的に順位が入れ替わる（candidateRanking）。
// リスク均等（risk）は2026-07-03追加の新参で実績ゼロのため、既存4バケットの後ろ（第5・6候補）から開始する。
const STRUCTURAL_PRIORITY = [
  { mode: "standard", variant: "fixed" },
  { mode: "standard", variant: "unit" },
  { mode: "relax", variant: "fixed" },
  { mode: "relax", variant: "unit" },
  { mode: "standard", variant: "risk" },
  { mode: "relax", variant: "risk" }
];

// LINE通知（買い目標到達＝仮想購入時、および利確/損切＝決済時）。標準/ゆるめ × 方式（100万固定/1単元/リスク均等）の
// 結果を1銘柄=1通にまとめて送る。LINE_ACCESS_TOKEN / LINE_USER_ID 未設定なら自動スキップ。
const MODE_LABELS = { standard: "標準", relax: "ゆるめ" };
// 標準/ゆるめを一目で見分けるための色分け絵文字（LINEはプレーンテキストなので色付き絵文字で代用）。
const MODE_EMOJI = { standard: "🔵", relax: "🟠" };
const VARIANT_LABELS = { fixed: "100万固定", unit: "1単元", risk: "リスク均等" };
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

// 到達＝購入。variant に応じて 100万円分（端株）/ 1単元（100株）/ リスク均等分 を取得する。
// sl はリスク均等の株数逆算に使う（fixed/unit では未使用）。
function tryBuy(pf, variant, code, name, signal, price, nowIso, sl) {
  if (!pf.startedAt) pf.startedAt = nowIso;
  let shares;
  let cost;
  if (variant === "unit") {
    shares = UNIT_SHARES;
    cost = Math.round(UNIT_SHARES * price);
  } else if (variant === "risk") {
    // リスク均等: 損切時の損失が RISK_BUDGET 円になる株数 = RISK_BUDGET ÷ (現在値 − 損切ライン)
    const riskPerShare = Number.isFinite(Number(sl)) && Number(sl) > 0 ? price - Number(sl) : NaN;
    if (!Number.isFinite(riskPerShare) || riskPerShare <= 0) {
      const reason = "損切ライン不明のためリスク計算不可";
      pf.skipped.unshift({ code, name, signal, price, at: nowIso, reason });
      if (pf.skipped.length > PF_SKIPPED_LIMIT) pf.skipped.length = PF_SKIPPED_LIMIT;
      return { action: "skip", cost: 0, reason };
    }
    shares = Number((RISK_BUDGET / riskPerShare).toFixed(4));
    cost = Math.round(shares * price);
    if (cost > RISK_MAX_COST) {
      // 損切幅が極端に狭い銘柄への過大集中を防ぐ（投入額上限で頭打ち＝その分リスクも小さくなる）
      shares = Number((RISK_MAX_COST / price).toFixed(4));
      cost = Math.round(shares * price);
    }
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

// Yahoo Finance の chart API から遅延価格（東証は約20分遅れ）を1銘柄分取得する。
// APIキー不要。失敗（HTTPエラー/タイムアウト/形式不明）は null を返し、呼び出し側でEOD価格にフォールバックする。
async function fetchYahooDelayedPrice(code) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(code)}.T?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; auto-kabu-screener)" },
      signal: controller.signal
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice);
    if (!Number.isFinite(price) || price <= 0) return null;
    const time = Number(meta?.regularMarketTime);
    return { price, at: Number.isFinite(time) ? new Date(time * 1000).toISOString() : null };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── 立花証券 e支店 API（リアルタイム価格）──────────────────────────────
// 口座があれば無料でリアルタイム株価が取れる純RESTのAPI。GitHub Actionsから直接呼べる。
// 仕様: ログイン(CLMAuthLoginRequest)で仮想URL(sUrlPrice等)を受け取り、
//       時価取得(CLMMfdsGetMarketPrice)で現在値(pDPP)と時刻を取る。リクエストは
//       「仮想URL?URLエンコードしたJSON」のGET。詳細: https://www.e-shiten.jp/api/
const TACHIBANA_DEFAULT_BASE_URL = "https://kabuka.e-shiten.jp/e_api_v4r5/";

// p_sd_date 形式: "YYYY.MM.DD-HH:MM:SS.mmm"（JST）
function tachibanaNow() {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${jst.getUTCFullYear()}.${p(jst.getUTCMonth() + 1)}.${p(jst.getUTCDate())}` +
    `-${p(jst.getUTCHours())}:${p(jst.getUTCMinutes())}:${p(jst.getUTCSeconds())}.${p(jst.getUTCMilliseconds(), 3)}`;
}

async function tachibanaRequest(baseUrl, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${baseUrl}?${encodeURIComponent(JSON.stringify(payload))}`, { signal: controller.signal });
    if (!res.ok) return null;
    // 応答が Shift_JIS のことがあるため明示的にデコードする（UTF-8ならそのまま解釈できる）
    const buf = await res.arrayBuffer();
    let text;
    try { text = new TextDecoder("shift_jis").decode(buf); } catch { text = new TextDecoder().decode(buf); }
    if (/[�]/.test(text)) text = new TextDecoder().decode(buf);
    return JSON.parse(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// 立花証券からリアルタイム現在値をまとめて取得する。戻り値: { code: { price, at } } / 失敗時 null。
// 認証情報未設定・ログイン失敗・応答形式不明はすべて null を返し、呼び出し側が Yahoo にフォールバックする。
async function fetchTachibanaPrices(codes) {
  const userId = process.env.TACHIBANA_USER_ID;
  const password = process.env.TACHIBANA_PASSWORD;
  if (!userId || !password) {
    console.log("立花証券の認証情報(TACHIBANA_USER_ID/TACHIBANA_PASSWORD)が未設定");
    return null;
  }
  const base = String(process.env.TACHIBANA_API_BASE_URL || TACHIBANA_DEFAULT_BASE_URL).replace(/\/?$/, "/");
  let pNo = 1;
  const login = await tachibanaRequest(`${base}auth/`, {
    p_no: String(pNo++),
    p_sd_date: tachibanaNow(),
    sCLMID: "CLMAuthLoginRequest",
    sUserId: userId,
    sPassword: password,
    sJsonOfmt: "4"
  });
  if (!login || String(login.sResultCode) !== "0" || !login.sUrlPrice) {
    console.error(`立花証券ログイン失敗: ${login ? `sResultCode=${login.sResultCode} ${login.sResultText || ""}` : "応答なし/形式不明"}`);
    return null;
  }
  const quotes = {};
  try {
    for (let i = 0; i < codes.length; i += 50) {
      const chunk = codes.slice(i, i + 50);
      const res = await tachibanaRequest(login.sUrlPrice, {
        p_no: String(pNo++),
        p_sd_date: tachibanaNow(),
        sCLMID: "CLMMfdsGetMarketPrice",
        sTargetIssueCode: chunk.join(","),
        sTargetColumn: "pDPP,tDPP:T", // pDPP=現在値 / tDPP:T=現在値の時刻
        sJsonOfmt: "4"
      });
      const rows = (res && (res.aCLMMfdsMarketPrice || res.CLMMfdsMarketPrice)) || [];
      for (const row of rows) {
        const code = String(row.sIssueCode || "").trim();
        const price = Number(row.pDPP);
        if (code && Number.isFinite(price) && price > 0) quotes[code] = { price, at: row["tDPP:T"] || null };
      }
    }
  } finally {
    // ログアウトはベストエフォート（失敗してもセッションはタイムアウトで解放される）
    await tachibanaRequest(login.sUrlRequest || `${base}auth/`, {
      p_no: String(pNo++),
      p_sd_date: tachibanaNow(),
      sCLMID: "CLMAuthLogoutRequest",
      sJsonOfmt: "4"
    });
  }
  return Object.keys(quotes).length ? quotes : null;
}

// 判定用の場中価格ソースを決める。off / yahoo / tachibana（ファイル冒頭の切り替え手順コメント参照）
function resolvePriceSource() {
  if (process.env.OBS_INTRADAY_PRICES === "0") return "off"; // 旧スイッチ互換
  const v = String(process.env.OBS_PRICE_SOURCE || "yahoo").trim().toLowerCase();
  if (v === "0" || v === "off" || v === "none") return "off";
  return v === "tachibana" ? "tachibana" : "yahoo";
}

// 判定に使う銘柄（保有中 active + 固定目標）の価格を場中価格ソースで上書きする。
// EOD価格と2割以上乖離する値は銘柄不一致・株式分割等の異常とみなして採用しない。
async function refreshJudgePrices(priceMap, obs) {
  const source = resolvePriceSource();
  if (source === "off") return null;
  const codes = new Set();
  for (const key of ["standard", "relax"]) {
    for (const item of obs[key].active) codes.add(String(item.code));
  }
  for (const code of Object.keys(obs.targets)) codes.add(String(code));
  const codeList = [...codes];

  let quotes = null;
  let usedSource = "yahoo-delayed";
  if (source === "tachibana") {
    quotes = await fetchTachibanaPrices(codeList);
    if (quotes) usedSource = "tachibana-realtime";
    else console.log("立花証券APIから取得できないため Yahoo遅延価格にフォールバック");
  }
  if (!quotes) {
    quotes = {};
    for (const code of codeList) {
      const q = await fetchYahooDelayedPrice(code);
      if (q) quotes[code] = q;
    }
  }

  let refreshed = 0;
  let latestAt = null;
  for (const [code, quote] of Object.entries(quotes)) {
    const eod = priceMap[code];
    if (Number.isFinite(eod) && Math.abs(quote.price / eod - 1) > 0.2) continue;
    priceMap[code] = quote.price;
    refreshed += 1;
    if (quote.at && (!latestAt || String(quote.at) > String(latestAt))) latestAt = quote.at;
  }
  const label = usedSource === "tachibana-realtime" ? "立花証券リアルタイム価格" : "Yahoo遅延価格";
  console.log(`${label}で判定用価格を上書き: ${refreshed}/${codeList.length}件${latestAt ? `（最新気配 ${latestAt}）` : ""}`);
  return { source: usedSource, refreshed, total: codeList.length, latestQuoteAt: latestAt };
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
      // 端株(単元未満株)でそのまま発注できるよう全方式で株数を併記する。
      // fixed/risk は端数株になるため整数に丸め、金額も丸めた株数×到達価格で概算表示する
      // （観測スペースの損益計算は端株のまま。表示のみ実弾発注しやすい整数株にする）。
      let detail;
      if (e.variant === "unit") {
        detail = `${e.shares.toLocaleString()}株（${Math.round(e.cost).toLocaleString()}円）`;
      } else {
        const wholeShares = Math.round(Number(e.shares));
        const approxCost = Math.round(wholeShares * ev.price);
        detail = `約${wholeShares.toLocaleString()}株（約${approxCost.toLocaleString()}円）`;
      }
      lines.push(`${variant}: 買い ${detail}`);
    } else {
      lines.push(`${variant}: ${e.reason}`);
    }
  }
  lines.push(`詳細: ${PAGE_URL}`);
  return lines.join("\n");
}

// 利確/損切＝売却。保有していれば決済価格で現金に戻し、履歴に記録する。
// 戻り値: 記録した履歴レコード（保有していなければ null）。LINE通知の本文組み立てに使う。
function settlePosition(pf, item, exitType, exitPrice, nowIso) {
  const pos = pf.positions[item.code];
  if (!pos) return null;
  const proceeds = Math.round(Number(pos.shares) * exitPrice);
  const pnl = proceeds - Number(pos.investedAmount);
  pf.cash = Math.round(Number(pf.cash) + proceeds);
  pf.realizedPnl = Math.round(Number(pf.realizedPnl) + pnl);
  // 方式（100万固定/1単元/リスク均等）ごとの利確/損切回数を別々に集計する（観測スペースで分けて表示するため）。
  if (exitType === "tp") pf.tpCount = (Number(pf.tpCount) || 0) + 1;
  else if (exitType === "sl") pf.slCount = (Number(pf.slCount) || 0) + 1;
  const record = {
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
  };
  pf.history.unshift(record);
  if (pf.history.length > PF_HISTORY_LIMIT) pf.history.length = PF_HISTORY_LIMIT;
  delete pf.positions[item.code];
  return record;
}

// 1銘柄×1モードの利確/損切イベントをLINE本文に整形する。
// 実弾運用の判断材料になるよう、方式ごとの実現損益と実戦候補順位を併記する。
function buildSettleMessage(ev, rankMap) {
  const yen = (n) => `${Math.round(n).toLocaleString()}円`;
  const modeLabel = MODE_LABELS[ev.mode] || ev.mode;
  const emoji = ev.exitType === "tp" ? "✅" : "⚠️";
  const title = ev.exitType === "tp" ? "利確ライン到達" : "損切ライン到達";
  const lines = [
    `${emoji}${MODE_EMOJI[ev.mode] || ""}【${modeLabel}モード】${title}（仮想売買）`,
    `${ev.name} (${ev.code})`,
    `区分: ${ev.category || "—"}`,
    ev.exitType === "tp"
      ? `現在値 ${yen(ev.exitPrice)} ≥ 利確 ${ev.tp != null ? yen(ev.tp) : "—"}`
      : `現在値 ${yen(ev.exitPrice)} ≤ 損切 ${ev.sl != null ? yen(ev.sl) : "—"}`,
    "──────────"
  ];
  for (const e of ev.entries) {
    const rank = rankMap ? rankMap[`${ev.mode}:${e.variant}`] : null;
    const variant = (VARIANT_LABELS[e.variant] || e.variant) + (rank ? `〔第${rank}候補〕` : "");
    const sign = e.pnl >= 0 ? "+" : "";
    lines.push(`${variant}: ${sign}${yen(e.pnl)} (${sign}${e.pnlPct}%) 取得${yen(e.entryPrice)}→決済${yen(e.exitPrice)}`);
  }
  lines.push("──────────");
  lines.push(ev.exitType === "tp" ? "実弾保有中なら利益確定の検討を。" : "実弾保有中なら迷わず損切りを。");
  lines.push(`詳細: ${PAGE_URL}`);
  return lines.join("\n");
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

  // J-Quants(EOD)の価格を、判定対象銘柄だけ場中価格ソース（既定Yahoo遅延約20分/切替で立花証券リアルタイム）
  // で上書きして鮮度を補う。これにより利確/損切・買い目標到達を場中に検知できる。
  // 使ったソースは intradayPrices として公開し、観測スペースに「価格ソース」バッジで表示される。
  // off や全件取得失敗のときも状態を上書きし、前回実行の古い表示が残らないようにする。
  const intraday = await refreshJudgePrices(priceMap, obs);
  obs.intradayPrices = intraday
    ? { ...intraday, fetchedAt: nowIso }
    : { source: "eod-only", refreshed: 0, total: 0, latestQuoteAt: null, fetchedAt: nowIso };

  const summary = { settled: 0, hits: { standard: 0, relax: 0 } };
  // この実行で新たに買い目標到達した銘柄を集約（code -> 全方式の結果）。実行末に1銘柄=1通でLINE通知。
  const buyEvents = {};
  // この実行で利確/損切した銘柄×モードを集約。仮想資金で保有していた方式の実現損益を添えて1銘柄=1通でLINE通知。
  const settleEvents = {};

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

  // 0) 仮想資金を観測の保有状態(active)に同期する（塩漬け解消）。
  //    tryBuy は「新規に買い目標へ到達した瞬間」だけ買うため、仮想資金の方式が出揃う前から
  //    active に居座っている銘柄は永久に買い直されず、実現損益も決済LINE通知も出ない塩漬けになる。
  //    そこで毎回、active のBUY対象で仮想資金が未保有のものを到達価格(hitPrice)で買い直してキャッチアップさせる。
  //    観測の決済チェック(下記1)が active から tp/sl 到達を毎回除外するため、ここで買う銘柄は必ず tp と sl の間にあり
  //    即決済は起きない。買い直し自体は通知しない（過去分の一括買いは通知ノイズになるため）。以後の利確/損切で通常の決済通知が出る。
  let syncedBuys = 0;
  for (const def of modeDefs) {
    const data = obs[def.key];
    for (const item of data.active) {
      if (!BUY_CATEGORIES.has(getCategoryLabel(item.signal))) continue;
      const entryPrice = Number.isFinite(Number(item.hitPrice)) ? Number(item.hitPrice)
        : (Number.isFinite(Number(item.buy)) ? Number(item.buy) : NaN);
      if (!Number.isFinite(entryPrice) || entryPrice <= 0) continue;
      for (const variant of PF_VARIANTS) {
        const pf = obs.portfolio[def.key][variant];
        if (pf.positions[item.code]) continue; // 既に保有していれば何もしない（冪等）
        const res = tryBuy(pf, variant, item.code, item.name || item.code, item.signal || "見送り", entryPrice, item.hitAt || nowIso, item.sl);
        if (res && res.action === "buy") syncedBuys += 1;
      }
    }
  }
  if (syncedBuys > 0) console.log(`仮想資金を active に同期: ${syncedBuys}件を到達価格で買い直し`);

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
        summary.settled += 1;

        // 仮想資金: 保有している方式すべてを決済価格で売却し現金に戻す
        const settledEntries = [];
        for (const variant of PF_VARIANTS) {
          const record = settlePosition(obs.portfolio[def.key][variant], item, resolved, curPrice, nowIso);
          if (record) settledEntries.push({ variant, pnl: record.pnl, pnlPct: record.pnlPct, entryPrice: record.entryPrice, exitPrice: record.exitPrice });
        }

        // notifiedExit: この決済でLINE通知を出すか（仮想資金で保有していた＝買い到達通知済みの銘柄のみ true）。
        // 対照群（監視継続・見送り）や資金不足で未保有だったものは false になり、ページ側で「通知なし」バッジ表示に使う。
        data.closed.unshift({ ...item, exitType: resolved, exitPrice: curPrice, exitAt: nowIso, notifiedExit: settledEntries.length > 0 });
        if (data.closed.length > CLOSED_LIMIT) data.closed.length = CLOSED_LIMIT;
        // 仮想資金で保有していた（＝買い到達通知を出した）銘柄のみ決済もLINE通知する。
        // 対照群（見送り等）はエントリー通知が無いので決済通知も出さない。
        if (settledEntries.length) {
          settleEvents[`${item.code}__${def.key}`] = {
            code: item.code,
            name: item.name || item.code,
            mode: def.key,
            category: cat,
            exitType: resolved,
            exitPrice: curPrice,
            tp: item.tp,
            sl: item.sl,
            entries: settledEntries
          };
        }
      } else {
        stillActive.push(item);
      }
    }
    data.active = stillActive;
  }

  // 2) 保存済みの固定目標に対する到達判定（目標は前回のJST日付切替時点の値）
  //    市場時間外は価格が前日終値のまま動かず、執行不可能な価格での到達＝購入になるため判定しない
  //    地合い(regime)は参考表示のみ（バックテスト検証の結果、エントリー停止はしない）
  const marketOpen = isMarketHoursJst();
  const regime = treasure.marketRegime || null;
  const entryAllowed = marketOpen;
  if (!marketOpen) console.log("市場時間外（JST平日9:00〜15:30以外）のため新規到達判定をスキップ");
  // UI表示用に判定状態を公開データへ保存
  obs.entryGuard = { marketOpen, regime, entryAllowed, checkedAt: nowIso };
  for (const def of modeDefs) {
    if (!entryAllowed) break;
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
            const result = tryBuy(obs.portfolio[def.key][variant], variant, code, target.name || code, target.signal || "見送り", curPrice, nowIso, sl);
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

  // 新規に買い目標到達した銘柄を 1銘柄=1通 でLINE通知（全方式の買い/資金不足を本文に併記）。
  const rankMap = Object.fromEntries(obs.candidateRanking.items.map((c) => [`${c.mode}:${c.variant}`, c.rank]));
  const notifyCodes = Object.keys(buyEvents);
  let notified = 0;
  for (const code of notifyCodes) {
    if (await sendLine(buildBuyMessage(buyEvents[code], rankMap))) notified += 1;
  }

  // 利確/損切した銘柄も 1銘柄×モード=1通 でLINE通知（方式ごとの実現損益を本文に併記）。
  // 2026-07-03: auto_trader系の利確/損切通知を停止し、実弾判断はこちらの通知に一本化した。
  let settleNotified = 0;
  for (const key of Object.keys(settleEvents)) {
    if (await sendLine(buildSettleMessage(settleEvents[key], rankMap))) settleNotified += 1;
  }

  console.log(JSON.stringify({
    ...summary,
    marketOpen,
    regime: regime ? { index: regime.index, bullish: regime.bullish, deviationPct: regime.deviationPct } : null,
    entryAllowed,
    notified,
    settleNotified,
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
