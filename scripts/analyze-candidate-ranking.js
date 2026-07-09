// candidateRanking（実戦候補 第1〜第6）のロジックが機能するかの検証ツール。
//
// backtest-strategy.js が保存する data-cache/backtest-trades-{standard,relax}.json（本番同等・
// 地合いフィルタOFF）を使い、観測スペースの6バケット（標準/ゆるめ × 100万固定/1単元/リスク均等）の
// 資金運用を過去5年ぶんそのまま再現する。そのうえで update-integrated-obs.js と同じ順位付けルール
// （決済 tp+sl 合計が10件未満は初期優先度 / 以降は損益率順）を毎月末に適用し、
//   - 順位が「5年後の真の成績順」にどれだけ早く・安定して収束するか
//   - 第1候補がどれくらいの頻度で入れ替わるか（ノイズ度）
// を測る。ライブとの差異: ライブの equity は含み損益込みだが、ここでは実現損益のみで近似。
// ライブの購入対象(統合買い候補+確認候補)は tierA+tierB で近似（tierCは対照群相当なので除外）。
//
// 使い方: node scripts/backtest-strategy.js を先に実行してから node scripts/analyze-candidate-ranking.js

const fs = require("fs");
const path = require("path");

const cacheDir = path.join(path.resolve(__dirname, ".."), "data-cache");
const INITIAL = 50000000;
const BUDGET = 1000000;
const UNIT_SHARES = 100;
const RISK_BUDGET = 50000;
const RISK_MAX_COST = 5000000;
const MIN_DECIDED_FOR_EQUITY = 10; // update-integrated-obs.js と同値

// update-integrated-obs.js の STRUCTURAL_PRIORITY と同じ並び（2026-07-09、本ツールの5年再現の実現損益順）
const STRUCTURAL_PRIORITY = [
  { mode: "relax", variant: "fixed" },
  { mode: "standard", variant: "fixed" },
  { mode: "relax", variant: "risk" },
  { mode: "standard", variant: "risk" },
  { mode: "relax", variant: "unit" },
  { mode: "standard", variant: "unit" }
];

function loadTrades(mode) {
  const p = path.join(cacheDir, `backtest-trades-${mode}.json`);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  // ライブが仮想購入する区分（統合買い候補+確認候補）を tierA+tierB で近似
  return data.trades.filter((t) => t.tier !== "tierC(その他)");
}

// 方式ごとの購入コスト。買えない条件（リスク計算不能）は null。
function costOf(variant, trade) {
  const entry = trade.entry;
  if (variant === "fixed") return BUDGET;
  if (variant === "unit") return Math.round(UNIT_SHARES * entry);
  // risk: 損切までの値幅から株数を逆算（update-integrated-obs.js の tryBuy と同じ）
  const riskPerShare = Number.isFinite(trade.sl) ? entry - trade.sl : NaN;
  if (!Number.isFinite(riskPerShare) || riskPerShare <= 0) return null;
  let cost = Math.round((RISK_BUDGET / riskPerShare) * entry);
  if (cost > RISK_MAX_COST) cost = RISK_MAX_COST;
  return cost;
}

// 1バケットの5年運用を再現。月末ごとの実現損益スナップショットと決済数を返す。
// 日付ごとに 決済(前日以前の建玉)→購入→決済(当日建て・当日決済ぶん) の順で処理する。
// 単純な「決済イベント→購入イベント」の時系列処理だと、エントリー当日に損切した取引が
// 「決済イベントが購入より先に流れて空振り→永久保有」になり資金が漏れるため。
function simulateBucket(trades, variant) {
  const byEntryDate = new Map();
  for (const t of trades) {
    if (!byEntryDate.has(t.entryDate)) byEntryDate.set(t.entryDate, []);
    byEntryDate.get(t.entryDate).push(t);
  }
  const dates = [...new Set(trades.flatMap((t) => [t.entryDate, t.exitDate]))].sort();

  let cash = INITIAL;
  let realized = 0;
  let tp = 0;
  let sl = 0;
  let skipped = 0;
  let held = []; // { t, cost }
  const monthly = new Map(); // "YYYY-MM" -> { realizedPnl, decided }
  const settle = (date) => {
    const remain = [];
    for (const pos of held) {
      if (pos.t.exitDate > date) { remain.push(pos); continue; }
      const proceeds = pos.cost * (1 + pos.t.pnlPct / 100);
      cash += proceeds;
      realized += proceeds - pos.cost;
      if (pos.t.result === "tp") tp += 1;
      else if (pos.t.result === "sl") sl += 1;
    }
    held = remain;
  };
  for (const date of dates) {
    settle(date);
    for (const t of byEntryDate.get(date) || []) {
      const cost = costOf(variant, t);
      if (cost == null) { skipped += 1; continue; }
      if (cash >= cost) {
        cash -= cost;
        held.push({ t, cost });
      } else {
        skipped += 1;
      }
    }
    settle(date); // 当日建て・当日決済（エントリー日の損切/利確）ぶん
    monthly.set(date.slice(0, 7), { realizedPnl: realized, decided: tp + sl });
  }
  return { monthly, realized, decided: tp + sl, tp, sl, skipped };
}

