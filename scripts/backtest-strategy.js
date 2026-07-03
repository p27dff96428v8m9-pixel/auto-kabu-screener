// 押し目買い戦略の簡易バックテスト。
//
// update-treasure-stocks.js と同じ計算式（technicalSignal / estimateTradePlan / marketRegime /
// changes の取り方）を過去の日足に適用し、「前日終値までのデータで買い目標を固定→当日安値が
// 目標に触れたら約定→利確/損切/タイムアウトまで追跡」という観測スペース（標準モード）の流れを
// 過去に遡って再現する。
//
// 制約（正直な注記）:
// - 業績ラベル・材料ラベル・決算進捗は過去に遡れないため、シグナル分類（統合買い候補など）は
//   価格・出来高条件だけの近似tierで代用する。winRate は元々価格由来のみなので忠実に再現できる。
// - 同日に利確と損切の両方に触れた日は保守的に「損切」として数える。
// - 資金制約は掛けない（全シグナルを約定させ、シグナル品質そのものを測る）。
//
// 使い方:
//   node scripts/backtest-strategy.js            # キャッシュがあれば再利用
//   node scripts/backtest-strategy.js --refresh  # J-Quantsから日足を取り直す
//   BACKTEST_SLTP_MODE=atr node scripts/...      # 損切/利確をATRベースに切替（比較用）
//   BACKTEST_SLTP_MODE=grid node scripts/...     # 銘柄別ATR倍率グリッドサーチ vs 一律2.0/3.5 のA/B検証
//                                                # （auto_trader.py の optimize_params_atr_based 移植実験。
//                                                #   backtest.json は上書きせず backtest-grid.json に出力）
//
// 出力: docs/fund-flow-ai-system/data/backtest.json ＋ コンソールにサマリー

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "docs", "fund-flow-ai-system", "data");
const cacheDir = path.join(repoRoot, "data-cache");
const cachePath = path.join(cacheDir, "backtest-quotes.json");
const outputPath = path.join(dataDir, "backtest.json");

const HOLD_LIMIT_SESSIONS = 90; // これを超えたら引け値で強制決済（タイムアウト集計）
const HISTORY_DAYS = Number(process.env.BACKTEST_HISTORY_DAYS || 1825);
// atr = 本番採用方式(update-treasure-stocks.js と同じATRベース) / current = 旧方式(30日騰落率÷3)との比較用
const SLTP_MODE = process.env.BACKTEST_SLTP_MODE || "atr";

// ---- .env 読み込み（ローカル実行用。既に環境変数があるものは上書きしない） ----
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

// ---- J-Quants 認証・日足取得（api/market-data.js と同方式。OHLCを保持する点だけ拡張） ----
const JQUANTS_V1_BASE_URL = process.env.JQUANTS_V1_BASE_URL || "https://api.jquants.com/v1";
const JQUANTS_V2_BASE_URL = process.env.JQUANTS_V2_BASE_URL || "https://api.jquants.com/v2";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status} ${url} ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function getAuth() {
  const apiKey = process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN;
  if (apiKey) {
    try {
      // v2 が使えるか軽く確認（ダメなら v1 にフォールバック）
      await fetchJson(`${JQUANTS_V2_BASE_URL}/equities/bars/daily?code=13060&from_yyyymmdd=${dateDaysAgo(10)}&to_yyyymmdd=${dateDaysAgo(0)}`, {
        headers: { "x-api-key": apiKey }
      });
      return { mode: "v2", apiKey };
    } catch {
      // fall through to v1
    }
  }
  const refreshToken = process.env.JQUANTS_REFRESH_TOKEN;
  if (refreshToken) {
    const data = await fetchJson(`${JQUANTS_V1_BASE_URL}/token/auth_refresh?refreshtoken=${encodeURIComponent(refreshToken)}`, { method: "POST" });
    return { mode: "v1", idToken: data.idToken };
  }
  throw new Error("JQUANTS_REFRESH_TOKEN も JQUANTS_API_KEY も未設定");
}

