// 買い目標到達 観測スペースのサーバー側トラッカー。
// GitHub Actions から20分ごとに実行され、結果を data/integrated-obs.json として公開する。
// これにより全端末で同じ観測状態・利確/損切カウントが共有される（従来はブラウザ毎のlocalStorage）。
//
// 到達判定の仕組み:
//   買い目標(buy)は毎回 現在価格×(1-0.5〜3%) で再計算されるため、同一スナップショット内では
//   price <= buy が構造的に成立しない。そこで「JST日付ごとに最初の実行時点の buy/tp/sl を固定保存」し、
//   以降の実行で現在価格がその固定目標に到達したかを判定する。
//   - 標準モード: price <= buy（目標として保存した水準まで実際に下がったら追跡開始）
//   - ゆるめモード: price <= buy × 1.02
// 対象は統合銘柄ランキング上位の個別株（TARGET_LIMIT件、ETF/REIT/指数連動を除く）。
// 利確/損切は全銘柄の最新価格で判定する（ランキング圏外に落ちた銘柄も決済まで追跡）。

const fs = require("fs");
const path = require("path");

const RELAX_FACTOR = 1.02;
const TARGET_LIMIT = 15; // 標準表示10件 + ゆるめ表示15件をカバー
const CLOSED_LIMIT = 80;

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
  return obs;
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

function main() {
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
      } else {
        stillActive.push(item);
      }
    }
    data.active = stillActive;
  }

  // 2) 保存済みの固定目標に対する到達判定（目標は前回のJST日付切替時点の値）
  for (const def of modeDefs) {
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
      if (curPrice <= buy * def.factor) {
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
    if (existing && existing.setDate === today) continue;
    obs.targets[code] = {
      name: stock.name || code,
      buy,
      tp: Number.isFinite(Number(stock.tp)) ? Number(stock.tp) : null,
      sl: Number.isFinite(Number(stock.sl)) ? Number(stock.sl) : null,
      signal: stock.signal || "見送り",
      setDate: today
    };
  }

  obs.source = "github-actions-integrated-obs";
  obs.updatedAt = nowIso;
  obs.marketUpdatedAt = treasure.marketUpdatedAt || treasure.updatedAt || null;

  writeJson(obsPath, obs);
  console.log(JSON.stringify({
    ...summary,
    targets: Object.keys(obs.targets).length,
    standardActive: obs.standard.active.length,
    relaxActive: obs.relax.active.length,
    updatedAt: nowIso
  }));
}

main();