function main() {
  const tradesByMode = { standard: loadTrades("standard"), relax: loadTrades("relax") };
  const buckets = STRUCTURAL_PRIORITY.map((c, idx) => ({
    ...c,
    key: `${c.mode}/${c.variant}`,
    structuralOrder: idx,
    sim: simulateBucket(tradesByMode[c.mode], c.variant)
  }));

  console.log("===== 6バケット 5年運用の最終成績（実現損益のみ・tierA+tierB≈買い対象区分） =====");
  const finalOrder = [...buckets].sort((a, b) => b.sim.realized - a.sim.realized);
  for (const [i, b] of finalOrder.entries()) {
    const pct = ((b.sim.realized / INITIAL) * 100).toFixed(1);
    console.log(`真の${i + 1}位: ${b.key}  +${Math.round(b.sim.realized / 10000).toLocaleString()}万円 (${pct}%) 決済${b.sim.decided}件(利確${b.sim.tp}/損切${b.sim.sl}) スキップ${b.sim.skipped}件`);
  }
  const trueBest = finalOrder[0].key;

  // 毎月末に update-integrated-obs.js と同じ順位付けを適用
  const months = [...new Set(buckets.flatMap((b) => [...b.sim.monthly.keys()]))].sort();
  const latest = new Map(buckets.map((b) => [b.key, { realizedPnl: 0, decided: 0 }]));
  let firstEquityMonth = null;
  let prevTop = null;
  let topChanges = 0;
  const topCount = {};
  let monthsRanked = 0;
  let trueBestOnTop = 0;
  let relaxAboveStandard = 0;
  for (const m of months) {
    for (const b of buckets) {
      const snap = b.sim.monthly.get(m);
      if (snap) latest.set(b.key, snap);
    }
    const cands = buckets.map((b) => ({
      key: b.key,
      mode: b.mode,
      structuralOrder: b.structuralOrder,
      pnlPct: (latest.get(b.key).realizedPnl / INITIAL) * 100,
      decided: latest.get(b.key).decided
    }));
    const totalDecided = cands.reduce((s, c) => s + c.decided, 0);
    const pcts = cands.map((c) => c.pnlPct);
    const useEquity = totalDecided >= MIN_DECIDED_FOR_EQUITY && Math.max(...pcts) !== Math.min(...pcts);
    if (useEquity && !firstEquityMonth) firstEquityMonth = m;
    const ranked = [...cands].sort(useEquity
      ? (a, b) => (b.pnlPct - a.pnlPct) || (a.structuralOrder - b.structuralOrder)
      : (a, b) => a.structuralOrder - b.structuralOrder);
    if (!useEquity) continue;
    monthsRanked += 1;
    const top = ranked[0].key;
    topCount[top] = (topCount[top] || 0) + 1;
    if (top === trueBest) trueBestOnTop += 1;
    if (prevTop && top !== prevTop) topChanges += 1;
    prevTop = top;
    const bestRelax = Math.min(...ranked.map((c, i) => (c.mode === "relax" ? i : 99)));
    const bestStd = Math.min(...ranked.map((c, i) => (c.mode === "standard" ? i : 99)));
    if (bestRelax < bestStd) relaxAboveStandard += 1;
  }

  console.log(`\n===== 順位付けロジックの挙動（月末${monthsRanked}回判定） =====`);
  console.log(`equity基準に切替わった月: ${firstEquityMonth}（決済合計${MIN_DECIDED_FOR_EQUITY}件到達）`);
  console.log(`第1候補の入れ替わり: ${topChanges}回 / ${monthsRanked}ヶ月`);
  console.log(`第1候補の内訳: ${Object.entries(topCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}ヶ月`).join(" / ")}`);
  console.log(`「真の1位(${trueBest})」が第1候補だった月: ${trueBestOnTop}/${monthsRanked} (${((trueBestOnTop / monthsRanked) * 100).toFixed(0)}%)`);
  console.log(`ゆるめ系が標準系より上位だった月: ${relaxAboveStandard}/${monthsRanked} (${((relaxAboveStandard / monthsRanked) * 100).toFixed(0)}%)`);
}

main();