function dateDaysAgo(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function mapBars(data) {
  return (data.data || data.daily_quotes || data.dailyQuotes || [])
    .map((row) => ({
      date: (row.Date || row.date || "").slice(0, 10),
      open: Number(row.AdjO ?? row.AdjustmentOpen ?? row.O ?? row.Open),
      high: Number(row.AdjH ?? row.AdjustmentHigh ?? row.H ?? row.High),
      low: Number(row.AdjL ?? row.AdjustmentLow ?? row.L ?? row.Low),
      close: Number(row.AdjC ?? row.AdjustmentClose ?? row.C ?? row.Close),
      volume: Number(row.AdjVo ?? row.AdjustmentVolume ?? row.Vo ?? row.Volume)
    }))
    .filter((r) => r.date && Number.isFinite(r.close));
}

async function fetchBars(code, auth) {
  const from = dateDaysAgo(HISTORY_DAYS);
  const to = dateDaysAgo(0);
  if (auth.mode === "v2") {
    const norm = /^\d{4}$/.test(String(code)) ? `${code}0` : String(code);
    const data = await fetchJson(`${JQUANTS_V2_BASE_URL}/equities/bars/daily?code=${norm}&from_yyyymmdd=${from}&to_yyyymmdd=${to}`, {
      headers: { "x-api-key": auth.apiKey }
    });
    return mapBars(data);
  }
  let all = [];
  let paginationKey = "";
  do {
    const url = `${JQUANTS_V1_BASE_URL}/prices/daily_quotes?code=${code}&from=${from}&to=${to}${paginationKey ? `&pagination_key=${paginationKey}` : ""}`;
    const data = await fetchJson(url, { headers: { Authorization: `Bearer ${auth.idToken}` } });
    all = all.concat(mapBars(data));
    paginationKey = data.pagination_key || "";
  } while (paginationKey);
  return all;
}

// ---- update-treasure-stocks.js と同一の指標計算 ----
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const last = (arr, n) => arr.slice(Math.max(0, arr.length - n));
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const num = (v, fb = 0) => (Number.isFinite(Number(v)) ? Number(v) : fb);

function calcRsi(closes, window = 14) {
  if (closes.length < window + 1) return null;
  const gains = [];
  const losses = [];
  for (let i = closes.length - window; i < closes.length; i += 1) {
    const diff = closes[i] - closes[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }
  const gain = avg(gains) || 0;
  const loss = avg(losses) || 0;
  if (loss === 0) return gain === 0 ? 50 : 100;
  return 100 - 100 / (1 + gain / loss);
}

// percentChangeFromRows と同じ（rows[len-days] 比の騰落率）
function pctChange(rows, days, key) {
  if (rows.length < 2) return null;
  const latest = rows[rows.length - 1];
  const start = rows[Math.max(0, rows.length - days)] || rows[0];
  if (!start?.[key]) return null;
  return Number((((latest[key] - start[key]) / Math.max(1, start[key])) * 100).toFixed(2));
}

function technicalSignal(bars) {
  if (bars.length < 30) return null;
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume).filter((v) => v != null && Number.isFinite(v));
  const current = closes[closes.length - 1];
  const sma25 = avg(last(closes, 25));
  const sma75 = avg(last(closes, 75));
  const prevSma75 = closes.length >= 80 ? avg(closes.slice(closes.length - 80, closes.length - 5)) : sma75;
  const volume20 = avg(last(volumes, 20));
  const currentVolume = volumes.length ? volumes[volumes.length - 1] : null;
  const rsi = calcRsi(closes);
  const deviation = sma25 ? ((current - sma25) / sma25) * 100 : null;
  const volumeRatio = volume20 && currentVolume ? currentVolume / volume20 : null;

  const trendOk = current > (sma75 || 0) && (sma75 || 0) >= (prevSma75 || 0);
  const momentumOk = rsi != null && rsi >= 28 && rsi <= 65;
  const pullbackOk = deviation != null && deviation >= -5 && deviation <= 5;
  const volumeOk = volumeRatio != null && volumeRatio >= 0.95;

  let score = 0;
  score += trendOk ? 28 : 8;
  score += momentumOk ? 18 : 6;
  score += pullbackOk ? 18 : 4;
  score += volumeOk ? 18 : 4;
  if (deviation != null && deviation < -2 && deviation >= -5) score += 8;
  if (rsi != null && rsi >= 35 && rsi <= 58) score += 6;
  if (volumeRatio != null && volumeRatio >= 1.1) score += 4;

  return { current, rsi, deviation, volumeRatio, trendOk, momentumOk, pullbackOk, volumeOk, score: clamp(Math.round(score)) };
}

// ATR(14): 実測ボラティリティ。タスク③の比較用（BACKTEST_SLTP_MODE=atr で使用）
function calcAtr(bars, window = 14) {
  if (bars.length < window + 1) return null;
  const trs = [];
  for (let i = bars.length - window; i < bars.length; i += 1) {
    const prevClose = bars[i - 1].close;
    trs.push(Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - prevClose),
      Math.abs(bars[i].low - prevClose)
    ));
  }
  return avg(trs);
}

