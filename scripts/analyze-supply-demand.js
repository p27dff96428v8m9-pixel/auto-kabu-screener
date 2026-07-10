// 需給データ（信用残・空売り比率）の予測力検証ツール。
//
// Standard月に収穫した data-cache/margin-interest.json（銘柄別・週次）と
// data-cache/short-ratio.json（33業種・日次）を、10年バックテストの取引
// (data-cache/backtest-trades-relax.json・買い対象区分) に紐付けて、
// エントリー時点で公表済みだった需給状態ごとに勝率・平均損益を層別する。
//
// 先読み防止:
//   - 信用残は「エントリー日の4日以上前の週末日付」の最新行のみ使用（公表ラグを考慮）
//   - 空売り比率は「エントリー前日まで」の値のみ使用
//   - 空売り比率は業種ごとに水準が違うため、直近250営業日内のパーセンタイルに正規化
//
// 採用判断の基準（過学習防止）: バケット間に単調で大きな差があり、かつ期間前半(2016-2021)と
// 後半(2021-2026)の両方で同じ方向に出る場合のみ、スコアへの組み込みを検討する。
//
// 使い方: node scripts/analyze-supply-demand.js
//   （要: node scripts/backtest-strategy.js 実行済み + fetch-margin-short.js 収穫済み）

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, "data-cache");
const JQUANTS_V2_BASE_URL = process.env.JQUANTS_V2_BASE_URL || "https://api.jquants.com/v2";

function loadDotEnv() {
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    if (process.env[m[1]] == null || process.env[m[1]] === "") {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

// 銘柄→33業種コードの対応（equities/masterから1回取得してキャッシュ）
async function loadSectorMap() {
  const cachePath = path.join(cacheDir, "master-s33.json");
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if ((Date.now() - Date.parse(cache.fetchedAt)) / 86400000 < 30) return cache.map;
  } catch { /* 取得へ */ }
  const key = process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN;
  const res = await fetch(`${JQUANTS_V2_BASE_URL}/equities/master`, { headers: { "x-api-key": key } });
  if (!res.ok) throw new Error(`master取得失敗 HTTP ${res.status}`);
  const rows = (await res.json()).data || [];
  const map = {};
  for (const r of rows) {
    const code5 = String(r.Code || "");
    if (/^\d{4}0$/.test(code5) && r.S33 && r.S33 !== "-") map[code5.slice(0, 4)] = String(r.S33);
  }
  fs.writeFileSync(cachePath, JSON.stringify({ fetchedAt: new Date().toISOString(), map }));
  return map;
}

function daysDiff(a, b) {
  return (Date.parse(b) - Date.parse(a)) / 86400000;
}

// date以前(含む)で最後の行の添字（二分探索）
function lastIndexOnOrBefore(rows, date) {
  let lo = 0;
  let hi = rows.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].date <= date) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  return ans;
}

function agg(list) {
  const n = list.length;
  if (!n) return { n: 0, winPct: null, avgPnlPct: null };
  const dec = list.filter((t) => t.result !== "timeout");
  const tp = dec.filter((t) => t.result === "tp").length;
  return {
    n,
    winPct: dec.length ? Number(((tp / dec.length) * 100).toFixed(1)) : null,
    avgPnlPct: Number((list.reduce((s, t) => s + t.pnlPct, 0) / n).toFixed(2))
  };
}

function show(label, list) {
  const a = agg(list);
  console.log(`  ${label}: ${a.n}件 勝率${a.winPct != null ? a.winPct + "%" : "—"} 平均${a.avgPnlPct != null ? a.avgPnlPct + "%" : "—"}`);
}

// 前半/後半で同方向かの頑健性チェック
function robustness(label, list, splitDate = "2021-07-01") {
  const first = list.filter((t) => t.entryDate < splitDate);
  const second = list.filter((t) => t.entryDate >= splitDate);
  const a = agg(first);
  const b = agg(second);
  console.log(`    └ 前半(〜2021): ${a.n}件 平均${a.avgPnlPct}% ／ 後半(2021〜): ${b.n}件 平均${b.avgPnlPct}%`);
}

