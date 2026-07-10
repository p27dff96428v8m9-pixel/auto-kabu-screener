// 権利落ち日の「偽押し目」検証ツール。
//
// 権利落ち日（≒配当権利確定日=月末最終営業日の1営業日前）は配当分だけ株価が機械的に下がる。
// この下落は企業価値の毀損ではなく配当の分離なので、「押し目=行き過ぎた下げの反発を取る」という
// 戦略の前提が成り立たない可能性がある（しかも権利落ち日に買っても配当は貰えない）。
// 10年バックテストの取引を「権利落ち日エントリー」とそれ以外に層別して実害を測る。
//
// 銘柄ごとの配当月は fins/summary（Lightで取得可）から:
//   期末月 = CurFYEn の月（DivFY または FDivFY > 0 の場合に配当月とみなす）
//   中間月 = 期末月+6ヶ月（Div2Q または FDiv2Q > 0 の場合）
// 権利落ち日の判定は 1306 の営業日カレンダー（data-cache/backtest-quotes.json）で
// 「その月の最終営業日の1営業日前」（T+2決済・2019年以降のルール。それ以前はT+3で1日ずれるが
// 2016-2019年分は±1日の誤差として許容し、落ち日±1日のバケットでも確認する）。
//
// 使い方: node scripts/analyze-ex-dividend.js

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

const numeric = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

// 銘柄→配当月（キャッシュ30日）
async function loadDividendMonths(codes) {
  const cachePath = path.join(cacheDir, "dividend-months.json");
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if ((Date.now() - Date.parse(cache.fetchedAt)) / 86400000 < 30 && codes.every((c) => cache.months[c])) return cache.months;
  } catch { /* 取得へ */ }
  const key = process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN;
  const months = {};
  for (const code of codes) {
    const norm = /^\d{4}$/.test(code) ? `${code}0` : code;
    try {
      const res = await fetch(`${JQUANTS_V2_BASE_URL}/fins/summary?code=${norm}`, { headers: { "x-api-key": key } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = ((await res.json()).data || []).filter((r) => r.CurPerType === "FY");
      const fy = rows[rows.length - 1];
      const list = [];
      if (fy && fy.CurFYEn) {
        const fyMonth = Number(fy.CurFYEn.slice(5, 7));
        const hasFyDiv = (numeric(fy.DivFY) || 0) > 0 || (numeric(fy.FDivFY) || 0) > 0 || (numeric(fy.DivAnn) || 0) > 0;
        const hasMidDiv = (numeric(fy.Div2Q) || 0) > 0 || (numeric(fy.FDiv2Q) || 0) > 0 || (numeric(fy.NxFDiv2Q) || 0) > 0;
        if (hasFyDiv) list.push(fyMonth);
        if (hasMidDiv) list.push(((fyMonth + 6 - 1) % 12) + 1);
      }
      months[code] = list;
      process.stdout.write(`${code}:${list.join("/") || "-"} `);
    } catch (e) {
      console.warn(`\n${code} 配当月取得失敗: ${e.message}`);
      months[code] = [3, 9]; // 取得不能時は日本企業の多数派(3月期)で近似
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log("");
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({ fetchedAt: new Date().toISOString(), months }));
  return months;
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
const show = (label, list) => {
  const a = agg(list);
  console.log(`  ${label}: ${a.n}件 勝率${a.winPct != null ? a.winPct + "%" : "—"} 平均${a.avgPnlPct != null ? a.avgPnlPct + "%" : "—"}`);
};

async function main() {
  loadDotEnv();
  const trades = JSON.parse(fs.readFileSync(path.join(cacheDir, "backtest-trades-relax.json"), "utf8")).trades
    .filter((t) => t.tier !== "tierC(その他)");
  const codes = [...new Set(trades.map((t) => t.code))];
  const divMonths = await loadDividendMonths(codes);

  // 営業日カレンダー（1306）から各月の権利落ち日を求める: 月内最終営業日の1営業日前
  const bars = JSON.parse(fs.readFileSync(path.join(cacheDir, "backtest-quotes.json"), "utf8")).bars["1306"];
  const dates = bars.map((b) => b.date).sort();
  const byMonth = new Map();
  for (const d of dates) {
    const m = d.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m).push(d);
  }
  const exDateOfMonth = new Map(); // "YYYY-MM" -> 落ち日
  const exDateIndex = new Map();   // 落ち日 -> "YYYY-MM"
  for (const [m, ds] of byMonth) {
    if (ds.length < 2) continue;
    const ex = ds[ds.length - 2];
    exDateOfMonth.set(m, ex);
    exDateIndex.set(ex, m);
  }
  const dateIdx = new Map(dates.map((d, i) => [d, i]));

  // 取引を層別: 銘柄の配当月の 落ち日 / 落ち日±1営業日 / 月末3営業日(参考) / その他
  const onEx = [];
  const nearEx = [];
  const others = [];
  for (const t of trades) {
    const months = divMonths[t.code] || [];
    const m = Number(t.entryDate.slice(5, 7));
    const isDivMonth = months.includes(m);
    const ex = exDateOfMonth.get(t.entryDate.slice(0, 7));
    if (isDivMonth && ex && dateIdx.has(t.entryDate) && dateIdx.has(ex)) {
      const dist = dateIdx.get(t.entryDate) - dateIdx.get(ex);
      if (dist === 0) { onEx.push(t); continue; }
      if (Math.abs(dist) <= 1) { nearEx.push(t); continue; }
    }
    others.push(t);
  }

  console.log(`\n対象: ${trades.length}件（ゆるめ・買い対象区分・10年）`);
  console.log("== 権利落ち日の偽押し目検証 ==");
  show("権利落ち日ちょうど", onEx);
  show("落ち日±1営業日", nearEx);
  show("それ以外(基準)", others);

  // 落ち日エントリーの決済内訳（配当分のハンデが損切りに効いているか）
  if (onEx.length) {
    const sl = onEx.filter((t) => t.result === "sl").length;
    const tp = onEx.filter((t) => t.result === "tp").length;
    const to = onEx.filter((t) => t.result === "timeout").length;
    console.log(`  └ 落ち日の内訳: 利確${tp}/損切${sl}/時間切れ${to}`);
    // 前半/後半の頑健性
    const first = onEx.filter((t) => t.entryDate < "2021-07-01");
    const second = onEx.filter((t) => t.entryDate >= "2021-07-01");
    console.log(`  └ 前半(〜2021): ${JSON.stringify(agg(first))} / 後半: ${JSON.stringify(agg(second))}`);
  }

  // 参考: 配当月の月末最終週(落ち日を除く)は普通か（「月末だから悪い」ではないことの確認）
  const lateMonth = others.filter((t) => {
    const months = divMonths[t.code] || [];
    if (!months.includes(Number(t.entryDate.slice(5, 7)))) return false;
    const ex = exDateOfMonth.get(t.entryDate.slice(0, 7));
    if (!ex || !dateIdx.has(t.entryDate) || !dateIdx.has(ex)) return false;
    const dist = dateIdx.get(t.entryDate) - dateIdx.get(ex);
    return dist >= -5 && dist < -1;
  });
  show("(参考)配当月の落ち日直前2〜5営業日", lateMonth);
}

main().catch((e) => { console.error(e); process.exit(1); });
