// 決算またぎ回避の検証ツール。
//
// J-Quants /fins/statements の過去開示日(DisclosedDate)を全監視銘柄ぶん取得し、
// バックテスト取引(data-cache/backtest-trades-{standard,relax}.json)に
//   - 保有中に決算開示があったか(duringHold)
//   - エントリー時点で次の決算まで何日だったか(daysToEarnings)
// を付与して、決算またぎが成績とSLギャップ(損切ライン超えの滑り)に与える影響を測る。
// 最後に「発表N日前のエントリーを除外した場合」の成績変化をN=3/5/7で試算する。
//
// 使い方: node scripts/analyze-earnings-gap.js [--refresh]
//   開示日はdata-cache/disclosure-dates.jsonに7日キャッシュ。取引キャッシュは
//   node scripts/backtest-strategy.js を先に実行して生成しておくこと。

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "docs", "fund-flow-ai-system", "data");
const cacheDir = path.join(repoRoot, "data-cache");
const disclosureCachePath = path.join(cacheDir, "disclosure-dates.json");

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

const JQUANTS_V2_BASE_URL = process.env.JQUANTS_V2_BASE_URL || "https://api.jquants.com/v2";

async function fetchDisclosureDates(codes) {
  if (!process.argv.includes("--refresh") && fs.existsSync(disclosureCachePath)) {
    const cache = JSON.parse(fs.readFileSync(disclosureCachePath, "utf8"));
    const ageDays = (Date.now() - new Date(cache.fetchedAt).getTime()) / 86400000;
    if (ageDays < 7 && codes.every((c) => cache.dates[c])) {
      console.log(`開示日キャッシュ利用 (${cache.fetchedAt})`);
      return cache.dates;
    }
  }
  const apiKey = process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN;
  if (!apiKey) throw new Error("JQUANTS_API_KEY 未設定");
  const dates = {};
  for (const code of codes) {
    const norm = /^\d{4}$/.test(code) ? `${code}0` : code;
    try {
      const res = await fetch(`${JQUANTS_V2_BASE_URL}/fins/statements?code=${norm}`, { headers: { "x-api-key": apiKey } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows = data.statements || data.data || [];
      dates[code] = [...new Set(rows.map((r) => String(r.DisclosedDate || r.disclosedDate || "").slice(0, 10)).filter(Boolean))].sort();
      process.stdout.write(`${code}:${dates[code].length} `);
    } catch (e) {
      console.warn(`\n${code} 開示日取得失敗: ${e.message}`);
      dates[code] = [];
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log("");
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(disclosureCachePath, JSON.stringify({ fetchedAt: new Date().toISOString(), dates }, null, 1));
  return dates;
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function enrich(trades, discMap) {
  return trades.map((t) => {
    const disc = discMap[t.code] || [];
    const next = disc.find((d) => d >= t.entryDate);
    const duringHold = disc.some((d) => d > t.entryDate && d <= t.exitDate);
    return { ...t, daysToEarnings: next ? daysBetween(t.entryDate, next) : null, duringHold };
  });
}

function agg(list) {
  const n = list.length;
  if (!n) return { n: 0 };
  const dec = list.filter((t) => t.result !== "timeout");
  const tp = dec.filter((t) => t.result === "tp").length;
  const avg = list.reduce((s, t) => s + t.pnlPct, 0) / n;
  // SLギャップ: 損切決済のうち、理論ラインより下で約定した(窓開け)分の平均乖離
  const slGaps = list
    .filter((t) => t.result === "sl" && Number(t.sl) > 0)
    .map((t) => ((t.exit - t.sl) / t.sl) * 100);
  const gapAvg = slGaps.length ? slGaps.reduce((s, v) => s + v, 0) / slGaps.length : null;
  return {
    n,
    winPct: dec.length ? Number(((tp / dec.length) * 100).toFixed(1)) : null,
    avgPnlPct: Number(avg.toFixed(2)),
    totalPnlPct: Number((avg * n).toFixed(0)),
    slGapAvgPct: gapAvg != null ? Number(gapAvg.toFixed(2)) : null
  };
}

async function main() {
  loadDotEnv();
  const marketData = JSON.parse(fs.readFileSync(path.join(dataDir, "market-data.json"), "utf8"));
  const codes = Object.keys(marketData.instrumentQuotes || {});
  const discMap = await fetchDisclosureDates(codes);

  for (const mode of ["standard", "relax"]) {
    const raw = JSON.parse(fs.readFileSync(path.join(cacheDir, `backtest-trades-${mode}.json`), "utf8")).trades
      .filter((t) => t.tier !== "tierC(その他)");
    const trades = enrich(raw, discMap);
    console.log(`\n===== ${mode === "standard" ? "標準" : "ゆるめ"}モード（買い対象区分 ${trades.length}件） =====`);

    console.log("-- 保有中の決算開示の有無 --");
    console.log("  またいだ:", JSON.stringify(agg(trades.filter((t) => t.duringHold))));
    console.log("  またがない:", JSON.stringify(agg(trades.filter((t) => !t.duringHold))));

    console.log("-- エントリー時点の決算までの日数 --");
    for (const [lo, hi] of [[0, 3], [4, 7], [8, 15], [16, 9999]]) {
      const bucket = trades.filter((t) => t.daysToEarnings != null && t.daysToEarnings >= lo && t.daysToEarnings <= hi);
      console.log(`  ${lo}〜${hi === 9999 ? "" : hi}日前: ` + JSON.stringify(agg(bucket)));
    }

    console.log("-- 発表N日前エントリー除外の効果試算 --");
    const base = agg(trades);
    console.log(`  除外なし(基準): ${base.n}件 勝率${base.winPct}% 平均${base.avgPnlPct}% 合計${base.totalPnlPct}pt SLギャップ${base.slGapAvgPct}%`);
    for (const nDays of [3, 5, 7]) {
      const kept = trades.filter((t) => !(t.daysToEarnings != null && t.daysToEarnings <= nDays));
      const a = agg(kept);
      console.log(`  ${nDays}日前除外: ${a.n}件 勝率${a.winPct}% 平均${a.avgPnlPct}% 合計${a.totalPnlPct}pt SLギャップ${a.slGapAvgPct}%`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