async function main() {
  loadDotEnv();
  const trades = JSON.parse(fs.readFileSync(path.join(cacheDir, "backtest-trades-relax.json"), "utf8")).trades
    .filter((t) => t.tier !== "tierC(その他)");
  const marginRaw = JSON.parse(fs.readFileSync(path.join(cacheDir, "margin-interest.json"), "utf8")).data;
  const shortRaw = JSON.parse(fs.readFileSync(path.join(cacheDir, "short-ratio.json"), "utf8")).data;
  const sectorMap = await loadSectorMap();

  // 信用残: code -> [{date, ratio(信用倍率), long}] 昇順
  const margin = {};
  for (const [code, rows] of Object.entries(marginRaw)) {
    margin[code] = rows
      .map((r) => ({ date: String(r.Date), long: Number(r.LongVol), shrt: Number(r.ShrtVol) }))
      .filter((r) => Number.isFinite(r.long) && Number.isFinite(r.shrt) && r.shrt >= 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // 空売り比率: s33 -> [{date, ratio}] 昇順 + 250日パーセンタイル
  const shortPct = {}; // s33 -> [{date, pctile}]
  for (const [s33, rows] of Object.entries(shortRaw)) {
    const seq = rows
      .map((r) => {
        const total = Number(r.SellExShortVa) + Number(r.ShrtWithResVa) + Number(r.ShrtNoResVa);
        const shorts = Number(r.ShrtWithResVa) + Number(r.ShrtNoResVa);
        return { date: String(r.Date), ratio: total > 0 ? shorts / total : null };
      })
      .filter((r) => r.ratio != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    shortPct[s33] = seq.map((r, i) => {
      const win = seq.slice(Math.max(0, i - 250), i); // 当日を含めない=前日までの分布
      if (win.length < 60) return { date: r.date, pctile: null };
      const below = win.filter((x) => x.ratio <= r.ratio).length;
      return { date: r.date, pctile: (below / win.length) * 100 };
    });
  }

  // 取引に需給指標を付与
  const enriched = trades.map((t) => {
    let marginRatio = null;
    let longChg4w = null;
    const mrows = margin[t.code];
    if (mrows && mrows.length) {
      // 公表ラグ: エントリー4日以上前の週末データまで
      const cutoff = new Date(Date.parse(t.entryDate) - 4 * 86400000).toISOString().slice(0, 10);
      const i = lastIndexOnOrBefore(mrows, cutoff);
      if (i >= 0) {
        const row = mrows[i];
        if (daysDiff(row.date, t.entryDate) <= 21) { // 3週間より古いデータは無効扱い
          marginRatio = row.shrt > 0 ? row.long / row.shrt : null;
          if (i >= 4 && mrows[i - 4].long > 0) longChg4w = row.long / mrows[i - 4].long;
        }
      }
    }
    let shortPctile = null;
    const s33 = sectorMap[t.code];
    if (s33 && shortPct[s33]) {
      const prevDay = new Date(Date.parse(t.entryDate) - 1 * 86400000).toISOString().slice(0, 10);
      const i = lastIndexOnOrBefore(shortPct[s33], prevDay);
      if (i >= 0 && daysDiff(shortPct[s33][i].date, t.entryDate) <= 7) shortPctile = shortPct[s33][i].pctile;
    }
    return { ...t, marginRatio, longChg4w, shortPctile };
  });

  console.log(`対象: ${enriched.length}件（ゆるめ・買い対象区分・10年）`);
  console.log(`ベースライン: ${JSON.stringify(agg(enriched))}\n`);

  console.log("== ① 信用倍率（買い残÷売り残・前週時点）別 ==");
  const mrBuckets = [["売り残優勢(<1倍)", (v) => v < 1], ["1〜3倍", (v) => v >= 1 && v < 3], ["3〜6倍", (v) => v >= 3 && v < 6], ["6倍以上(買い残過多)", (v) => v >= 6]];
  for (const [label, f] of mrBuckets) {
    const list = enriched.filter((t) => t.marginRatio != null && f(t.marginRatio));
    show(label, list);
    if (list.length > 200) robustness(label, list);
  }
  show("データなし", enriched.filter((t) => t.marginRatio == null));

  console.log("\n== ② 信用買い残の4週変化率別 ==");
  const chgBuckets = [["減少(<0.9)", (v) => v < 0.9], ["横ばい(0.9〜1.1)", (v) => v >= 0.9 && v <= 1.1], ["増加(>1.1)", (v) => v > 1.1]];
  for (const [label, f] of chgBuckets) {
    const list = enriched.filter((t) => t.longChg4w != null && f(t.longChg4w));
    show(label, list);
    if (list.length > 200) robustness(label, list);
  }

  console.log("\n== ③ 業種の空売り比率パーセンタイル（前日・過去250日内）別 ==");
  const spBuckets = [["低水準(<25%)", (v) => v < 25], ["中位(25〜75%)", (v) => v >= 25 && v <= 75], ["高水準(>75%)", (v) => v > 75]];
  for (const [label, f] of spBuckets) {
    const list = enriched.filter((t) => t.shortPctile != null && f(t.shortPctile));
    show(label, list);
    if (list.length > 200) robustness(label, list);
  }
  show("データなし", enriched.filter((t) => t.shortPctile == null));
}

main().catch((e) => { console.error(e); process.exit(1); });