function estimateTradePlan(technical, bars) {
  const price = technical?.current ?? bars[bars.length - 1]?.close;
  if (!price) return null;
  const change30 = pctChange(bars, 30, "close");
  const deviation = num(technical?.deviation, 0);
  const rsi = num(technical?.rsi, 50);
  const buyDiscount = deviation > 4 ? 0.03 : deviation < -4 ? 0.005 : 0.015;
  const buy = Math.round(price * (1 - buyDiscount));

  let sl;
  let tp;
  if (SLTP_MODE === "atr") {
    // タスク③検証用: ATRベース（損切 = buy - 2.0*ATR, 利確 = buy + 3.5*ATR ≒ RR1.75）
    const atr = calcAtr(bars) || price * 0.02;
    sl = Math.round(buy - atr * 2.0);
    tp = Math.round(buy + atr * 3.5);
  } else {
    // 現行方式（update-treasure-stocks.js と同一）
    const volatility = Math.max(0.035, Math.min(0.12, Math.abs(num(change30)) / 100 / 3));
    sl = Math.round(buy * (1 - Math.max(0.035, volatility * 0.9)));
    tp = Math.round(buy * (1 + Math.max(0.07, volatility * 1.7)));
  }
  const rr = buy - sl > 0 ? Number(((tp - buy) / (buy - sl)).toFixed(2)) : null;

  let winRate = 50;
  winRate += technical?.trendOk ? 12 : -4;
  winRate += technical?.pullbackOk ? 8 : -3;
  winRate += technical?.volumeOk ? 5 : -2;
  winRate += rsi >= 35 && rsi <= 58 ? 6 : rsi > 72 ? -8 : 0;
  winRate += num(change30) > 0 ? 4 : -2;
  winRate += rr != null && rr >= 1.6 ? 4 : 0;

  return { buy, tp, sl, rr, winRate: clamp(Math.round(winRate), 35, 82) };
}

// 価格・出来高だけで近似したシグナル階層（本番の分類は業績/材料ラベも使うため近似）
function tierOf(technical, plan) {
  const overbought = technical.rsi != null && technical.rsi > 65;
  if (technical.trendOk && technical.pullbackOk && !overbought && plan.winRate >= 65) return "tierA(買い候補相当)";
  if (!overbought && plan.winRate >= 58) return "tierB(確認候補相当)";
  return "tierC(その他)";
}

