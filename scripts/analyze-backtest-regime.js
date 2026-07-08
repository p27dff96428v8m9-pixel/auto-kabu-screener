// バックテスト結果の地合い別分解。
//
// backtest-strategy.js が保存した全トレード (data-cache/backtest-trades.json) を、
// 本番と同じ地合い定義（update-treasure-stocks.js の marketRegime: 1306終値 >= 25日SMA）で
// エントリー日時点の 強気/弱気 に分類し、局面別の勝率・平均損益・ドローダウンを出す。
// 2026-07-02 に地合いフィルタを「5年平均ではフィルタ無しが上」という根拠で撤去したが、
// 平均の裏で弱気局面がどれだけ足を引っ張っているか（＝下落相場での挙動）を可視化するのが目的。
//
// 使い方: node scripts/analyze-backtest-regime.js
// 入力:   data-cache/backtest-trades.json / data-cache/backtest-quotes.json（両方ローカルキャッシュ）
// 出力:   コンソールのみ（判断材料。公開データには載せない）

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const quotes = JSON.parse(fs.readFileSync(path.join(repoRoot, "data-cache", "backtest-quotes.json"), "utf8"));
const tradesFile = JSON.parse(fs.readFileSync(path.join(repoRoot, "data-cache", "backtest-trades.json"), "utf8"));
const trades = tradesFile.trades;

// ---- 1306 の日別レジーム（終値 >= 25日SMA で強気） ----
const bars = quotes.bars["1306"];
if (!bars || bars.length < 25) throw new Error("1306 bars not found in cache");
const regimeByDate = new Map(); // date -> { bullish, deviationPct }
for (let i = 24; i < bars.length; i++) {
  const closes = bars.slice(i - 24, i + 1).map((b) => b.close);
  const sma25 = closes.reduce((a, b) => a + b, 0) / 25;
  const current = bars[i].close;
  regimeByDate.set(bars[i].date, {
    bullish: current >= sma25,
    deviationPct: ((current - sma25) / sma25) * 100
  });
}
const regimeDates = [...regimeByDate.keys()].sort();

// エントリー日（銘柄側の営業日）が1306の日付に無い場合は直前の日付を使う
function regimeAt(date) {
  if (regimeByDate.has(date)) return regimeByDate.get(date);
  let lo = 0, hi = regimeDates.length - 1, ans = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (regimeDates[mid] <= date) { ans = regimeDates[mid]; lo = mid + 1; } else hi = mid - 1;
  }
  return ans ? regimeByDate.get(ans) : null;
}

// ---- 集計ヘルパー ----
function summarize(list) {
  if (!list.length) return null;
  const n = list.length;
  const wins = list.filter((t) => t.pnlPct > 0).length;
  const tp = list.filter((t) => t.result === "tp").length;
  const sl = list.filter((t) => t.result === "sl").length;
  const other = n - tp - sl;
  const sum = list.reduce((a, t) => a + t.pnlPct, 0);
  const hold = list.reduce((a, t) => a + (t.holdSessions || 0), 0) / n;
  // ドローダウン: 決済日順に1トレード=1単位で損益率を積み上げた曲線の最大落ち込み（%ポイント）
  const byExit = [...list].sort((a, b) => String(a.exitDate).localeCompare(String(b.exitDate)));
  let eq = 0, peak = 0, maxDd = 0;
  let streak = 0, worstStreak = 0;
  for (const t of byExit) {
    eq += t.pnlPct;
    if (eq > peak) peak = eq;
    if (peak - eq > maxDd) maxDd = peak - eq;
    if (t.pnlPct <= 0) { streak += 1; if (streak > worstStreak) worstStreak = streak; } else streak = 0;
  }
  return {
    trades: n,
    winPct: Number((100 * wins / n).toFixed(1)),
    tp, sl, other,
    avgPnlPct: Number((sum / n).toFixed(2)),
    totalPnlPct: Number(sum.toFixed(0)),
    avgHoldSessions: Number(hold.toFixed(1)),
    maxDrawdownPts: Number(maxDd.toFixed(0)),
    worstLoseStreak: worstStreak
  };
}

function printSummary(label, s) {
  if (!s) { console.log(`${label}: トレードなし`); return; }
  console.log(
    `${label}: ${s.trades}件 勝率${s.winPct}% (TP${s.tp}/SL${s.sl}/他${s.other}) ` +
    `平均${s.avgPnlPct >= 0 ? "+" : ""}${s.avgPnlPct}%/件 合計${s.totalPnlPct >= 0 ? "+" : ""}${s.totalPnlPct}pt ` +
    `平均保有${s.avgHoldSessions}営業日 最大DD ${s.maxDrawdownPts}pt 最長連敗${s.worstLoseStreak}`
  );
}

// ---- 分類・出力 ----
const classified = trades.map((t) => ({ ...t, regime: regimeAt(t.entryDate) })).filter((t) => t.regime);
const bull = classified.filter((t) => t.regime.bullish);
const bear = classified.filter((t) => !t.regime.bullish);

const bullDays = regimeDates.filter((d) => regimeByDate.get(d).bullish).length;
console.log(`データ: ${tradesFile.sltpMode}方式 ${classified.length}件 (${tradesFile.ranAt?.slice(0, 10)}実行) / ` +
  `1306レジーム: 強気${bullDays}日 弱気${regimeDates.length - bullDays}日 (${regimeDates[0]}〜${regimeDates[regimeDates.length - 1]})`);
console.log("");
console.log("── エントリー時の地合い別 ──");
printSummary("強気(1306 25日線以上)", summarize(bull));
printSummary("弱気(1306 25日線未満)", summarize(bear));

console.log("");
console.log("── 25日線からの乖離の深さ別 ──");
const buckets = [
  ["割れ -3%超", (d) => d < -3],
  ["割れ -3〜0%", (d) => d >= -3 && d < 0],
  ["上 0〜+3%", (d) => d >= 0 && d <= 3],
  ["上 +3%超", (d) => d > 3]
];
for (const [label, test] of buckets) {
  printSummary(label.padEnd(9, "　"), summarize(classified.filter((t) => test(t.regime.deviationPct))));
}

// 弱気局面の期間ごとの成績（どの下落局面で何が起きたか）
console.log("");
console.log("── 弱気局面（連続した25日線割れ期間）ごとの成績 ──");
const periods = [];
let cur = null;
for (const d of regimeDates) {
  if (!regimeByDate.get(d).bullish) {
    if (!cur) cur = { start: d, end: d };
    else cur.end = d;
  } else if (cur) { periods.push(cur); cur = null; }
}
if (cur) periods.push(cur);
for (const p of periods) {
  const inPeriod = classified.filter((t) => t.entryDate >= p.start && t.entryDate <= p.end);
  if (inPeriod.length < 5) continue; // 短すぎる期間は省略
  const s = summarize(inPeriod);
  printSummary(`${p.start}〜${p.end}`, s);
}

// 同日エントリーの集中（相関リスクの参考）
console.log("");
const byDay = new Map();
for (const t of classified) byDay.set(t.entryDate, (byDay.get(t.entryDate) || 0) + 1);
const top = [...byDay.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log(`── 同日エントリー集中 TOP5（相関リスク参考） ──`);
for (const [d, n] of top) {
  const r = regimeAt(d);
  console.log(`${d}: ${n}件 (${r && r.bullish ? "強気" : "弱気"})`);
}
