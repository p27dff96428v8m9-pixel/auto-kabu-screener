// 全市場スクリーニング（ユニバース拡大）。
//
// 現行の監視対象は手動選定の約78銘柄に固定されており、その外側の好機は見えない。
// このスクリプトは J-Quants v2 の日付指定・全銘柄日足（equities/bars/daily?date=）で
// 全上場銘柄（約4,400）の直近130営業日を取得し、既存パイプラインと同じ価格・出来高
// ベースの採点で「発掘候補」上位を market-discovery.json に出力する。
// update-treasure-stocks.js がこのファイルの上位数銘柄を統合ランキングへ治験合流させる。
//
// フィルタ（安全側）:
//   - 普通株のみ（ProdCat=011・銘柄コード5桁目が0・プライム/スタンダード/グロース）
//   - ETF/REIT/投資法人などは名称でも除外
//   - 流動性: 売買代金20日平均 >= DISCOVERY_MIN_TURNOVER 円（既定10億。約定容易性と操縦性リスクの下限）
//   - 株価 >= DISCOVERY_MIN_PRICE 円（既定200。低位株のノイズ排除）
//   - 既存ユニバース（market-data.json の instrumentQuotes）は除外（発掘が目的のため）
//
// 使い方: node scripts/scan-market-universe.js
//   API呼び出しは 銘柄マスタ1 + 営業日カレンダー1 + 日足130回 ≒ 132回/実行。1日1回の想定。
//   同日の再実行は data-cache/market-universe-scan.json を再利用する（gitignore済・ローカル/同ラン内用）。

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, "data-cache");
const scanCachePath = path.join(cacheDir, "market-universe-scan.json");

const JQUANTS_V2_BASE_URL = process.env.JQUANTS_V2_BASE_URL || "https://api.jquants.com/v2";
const HISTORY_SESSIONS = 130; // 90日騰落率 + sma75の前方比較(80本)を賄う営業日数
const TOP_OUTPUT = Number(process.env.DISCOVERY_OUTPUT_COUNT || 20);
const MIN_TURNOVER = Number(process.env.DISCOVERY_MIN_TURNOVER || 1e9);
const MIN_PRICE = Number(process.env.DISCOVERY_MIN_PRICE || 200);

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

function apiKey() {
  const key = process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN;
  if (!key) throw new Error("JQUANTS_API_KEY 未設定");
  return key;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "x-api-key": apiKey() } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

function dateDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
}

// ---- 指標計算（update-treasure-stocks.js / backtest-strategy.js と同一式） ----
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

function pctChange(rows, days, key) {
  if (rows.length < 2) return null;
  const latest = rows[rows.length - 1];
  const start = rows[Math.max(0, rows.length - days)] || rows[0];
  if (!start?.[key]) return null;
  return Number((((latest[key] - start[key]) / Math.max(1, start[key])) * 100).toFixed(2));
}

function technicalSignal(rows) {
  if (rows.length < 30) return null;
  const closes = rows.map((b) => b.close);
  const volumes = rows.map((b) => b.volume).filter((v) => v != null && Number.isFinite(v));
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

function estimateWinRate(technical, rows) {
  const rsi = num(technical?.rsi, 50);
  let winRate = 50;
  winRate += technical?.trendOk ? 12 : -4;
  winRate += technical?.pullbackOk ? 8 : -3;
  winRate += technical?.volumeOk ? 5 : -2;
  winRate += rsi >= 35 && rsi <= 58 ? 6 : rsi > 72 ? -8 : 0;
  winRate += num(pctChange(rows, 30, "close")) > 0 ? 4 : -2;
  return clamp(Math.round(winRate), 35, 82);
}

// ---- データ取得 ----
async function fetchTradingDates() {
  // 1306の日足で直近の営業日カレンダーを得る（1コール）
  const from = dateDaysAgo(220);
  const to = dateDaysAgo(0);
  const data = await fetchJson(`${JQUANTS_V2_BASE_URL}/equities/bars/daily?code=13060&from_yyyymmdd=${from}&to_yyyymmdd=${to}`);
  const dates = (data.data || []).map((r) => String(r.Date).replace(/-/g, "")).sort();
  return dates.slice(-HISTORY_SESSIONS);
}

async function fetchMaster() {
  const data = await fetchJson(`${JQUANTS_V2_BASE_URL}/equities/master`);
  const rows = data.data || data.info || [];
  const map = new Map();
  for (const r of rows) {
    const code5 = String(r.Code || "");
    if (!/^\d{4}0$/.test(code5)) continue; // 普通株の標準コードのみ
    if (String(r.ProdCat || "") !== "011") continue;
    if (!/プライム|スタンダード|グロース/.test(String(r.MktNm || ""))) continue;
    const name = String(r.CoName || "");
    if (/ETF|ETN|REIT|リート|投資法人|投信|上場投/.test(name)) continue;
    map.set(code5.slice(0, 4), { name, sector: r.S33Nm || null, market: r.MktNm, scale: r.ScaleCat || null });
  }
  return map;
}

async function fetchAllBars(tradingDates) {
  // 同日中の再実行はキャッシュ利用（Actionsでは毎回取得）
  try {
    const cache = JSON.parse(fs.readFileSync(scanCachePath, "utf8"));
    if (cache.dateKey === tradingDates[tradingDates.length - 1] && cache.days === tradingDates.length) {
      console.log(`スキャンキャッシュ利用 (${cache.fetchedAt})`);
      return cache.byCode;
    }
  } catch { /* キャッシュなし */ }

  const byCode = {};
  let done = 0;
  for (const d of tradingDates) {
    const data = await fetchJson(`${JQUANTS_V2_BASE_URL}/equities/bars/daily?date=${d}`);
    for (const r of data.data || []) {
      const code5 = String(r.Code || "");
      if (!/^\d{4}0$/.test(code5)) continue;
      const code = code5.slice(0, 4);
      const close = Number(r.AdjC ?? r.C);
      if (!Number.isFinite(close) || close <= 0) continue;
      (byCode[code] = byCode[code] || []).push({
        date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
        close,
        high: Number.isFinite(Number(r.AdjH ?? r.H)) ? Number(r.AdjH ?? r.H) : null,
        low: Number.isFinite(Number(r.AdjL ?? r.L)) ? Number(r.AdjL ?? r.L) : null,
        volume: Number.isFinite(Number(r.AdjVo ?? r.Vo)) ? Number(r.AdjVo ?? r.Vo) : null,
        value: Number.isFinite(Number(r.Va)) ? Number(r.Va) : null
      });
    }
    done += 1;
    if (done % 20 === 0) process.stdout.write(`${done}/${tradingDates.length} `);
    await new Promise((res) => setTimeout(res, 150));
  }
  console.log("");
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(scanCachePath, JSON.stringify({ fetchedAt: new Date().toISOString(), dateKey: tradingDates[tradingDates.length - 1], days: tradingDates.length, byCode }));
  } catch (e) {
    console.warn(`キャッシュ保存失敗（続行）: ${e.message}`);
  }
  return byCode;
}