// ---- バックテスト本体 ----
function simulate(codeBars, regimeByDate, { useRegimeFilter }) {
  const trades = [];
  for (const [code, bars] of Object.entries(codeBars)) {
    if (code === "1306" || code === "1321") continue; // 指数連動は地合い判定専用
    let openUntil = -1; // この添字まではポジション保有中（1銘柄1ポジション）
    for (let t = 80; t < bars.length; t += 1) {
      if (t <= openUntil) continue;
      const hist = bars.slice(0, t); // 前日までのデータで目標を固定（本番の深夜固定と同じ）
      const technical = technicalSignal(hist);
      if (!technical) continue;
      const plan = estimateTradePlan(technical, hist);
      if (!plan || !plan.buy || !plan.sl || !plan.tp) continue;

      if (useRegimeFilter) {
        const regime = regimeByDate.get(bars[t - 1].date);
        if (regime !== true) continue; // 25日線割れ・不明の日は新規エントリーなし
      }
      const day = bars[t];
      if (!Number.isFinite(day.low) || day.low > plan.buy) continue; // 買い目標に未到達

      const entry = Math.min(Number.isFinite(day.open) ? day.open : plan.buy, plan.buy);
      let exit = null;
      let result = null;
      let exitIndex = t;
      for (let u = t; u < Math.min(bars.length, t + HOLD_LIMIT_SESSIONS); u += 1) {
        const b = bars[u];
        const open = Number.isFinite(b.open) ? b.open : b.close;
        // 寄り付きで窓を開けた場合は寄り値で約定
        if (u > t && open <= plan.sl) { exit = open; result = "sl"; exitIndex = u; break; }
        if (u > t && open >= plan.tp) { exit = open; result = "tp"; exitIndex = u; break; }
        const hitSl = Number.isFinite(b.low) && b.low <= plan.sl;
        const hitTp = Number.isFinite(b.high) && b.high >= plan.tp;
        if (hitSl) { exit = plan.sl; result = "sl"; exitIndex = u; break; } // 同日両触れは保守的に損切
        if (hitTp) { exit = plan.tp; result = "tp"; exitIndex = u; break; }
      }
      if (!result) {
        const u = Math.min(bars.length - 1, t + HOLD_LIMIT_SESSIONS - 1);
        if (u <= t || !Number.isFinite(bars[u].close)) continue;
        exit = bars[u].close;
        result = "timeout";
        exitIndex = u;
      }
      const pnlPct = ((exit - entry) / entry) * 100;
      trades.push({
        code,
        entryDate: day.date,
        exitDate: bars[exitIndex].date,
        holdSessions: exitIndex - t + 1,
        entry: Number(entry.toFixed(1)),
        exit: Number(exit.toFixed(1)),
        result,
        pnlPct: Number(pnlPct.toFixed(2)),
        winRate: plan.winRate,
        rr: plan.rr,
        tier: tierOf(technical, plan)
      });
      openUntil = exitIndex;
    }
  }
  return trades;
}

// ===== 銘柄別ATR倍率グリッドサーチ（BACKTEST_SLTP_MODE=grid）=====
// auto_trader.py の optimize_params_atr_based の考え方を観測スペースの流れに移植した実験。
// 各銘柄の日足の前半75%（学習）で 損切/利確のATR倍率の最適組合せを選び、後半25%（検証）だけで成績を測る。
// 同じ検証期間を一律 損切2.0×ATR/利確3.5×ATR（本番採用値）でも走らせ、公平にA/B比較する。
// 買い目標の決め方（乖離率ベースの割引）は本番と同一で、sl/tp の倍率だけを可変にする。
const GRID_SL_MULTS = [0.75, 1.0, 1.5, 2.0, 2.5];
const GRID_TP_MULTS = [2.0, 2.5, 3.0, 3.5, 4.0, 5.0];
const GRID_MIN_TRAIN_TRADES = 5; // 学習期間の取引がこれ未満の組合せは信頼できないため候補外
const GRID_BASELINE = { slMult: 2.0, tpMult: 3.5 };

