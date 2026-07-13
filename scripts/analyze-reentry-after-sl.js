// 損切直後の再エントリーの成績検証。
//
// 背景: ランキング選定と決済判定は独立しているため、朝に損切した銘柄がその夜の
// 前夜ダイジェスト（明日の買い目標予告）に再登場しうる（実例: 2026-07-13 ジンズHD 3046）。
// 「損切から間もない再エントリーは成績が落ちるのか」をバックテストの全トレードで検証し、
// 落ちるならフィルタ化、差がなければ表示（⚠️マーク）も含めて何もしない、の判断材料にする。
//
// 方法: backtest-strategy.js が保存した全トレードを銘柄ごとにエントリー日順に並べ、
// 各トレードを「同一銘柄の直前トレードの決済結果と、決済→再エントリーの間隔（暦日）」で分類。
// 直前が損切のグループを間隔別に、直前が利確/時間切れ・初回エントリーと比較する。
//
// 使い方: node scripts/analyze-reentry-after-sl.js
// 入力:   data-cache/backtest-trades-standard.json / backtest-trades-relax.json（ローカルキャッシュ）
// 出力:   コンソールのみ（判断材料。公開データには載せない）

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function summarize(list) {
  if (!list.length) return null;
  const n = list.length;
  const tp = list.filter((t) => t.result === "tp").length;
  const sl = list.filter((t) => t.result === "sl").length;
  const timeout = n - tp - sl;
  const winPct = tp + sl ? (tp / (tp + sl)) * 100 : null;
  const avgPnl = list.reduce((a, t) => a + t.pnlPct, 0) / n;
  return { n, tp, sl, timeout, winPct, avgPnl };
}

function fmt(label, s) {
  if (!s) return `${label}: 0件`;
  const win = s.winPct != null ? `${s.winPct.toFixed(1)}%` : "—";
  const sign = s.avgPnl >= 0 ? "+" : "";
  return `${label}: ${String(s.n).padStart(5)}件 勝率${win} 平均${sign}${s.avgPnl.toFixed(2)}% (利確${s.tp}/損切${s.sl}/時間切れ${s.timeout})`;
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function analyze(mode, file) {
  const trades = JSON.parse(fs.readFileSync(path.join(repoRoot, "data-cache", file), "utf8")).trades;

  // 銘柄ごとにエントリー日順へ並べ、各トレードに直前トレードの結果と間隔を付与する
  const byCode = new Map();
  for (const t of trades) {
    if (!byCode.has(t.code)) byCode.set(t.code, []);
    byCode.get(t.code).push(t);
  }
  const first = [];
  const afterTp = [];
  const afterTimeout = [];
  const afterSl = []; // { trade, gapDays }
  for (const list of byCode.values()) {
    list.sort((a, b) => String(a.entryDate).localeCompare(String(b.entryDate)));
    for (let i = 0; i < list.length; i++) {
      const prev = list[i - 1];
      if (!prev) { first.push(list[i]); continue; }
      if (prev.result === "tp") afterTp.push(list[i]);
      else if (prev.result === "timeout") afterTimeout.push(list[i]);
      else afterSl.push({ trade: list[i], gapDays: daysBetween(prev.exitDate, list[i].entryDate) });
    }
  }

  console.log(`\n===== ${mode} =====`);
  console.log(fmt("全体              ", summarize(trades)));
  console.log(fmt("初回エントリー    ", summarize(first)));
  console.log(fmt("直前が利確        ", summarize(afterTp)));
  console.log(fmt("直前が時間切れ    ", summarize(afterTimeout)));
  console.log(fmt("直前が損切(全体)  ", summarize(afterSl.map((x) => x.trade))));
  // 間隔別: ダイジェスト再登場の実況に近いのは「損切の翌日〜数日での再到達」
  const buckets = [
    ["  └ 3日以内      ", (g) => g <= 3],
    ["  └ 4〜7日       ", (g) => g >= 4 && g <= 7],
    ["  └ 8〜21日      ", (g) => g >= 8 && g <= 21],
    ["  └ 22日以上     ", (g) => g >= 22]
  ];
  for (const [label, cond] of buckets) {
    console.log(fmt(label, summarize(afterSl.filter((x) => cond(x.gapDays)).map((x) => x.trade))));
  }
}

analyze("標準モード", "backtest-trades-standard.json");
analyze("ゆるめモード", "backtest-trades-relax.json");