async function main() {
  loadDotEnv();
  const outputPath = path.resolve(process.cwd(), process.env.DISCOVERY_OUTPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "market-discovery.json"));
  const marketDataPath = path.resolve(process.cwd(), process.env.MARKET_DATA_INPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "market-data.json"));
  let existing = new Set();
  try {
    existing = new Set(Object.keys(JSON.parse(fs.readFileSync(marketDataPath, "utf8")).instrumentQuotes || {}));
  } catch { /* 既存ユニバース不明でも続行 */ }

  const tradingDates = await fetchTradingDates();
  console.log(`営業日 ${tradingDates.length}日（${tradingDates[0]}〜${tradingDates[tradingDates.length - 1]}）`);
  const master = await fetchMaster();
  console.log(`銘柄マスタ: 普通株 ${master.size}件`);
  const byCode = await fetchAllBars(tradingDates);

  const candidates = [];
  let scanned = 0;
  for (const [code, rows] of Object.entries(byCode)) {
    if (!master.has(code) || existing.has(code)) continue;
    if (rows.length < 100) continue;
    scanned += 1;
    const info = master.get(code);
    const closes = rows[rows.length - 1];
    if (closes.close < MIN_PRICE) continue;
    const turnover20 = avg(last(rows.map((r) => r.value).filter((v) => v != null), 20));
    if (!turnover20 || turnover20 < MIN_TURNOVER) continue;
    const technical = technicalSignal(rows);
    if (!technical) continue;
    const winRate = estimateWinRate(technical, rows);
    const kabuScore = clamp(technical.score * 0.62 + winRate * 0.38);
    candidates.push({
      code,
      name: info.name,
      sector: info.sector,
      market: info.market,
      scale: info.scale,
      turnover20d: Math.round(turnover20),
      kabuScore: Math.round(kabuScore),
      technicalScore: technical.score,
      winRate,
      quote: {
        latest: { close: closes.close, date: closes.date },
        changes: {
          "7d": pctChange(rows, 7, "close"),
          "30d": pctChange(rows, 30, "close"),
          "90d": pctChange(rows, 90, "close"),
          volume7d: pctChange(rows, 7, "volume"),
          volume30d: pctChange(rows, 30, "volume"),
          volume90d: pctChange(rows, 90, "volume")
        },
        // 既存パイプライン(summarizeInstrumentQuote)と同じ直近60本のみ携行
        history: rows.slice(-60).map((r) => ({
          date: r.date,
          close: r.close,
          volume: r.volume,
          ...(r.high != null ? { high: r.high } : {}),
          ...(r.low != null ? { low: r.low } : {})
        }))
      }
    });
  }
  candidates.sort((a, b) => b.kabuScore - a.kabuScore || b.technicalScore - a.technicalScore);
  const top = candidates.slice(0, TOP_OUTPUT);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({
    source: "scan-market-universe",
    updatedAt: new Date().toISOString(),
    tradedDate: tradingDates[tradingDates.length - 1],
    scanned,
    passedFilters: candidates.length,
    minTurnover: MIN_TURNOVER,
    minPrice: MIN_PRICE,
    candidates: top
  }, null, 1)}\n`, "utf8");

  console.log(`スキャン ${scanned}銘柄 → フィルタ通過 ${candidates.length} → 出力 ${top.length}`);
  for (const c of top.slice(0, 10)) {
    console.log(`  ${c.code} ${c.name} [${c.sector}] kabu${c.kabuScore} 売買代金${Math.round(c.turnover20d / 1e8)}億`);
  }
  console.log(`出力: ${outputPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