function makeGridPlan(technical, hist, slMult, tpMult) {
  const price = technical.current;
  const deviation = num(technical.deviation, 0);
  const buyDiscount = deviation > 4 ? 0.03 : deviation < -4 ? 0.005 : 0.015;
  const buy = Math.round(price * (1 - buyDiscount));
  const atr = calcAtr(hist) || price * 0.02;
  return { buy, sl: Math.round(buy - atr * slMult), tp: Math.round(buy + atr * tpMult) };
}

// 1銘柄を tStart〜tEnd のエントリー日についてシミュレートする（simulate() の中核と同じ約定ルール）。
// 決済の追跡は tEnd を越えて日足の終端まで行う（エントリー日で学習/検証を区分する）。
function simulateStockRange(code, bars, tStart, tEnd, slMult, tpMult) {
  const trades = [];
  let openUntil = -1;
  for (let t = Math.max(80, tStart); t < Math.min(tEnd, bars.length); t += 1) {
    if (t <= openUntil) continue;
    const hist = bars.slice(0, t);
    const technical = technicalSignal(hist);
    if (!technical) continue;
    const plan = makeGridPlan(technical, hist, slMult, tpMult);
    if (!plan.buy || !plan.sl || !plan.tp) continue;
    const day = bars[t];
    if (!Number.isFinite(day.low) || day.low > plan.buy) continue;

    const entry = Math.min(Number.isFinite(day.open) ? day.open : plan.buy, plan.buy);
    let exit = null;
    let result = null;
    let exitIndex = t;
    for (let u = t; u < Math.min(bars.length, t + HOLD_LIMIT_SESSIONS); u += 1) {
      const b = bars[u];
      const open = Number.isFinite(b.open) ? b.open : b.close;
      if (u > t && open <= plan.sl) { exit = open; result = "sl"; exitIndex = u; break; }
      if (u > t && open >= plan.tp) { exit = open; result = "tp"; exitIndex = u; break; }
      if (Number.isFinite(b.low) && b.low <= plan.sl) { exit = plan.sl; result = "sl"; exitIndex = u; break; }
      if (Number.isFinite(b.high) && b.high >= plan.tp) { exit = plan.tp; result = "tp"; exitIndex = u; break; }
    }
    if (!result) {
      const u = Math.min(bars.length - 1, t + HOLD_LIMIT_SESSIONS - 1);
      if (u <= t || !Number.isFinite(bars[u].close)) continue;
      exit = bars[u].close;
      result = "timeout";
      exitIndex = u;
    }
    trades.push({
      code,
      entryDate: day.date,
      exitDate: bars[exitIndex].date,
      holdSessions: exitIndex - t + 1,
      entry: Number(entry.toFixed(1)),
      exit: Number(exit.toFixed(1)),
      result,
      pnlPct: Number((((exit - entry) / entry) * 100).toFixed(2)),
      winRate: 50, // グリッド実験では予測winRateを使わない（aggregateの帯集計用のダミー）
      rr: null,
      tier: "grid"
    });
    openUntil = exitIndex;
  }
  return trades;
}

function runGridExperiment(codeBars) {
  const gridTrades = [];
  const baselineTrades = [];
  const perStock = [];
  let fallbackCount = 0;

  for (const [code, bars] of Object.entries(codeBars)) {
    if (code === "1306" || code === "1321") continue;
    const trainEnd = Math.floor(bars.length * 0.75);
    if (trainEnd < 120) continue; // 学習期間が短すぎる銘柄は除外

    // 学習: 全組合せを前半75%で試し、平均損益%が最良の組合せを選ぶ（取引数が少なすぎる組合せは除外）
    let best = null;
    for (const slMult of GRID_SL_MULTS) {
      for (const tpMult of GRID_TP_MULTS) {
        const trades = simulateStockRange(code, bars, 80, trainEnd, slMult, tpMult);
        if (trades.length < GRID_MIN_TRAIN_TRADES) continue;
        const avgPnl = trades.reduce((s, tr) => s + tr.pnlPct, 0) / trades.length;
        if (!best || avgPnl > best.avgPnl) best = { slMult, tpMult, avgPnl, trainTrades: trades.length };
      }
    }
    if (!best) {
      // 学習期間に十分な取引が無い銘柄は本番採用値にフォールバック
      best = { ...GRID_BASELINE, avgPnl: null, trainTrades: 0 };
      fallbackCount += 1;
    }

    // 検証: 後半25%を「銘柄別に選んだ倍率」と「一律2.0/3.5」の両方で走らせる
    const g = simulateStockRange(code, bars, trainEnd, bars.length, best.slMult, best.tpMult);
    const b = simulateStockRange(code, bars, trainEnd, bars.length, GRID_BASELINE.slMult, GRID_BASELINE.tpMult);
    gridTrades.push(...g);
    baselineTrades.push(...b);
    perStock.push({
      code,
      slMult: best.slMult,
      tpMult: best.tpMult,
      trainTrades: best.trainTrades,
      trainAvgPnlPct: best.avgPnl != null ? Number(best.avgPnl.toFixed(2)) : null,
      testTrades: g.length,
      testAvgPnlPct: g.length ? Number((g.reduce((s, tr) => s + tr.pnlPct, 0) / g.length).toFixed(2)) : null
    });
  }

  const result = {
    source: "backtest-strategy grid experiment",
    ranAt: new Date().toISOString(),
    note: "銘柄別ATR倍率グリッドサーチ(学習75%/検証25%) vs 一律 損切2.0×ATR/利確3.5×ATR。検証25%期間のみで比較。",
    holdLimitSessions: HOLD_LIMIT_SESSIONS,
    slMultCandidates: GRID_SL_MULTS,
    tpMultCandidates: GRID_TP_MULTS,
    minTrainTrades: GRID_MIN_TRAIN_TRADES,
    stocks: perStock.length,
    fallbackStocks: fallbackCount,
    perStockGrid: aggregate(gridTrades),
    baseline: aggregate(baselineTrades),
    perStock
  };
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "backtest-grid.json"), JSON.stringify(result, null, 1));

  const g = result.perStockGrid.overall;
  const b = result.baseline.overall;
  console.log("\n===== 銘柄別グリッドサーチ A/B検証（検証25%期間・地合いフィルタなし） =====");
  console.log(`銘柄別グリッド: ${g.trades}件 勝率${g.winPct}% (利確${g.tp}/損切${g.sl}/時間切れ${g.timeout}) 平均損益${g.avgPnlPct}%`);
  console.log(`一律2.0/3.5   : ${b.trades}件 勝率${b.winPct}% (利確${b.tp}/損切${b.sl}/時間切れ${b.timeout}) 平均損益${b.avgPnlPct}%`);
  console.log(`対象${result.stocks}銘柄（うち学習取引不足で一律にフォールバック: ${fallbackCount}銘柄）`);
  console.log(`出力: ${path.join(dataDir, "backtest-grid.json")}`);
  if (g.avgPnlPct > b.avgPnlPct) {
    console.log("→ 銘柄別グリッドが優位。update-treasure-stocks.js への採用を検討する価値あり。");
  } else {
    console.log("→ 一律2.0/3.5が優位または同等。現行方式を維持（銘柄別最適化は過学習の可能性）。");
  }
  return result;
}

function buildRegimeMap(bars1306, bars1321) {
  const map = new Map();
  const src = (bars1306 && bars1306.length >= 25) ? bars1306 : bars1321;
  if (!src) return map;
  const closes = src.map((b) => b.close);
  for (let i = 24; i < src.length; i += 1) {
    const sma25 = avg(closes.slice(i - 24, i + 1));
    map.set(src[i].date, closes[i] >= sma25);
  }
  return map;
}

function aggregate(trades) {
  const bucketOf = (wr) => `${Math.floor(wr / 5) * 5}-${Math.floor(wr / 5) * 5 + 4}`;
  const mk = () => ({ trades: 0, tp: 0, sl: 0, timeout: 0, winPct: null, avgPnlPct: 0, totalPnlPct: 0 });
  const add = (agg, tr) => {
    agg.trades += 1;
    agg[tr.result] += 1;
    agg.totalPnlPct += tr.pnlPct;
  };
  const fin = (agg) => {
    const decided = agg.tp + agg.sl;
    agg.winPct = decided ? Number(((agg.tp / decided) * 100).toFixed(1)) : null;
    agg.avgPnlPct = agg.trades ? Number((agg.totalPnlPct / agg.trades).toFixed(2)) : 0;
    agg.totalPnlPct = Number(agg.totalPnlPct.toFixed(1));
    return agg;
  };

  const overall = mk();
  const byBucket = {};
  const byTier = {};
  const byYear = {};
  let holdSum = 0;
  for (const tr of trades) {
    add(overall, tr);
    holdSum += tr.holdSessions;
    const b = bucketOf(tr.winRate);
    byBucket[b] = byBucket[b] || mk();
    add(byBucket[b], tr);
    byTier[tr.tier] = byTier[tr.tier] || mk();
    add(byTier[tr.tier], tr);
    const y = tr.entryDate.slice(0, 4);
    byYear[y] = byYear[y] || mk();
    add(byYear[y], tr);
  }
  fin(overall);
  overall.avgHoldSessions = trades.length ? Number((holdSum / trades.length).toFixed(1)) : null;
  Object.values(byBucket).forEach(fin);
  Object.values(byTier).forEach(fin);
  Object.values(byYear).forEach(fin);
  return { overall, byWinRateBucket: byBucket, byTier, byYear };
}

async function loadBars(codes) {
  if (!process.argv.includes("--refresh") && fs.existsSync(cachePath)) {
    const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    const ageDays = (Date.now() - new Date(cache.fetchedAt).getTime()) / 86400000;
    if (ageDays < 3 && codes.every((c) => cache.bars[c])) {
      console.log(`キャッシュ利用 (${cache.fetchedAt})`);
      return cache.bars;
    }
  }
  const auth = await getAuth();
  console.log(`J-Quants ${auth.mode} で日足取得 (${codes.length}銘柄 × ${HISTORY_DAYS}日)`);
  const bars = {};
  for (const code of codes) {
    try {
      bars[code] = await fetchBars(code, auth);
      process.stdout.write(`${code}:${bars[code].length} `);
    } catch (e) {
      console.warn(`\n${code} 取得失敗: ${e.message}`);
      bars[code] = [];
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log("");
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({ fetchedAt: new Date().toISOString(), bars }));
  return bars;
}

async function main() {
  loadDotEnv();
  const marketData = JSON.parse(fs.readFileSync(path.join(dataDir, "market-data.json"), "utf8"));
  const codes = Object.keys(marketData.instrumentQuotes || {});
  if (!codes.includes("1306")) codes.push("1306");
  const bars = await loadBars(codes);

  const usable = Object.entries(bars).filter(([, b]) => b.length >= 120);
  console.log(`利用可能: ${usable.length}/${codes.length}銘柄`);
  const codeBars = Object.fromEntries(usable);

  // grid モードは A/B 実験専用。backtest.json（較正表の供給元）は上書きしない。
  if (SLTP_MODE === "grid") {
    runGridExperiment(codeBars);
    return;
  }

  const regimeByDate = buildRegimeMap(bars["1306"], bars["1321"]);

  const withFilter = simulate(codeBars, regimeByDate, { useRegimeFilter: true });
  const withoutFilter = simulate(codeBars, regimeByDate, { useRegimeFilter: false });

  // 予測winRate→実勝率の較正表（update-treasure-stocks.js が winRateCalibrated の算出に使う）。
  // サンプルが少ない帯は全体実勝率へ寄せる（重み n/(n+50)）。実勝率は本番運用と同じ
  // 地合いフィルタOFF側から作る（2026-07-02にフィルタ撤去）。
  const buildCalibration = (agg) => {
    const overallWin = agg.overall.winPct;
    return Object.entries(agg.byWinRateBucket)
      .map(([bucket, b]) => {
        const [lo, hi] = bucket.split("-").map(Number);
        const decided = b.tp + b.sl;
        const observed = b.winPct;
        const weight = decided / (decided + 50);
        const calibrated = observed != null && overallWin != null
          ? Number((observed * weight + overallWin * (1 - weight)).toFixed(1))
          : overallWin;
        return { minWinRate: lo, maxWinRate: hi, samples: decided, observedWinPct: observed, calibratedWinPct: calibrated };
      })
      .sort((a, b) => a.minWinRate - b.minWinRate);
  };

  const result = {
    source: "backtest-strategy",
    sltpMode: SLTP_MODE,
    ranAt: new Date().toISOString(),
    note: "価格・出来高ベースの再現。業績/材料ラベルは対象外。同日両触れは損切扱い(保守的)。資金制約なし。",
    holdLimitSessions: HOLD_LIMIT_SESSIONS,
    universe: usable.map(([c]) => c),
    period: {
      from: usable[0]?.[1][0]?.date || null,
      to: usable[0]?.[1].slice(-1)[0]?.date || null
    },
    regimeFilterOn: aggregate(withFilter),
    regimeFilterOff: aggregate(withoutFilter)
  };
  result.calibration = {
    basis: `backtest ${SLTP_MODE} / 地合いフィルタOFF(本番同等) / ${result.regimeFilterOff.overall.trades}件`,
    overallWinPct: result.regimeFilterOff.overall.winPct,
    buckets: buildCalibration(result.regimeFilterOff)
  };
  fs.mkdirSync(dataDir, { recursive: true });
  // コミット用はサマリー＋較正表のみ（軽量）。全トレード明細は分析用にローカルキャッシュへ。
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 1));
  fs.writeFileSync(path.join(cacheDir, "backtest-trades.json"), JSON.stringify({ ranAt: result.ranAt, sltpMode: SLTP_MODE, trades: withFilter }, null, 1));

  const o = result.regimeFilterOn.overall;
  const off = result.regimeFilterOff.overall;
  console.log("\n===== バックテスト結果 (SLTP_MODE=" + SLTP_MODE + ") =====");
  console.log(`地合いフィルタON : ${o.trades}件 勝率${o.winPct}% (利確${o.tp}/損切${o.sl}/時間切れ${o.timeout}) 平均損益${o.avgPnlPct}% 平均保有${o.avgHoldSessions}営業日`);
  console.log(`地合いフィルタOFF: ${off.trades}件 勝率${off.winPct}% (利確${off.tp}/損切${off.sl}/時間切れ${off.timeout}) 平均損益${off.avgPnlPct}%`);
  console.log("\n-- 予測winRate帯ごとの実績 (フィルタON) --");
  for (const [bucket, agg] of Object.entries(result.regimeFilterOn.byWinRateBucket).sort()) {
    console.log(`winRate ${bucket}: ${agg.trades}件 実勝率${agg.winPct}% 平均損益${agg.avgPnlPct}%`);
  }
  console.log("\n-- tier別 (フィルタON) --");
  for (const [tier, agg] of Object.entries(result.regimeFilterOn.byTier).sort()) {
    console.log(`${tier}: ${agg.trades}件 実勝率${agg.winPct}% 平均損益${agg.avgPnlPct}%`);
  }
  console.log(`\n出力: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
