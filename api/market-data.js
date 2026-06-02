const fs = require("fs");
const path = require("path");

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadLocalEnv();

const JQUANTS_V1_BASE_URL = process.env.JQUANTS_V1_BASE_URL || "https://api.jquants.com/v1";
const JQUANTS_V2_BASE_URL = process.env.JQUANTS_V2_BASE_URL || "https://api.jquants.com/v2";
const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";
const ALPHA_MACRO_COMMODITIES = (process.env.ALPHA_VANTAGE_COMMODITIES || "WTI,COPPER,GOLD")
  .split(",")
  .map((item) => item.trim().toUpperCase())
  .filter(Boolean);
const ALPHA_COMMODITY_BATCH_COUNT = Math.max(1, Number(process.env.ALPHA_VANTAGE_COMMODITY_BATCH_COUNT || 2) || 2);
const ALPHA_REQUEST_DELAY_MS = Math.max(0, Number(process.env.ALPHA_VANTAGE_REQUEST_DELAY_MS || 1200) || 1200);
const JQUANTS_PLAN_LIMITS = {
  free: { requestsPerRun: 5, instrumentQuoteRequests: 6, historyDays: 730 },
  light: { requestsPerRun: 18, instrumentQuoteRequests: 36, historyDays: 1825 },
  standard: { requestsPerRun: 18, instrumentQuoteRequests: 72, historyDays: 3650 },
  premium: { requestsPerRun: 18, instrumentQuoteRequests: 120, historyDays: 7300 }
};

function jquantsPlan() {
  const plan = String(process.env.JQUANTS_PLAN || "light").trim().toLowerCase();
  return JQUANTS_PLAN_LIMITS[plan] ? plan : "light";
}

function jquantsPlanConfig() {
  return JQUANTS_PLAN_LIMITS[jquantsPlan()];
}

const THEME_UNIVERSE = [
  { id: "jp-semiconductor", tickers: ["8035", "6857", "7735", "1321"], news: ["semiconductor", "AI", "Tokyo Electron"] },
  { id: "jp-defense", tickers: ["7011", "7012", "7013", "6208"], news: ["defense", "heavy industry", "Japan"] },
  { id: "jp-banks", tickers: ["8306", "8316", "8411", "1615"], news: ["Japan banks", "BOJ", "interest rates"] },
  { id: "jp-electric-power", tickers: ["9501", "9503", "9502", "9513"], news: ["Japan electric power", "nuclear restart"] },
  { id: "jp-trading-houses", tickers: ["8001", "8058", "8031", "1306"], news: ["Japan trading houses", "resources"] },
  { id: "jp-gold", tickers: ["1540", "1328", "5713"], news: ["gold", "inflation hedge", "Japan ETF"] },
  { id: "jp-inbound", tickers: ["3099", "9201", "9020", "4661"], news: ["Japan inbound tourism", "department stores"] },
  { id: "jp-small-growth", tickers: ["2516", "4483", "4478"], news: ["Japan growth stocks", "TSE growth"] },
  { id: "jpy-exporters", tickers: ["7203", "7267", "6954", "6503"], news: ["yen exporters", "Japan exporters"] },
  { id: "jp-reits", tickers: ["1343", "8951", "3283"], news: ["J-REIT", "Japan real estate investment trust"] },
  { id: "jp-auto", tickers: ["7203", "7267", "6902"], news: ["Japan auto", "Toyota", "EV"] },
  { id: "jp-pharma", tickers: ["4502", "4568", "4519"], news: ["Japan pharma", "healthcare"] },
  { id: "jp-telecom", tickers: ["9432", "9433", "9434"], news: ["Japan telecom", "NTT", "KDDI"] },
  { id: "jp-retail", tickers: ["9983", "7532", "8267"], news: ["Japan retail", "consumer spending"] },
  { id: "jp-construction", tickers: ["1801", "1802", "1803"], news: ["Japan construction", "infrastructure"] },
  { id: "jp-insurance", tickers: ["8766", "8630", "8725"], news: ["Japan insurance", "shareholder returns"] },
  { id: "jp-chemical", tickers: ["4063", "4188", "4004"], news: ["Japan chemical", "semiconductor materials"] },
  { id: "jp-low-pbr", tickers: ["1306", "8411", "8058"], news: ["Japan low PBR", "TSE reform"] }
];

const TREASURE_TICKERS = [
  "6723", "6146", "6920",
  "8308", "7182", "7167",
  "9508", "9506", "9504",
  "8015", "8053", "2768",
  "8952", "8953", "3462",
  "6301", "6501", "6981",
  "7201", "7270", "8750", "8795"
];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function dateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function jquantsHistoryDays() {
  return Math.max(30, Number(process.env.JQUANTS_HISTORY_DAYS || jquantsPlanConfig().historyDays) || jquantsPlanConfig().historyDays);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

function newestFirstPoints(points) {
  return points
    .filter((point) => point.date && Number.isFinite(point.value))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function pointChanges(points) {
  const ordered = newestFirstPoints(points);
  if (ordered.length < 2) return { latest: null, changes: {} };
  const latest = ordered[0];
  const valueAt = (days) => ordered[Math.min(days, ordered.length - 1)] || ordered[ordered.length - 1];
  const change = (days) => {
    const base = valueAt(days);
    if (!base?.value) return null;
    return Number((((latest.value - base.value) / Math.max(0.0001, base.value)) * 100).toFixed(2));
  };

  return {
    latest,
    changes: {
      "7d": change(7),
      "30d": change(30),
      "90d": change(90)
    }
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadPreviousMarketData() {
  const outputPath = process.env.MARKET_DATA_OUTPUT_PATH;
  if (!outputPath) return null;

  const resolvedPath = path.resolve(process.cwd(), outputPath);
  if (!fs.existsSync(resolvedPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  } catch {
    return null;
  }
}

function loadPreviousAlphaSignals() {
  return loadPreviousMarketData()?.macro?.alpha || null;
}

function selectedAlphaCommodityBatch() {
  const batches = Array.from({ length: ALPHA_COMMODITY_BATCH_COUNT }, () => []);
  ALPHA_MACRO_COMMODITIES.forEach((commodity, index) => {
    batches[index % ALPHA_COMMODITY_BATCH_COUNT].push(commodity);
  });

  const explicitIndex = Number(process.env.ALPHA_VANTAGE_COMMODITY_BATCH_INDEX);
  const runNumber = Number(process.env.GITHUB_RUN_NUMBER);
  const rawIndex = Number.isFinite(explicitIndex)
    ? explicitIndex
    : Number.isFinite(runNumber)
      ? runNumber - 1
      : Math.floor(Date.now() / (20 * 60 * 1000));
  const index = ((Math.trunc(rawIndex) % batches.length) + batches.length) % batches.length;

  return {
    index,
    count: batches.length,
    commodities: batches[index]
  };
}

function parseAlphaFxDaily(data) {
  const series = data?.["Time Series FX (Daily)"] || {};
  return pointChanges(Object.entries(series).map(([date, row]) => ({
    date,
    value: Number(row["4. close"] || row.close)
  })));
}

function parseAlphaCommodity(data) {
  return pointChanges((data?.data || []).map((row) => ({
    date: row.date,
    value: Number(row.value)
  })));
}

async function fetchAlphaVantage(params) {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;
  const query = new URLSearchParams({ ...params, apikey: key });
  const data = await fetchJson(`${ALPHA_VANTAGE_BASE_URL}?${query.toString()}`);
  if (data?.Information || data?.Note || data?.["Error Message"]) {
    throw new Error(data.Information || data.Note || data["Error Message"]);
  }
  return data;
}

async function fetchAlphaMacroSignals() {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return { source: "not_configured" };
  }

  const previousAlpha = loadPreviousAlphaSignals();
  const selectedBatch = selectedAlphaCommodityBatch();
  const alpha = {
    source: "alpha_vantage",
    fx: {},
    commodities: { ...(previousAlpha?.commodities || {}) },
    errors: [],
    commodityBatch: {
      index: selectedBatch.index,
      count: selectedBatch.count,
      symbols: selectedBatch.commodities
    }
  };

  try {
    const usdJpy = await fetchAlphaVantage({
      function: "FX_DAILY",
      from_symbol: "USD",
      to_symbol: "JPY",
      outputsize: "compact"
    });
    alpha.fx.usdjpy = parseAlphaFxDaily(usdJpy);
  } catch (error) {
    alpha.errors.push(`USDJPY:${error.message}`);
  }

  for (const commodity of selectedBatch.commodities) {
    if (ALPHA_REQUEST_DELAY_MS) {
      await sleep(ALPHA_REQUEST_DELAY_MS);
    }
    try {
      const data = await fetchAlphaVantage({
        function: commodity,
        interval: "daily"
      });
      alpha.commodities[commodity.toLowerCase()] = parseAlphaCommodity(data);
    } catch (error) {
      alpha.errors.push(`${commodity}:${error.message}`);
    }
  }

  return alpha;
}

async function getJQuantsToken() {
  const refreshToken = process.env.JQUANTS_REFRESH_TOKEN;
  if (refreshToken) {
    const data = await fetchJson(`${JQUANTS_V1_BASE_URL}/token/auth_refresh?refreshtoken=${encodeURIComponent(refreshToken)}`, {
      method: "POST"
    });
    return data.idToken;
  }

  const mailaddress = process.env.JQUANTS_EMAIL;
  const password = process.env.JQUANTS_PASSWORD;
  if (!mailaddress || !password) return null;

  const auth = await fetchJson(`${JQUANTS_V1_BASE_URL}/token/auth_user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mailaddress, password })
  });
  const token = await fetchJson(`${JQUANTS_V1_BASE_URL}/token/auth_refresh?refreshtoken=${encodeURIComponent(auth.refreshToken)}`, {
    method: "POST"
  });
  return token.idToken;
}

async function getJQuantsAuth() {
  const apiKey = process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN;
  if (apiKey) {
    return { mode: "v2", apiKey };
  }

  const idToken = await getJQuantsToken();
  if (idToken) {
    return { mode: "v1", idToken };
  }

  return null;
}

function mapDailyQuoteRows(data) {
  return (data.data || data.daily_quotes || data.dailyQuotes || []).map((row) => ({
    date: row.Date || row.date,
    close: Number(row.AdjC ?? row.C ?? row.AdjustmentClose ?? row.Close ?? row.close),
    volume: Number(row.AdjVo ?? row.Vo ?? row.Volume ?? row.volume)
  })).filter((row) => Number.isFinite(row.close) && Number.isFinite(row.volume));
}

function normalizeJQuantsCode(code) {
  const value = String(code);
  return /^\d{4}$/.test(value) ? `${value}0` : value;
}

async function fetchDailyQuotes(code, auth) {
  const from = dateDaysAgo(jquantsHistoryDays());
  const to = dateDaysAgo(0);

  if (auth.mode === "v2") {
    const url = `${JQUANTS_V2_BASE_URL}/equities/bars/daily?code=${encodeURIComponent(normalizeJQuantsCode(code))}&from_yyyymmdd=${from}&to_yyyymmdd=${to}`;
    const data = await fetchJson(url, {
      headers: { "x-api-key": auth.apiKey }
    });
    return mapDailyQuoteRows(data);
  }

  const url = `${JQUANTS_V1_BASE_URL}/prices/daily_quotes?code=${encodeURIComponent(code)}&from=${from}&to=${to}`;
  const data = await fetchJson(url, {
    headers: { Authorization: `Bearer ${auth.idToken}` }
  });
  return mapDailyQuoteRows(data);
}

function periodChange(rows, days) {
  if (rows.length < 2) return { price: 0, volume: 0 };
  const end = rows[rows.length - 1];
  const startIndex = Math.max(0, rows.length - days);
  const start = rows[startIndex];
  const prevWindow = rows.slice(Math.max(0, startIndex - days), startIndex);
  const currentWindow = rows.slice(startIndex);
  const avg = (items, key) => items.length ? items.reduce((sum, item) => sum + item[key], 0) / items.length : 0;
  const prevVolume = avg(prevWindow, "volume") || avg(rows.slice(0, startIndex || 1), "volume") || 1;
  const currentVolume = avg(currentWindow, "volume") || end.volume;
  return {
    price: ((end.close - start.close) / Math.max(1, start.close)) * 100,
    volume: ((currentVolume - prevVolume) / Math.max(1, prevVolume)) * 100
  };
}

function summarizeThemeQuotes(themeQuotes) {
  const changes = { "7d": [], "30d": [], "90d": [] };
  themeQuotes.forEach((rows) => {
    changes["7d"].push(periodChange(rows, 7));
    changes["30d"].push(periodChange(rows, 30));
    changes["90d"].push(periodChange(rows, 90));
  });

  const metrics = {};
  Object.entries(changes).forEach(([period, items]) => {
    const avgPrice = items.reduce((sum, item) => sum + item.price, 0) / Math.max(1, items.length);
    const avgVolume = items.reduce((sum, item) => sum + item.volume, 0) / Math.max(1, items.length);
    const breadthRatio = items.filter((item) => item.price > 0).length / Math.max(1, items.length);
    metrics[period] = {
      momentum: clamp(50 + avgPrice * 4),
      volume: clamp(50 + avgVolume * 1.2),
      fundFlow: clamp(50 + avgPrice * 2.2 + avgVolume * 0.7 + breadthRatio * 18),
      breadth: clamp(35 + breadthRatio * 60),
      news: 55,
      ai: clamp(55 + avgPrice * 1.5 + breadthRatio * 10),
      crowdedness: clamp(40 + Math.max(0, avgPrice) * 2.4 + Math.max(0, avgVolume) * 0.25),
      confidence: clamp(55 + Math.min(35, items.length * 9))
    };
  });
  return metrics;
}

function percentChangeFromRows(rows, days, key = "close") {
  if (rows.length < 2) return null;
  const latest = rows[rows.length - 1];
  const start = rows[Math.max(0, rows.length - days)] || rows[0];
  if (!start?.[key]) return null;
  return Number((((latest[key] - start[key]) / Math.max(1, start[key])) * 100).toFixed(2));
}

function summarizeInstrumentQuote(ticker, rows) {
  const ordered = rows
    .filter((row) => row.date && Number.isFinite(row.close))
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = ordered[ordered.length - 1];
  if (!latest) return null;

  return {
    ticker,
    updatedAt: new Date().toISOString(),
    latest: {
      date: latest.date,
      close: latest.close,
      volume: Number.isFinite(latest.volume) ? latest.volume : null
    },
    changes: {
      "7d": percentChangeFromRows(ordered, 7, "close"),
      "30d": percentChangeFromRows(ordered, 30, "close"),
      "90d": percentChangeFromRows(ordered, 90, "close"),
      volume7d: percentChangeFromRows(ordered, 7, "volume"),
      volume30d: percentChangeFromRows(ordered, 30, "volume"),
      volume90d: percentChangeFromRows(ordered, 90, "volume")
    },
    history: ordered.slice(-60).map((row) => ({
      date: row.date,
      close: row.close,
      volume: row.volume
    }))
  };
}

function macroChange(macro, group, key, period) {
  const value = macro?.alpha?.[group]?.[key]?.changes?.[period];
  return Number.isFinite(value) ? value : 0;
}

function macroAdjustmentForTheme(themeId, macro, period) {
  const usdJpy = macroChange(macro, "fx", "usdjpy", period);
  const wti = macroChange(macro, "commodities", "wti", period);
  const brent = macroChange(macro, "commodities", "brent", period);
  const copper = macroChange(macro, "commodities", "copper", period);
  const gas = macroChange(macro, "commodities", "natural_gas", period);
  const gold = macroChange(macro, "commodities", "gold", period);
  const oil = (wti + brent) / 2;
  const adjustments = {
    fundFlow: 0,
    momentum: 0,
    news: 0,
    ai: 0,
    crowdedness: 0
  };

  const add = (key, value) => {
    adjustments[key] += value;
  };

  if (["jpy-exporters", "jp-auto"].includes(themeId)) {
    add("fundFlow", usdJpy * 0.55);
    add("ai", usdJpy * 0.25);
    add("crowdedness", Math.max(0, usdJpy) * 0.12);
  }

  if (["jp-trading-houses", "jp-low-pbr"].includes(themeId)) {
    add("fundFlow", oil * 0.25 + copper * 0.22 + usdJpy * 0.18);
    add("news", Math.max(0, oil + copper) * 0.16);
    add("ai", Math.max(0, oil + copper) * 0.12);
  }

  if (themeId === "jp-gold") {
    add("fundFlow", gold * 0.65 + usdJpy * 0.14);
    add("momentum", gold * 0.35);
    add("crowdedness", Math.max(0, gold) * 0.2);
  }

  if (themeId === "jp-electric-power") {
    add("fundFlow", gas * 0.16 - oil * 0.08);
    add("news", Math.max(0, gas) * 0.1);
  }

  if (["jp-reits", "jp-small-growth"].includes(themeId)) {
    add("fundFlow", -Math.max(0, usdJpy) * 0.18 - Math.max(0, oil) * 0.08);
    add("crowdedness", -Math.max(0, usdJpy) * 0.05);
  }

  if (["jp-inbound", "jp-retail"].includes(themeId)) {
    add("fundFlow", -Math.max(0, oil) * 0.12);
    add("news", -Math.max(0, oil) * 0.08);
  }

  return adjustments;
}

function applyMacroAdjustments(metrics, themeId, macro) {
  Object.entries(metrics).forEach(([period, metric]) => {
    const adjustment = macroAdjustmentForTheme(themeId, macro, period);
    Object.entries(adjustment).forEach(([key, value]) => {
      metric[key] = clamp((metric[key] || 0) + value);
    });
  });
}

async function fetchNewsScores() {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key || process.env.ALPHA_VANTAGE_ENABLE_NEWS !== "1") return {};

  const scores = {};
  await Promise.all(THEME_UNIVERSE.map(async (theme) => {
    const topics = theme.news.slice(0, 2).join(",");
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=NEWS_SENTIMENT&topics=${encodeURIComponent(topics)}&apikey=${encodeURIComponent(key)}`;
    try {
      const data = await fetchJson(url);
      const feed = data.feed || [];
      scores[theme.id] = clamp(50 + Math.min(30, feed.length * 2));
    } catch {
      scores[theme.id] = 55;
    }
  }));
  return scores;
}

async function fetchMacroSignals() {
  const macro = {};
  const fxUrl = process.env.FX_API_URL;
  const ratesUrl = process.env.RATES_API_URL || process.env.BOJ_STAT_API_URL;
  macro.alpha = await fetchAlphaMacroSignals();

  if (fxUrl) {
    try {
      macro.fx = { source: "configured", data: await fetchJson(fxUrl) };
    } catch (error) {
      macro.fx = { source: "configured", error: error.message };
    }
  } else {
    macro.fx = { source: "not_configured" };
  }

  if (ratesUrl) {
    try {
      macro.rates = { source: "configured", data: await fetchJson(ratesUrl) };
    } catch (error) {
      macro.rates = { source: "configured", error: error.message };
    }
  } else {
    macro.rates = { source: "not_configured" };
  }

  return macro;
}

async function buildMarketData() {
  const auth = await getJQuantsAuth();
  const macro = await fetchMacroSignals();
  const previousMarketData = loadPreviousMarketData();
  const instrumentQuotes = { ...(previousMarketData?.instrumentQuotes || {}) };
  if (!auth) {
    return {
      source: "sample",
      message: "J-Quants credentials are not configured. Set JQUANTS_API_KEY on the server.",
      macro,
      instrumentQuotes,
      themes: []
    };
  }

  const newsScores = await fetchNewsScores();
  const themes = [];
  const errors = [];
  const planConfig = jquantsPlanConfig();
  const requestLimit = Number(process.env.JQUANTS_MAX_REQUESTS_PER_RUN || (auth.mode === "v2" ? planConfig.requestsPerRun : 80));
  let requestCount = 0;

  for (const theme of THEME_UNIVERSE) {
    if (requestCount >= requestLimit) break;
    const quoteSets = [];
    const tickers = auth.mode === "v2" ? theme.tickers.slice(0, 1) : theme.tickers;
    for (const ticker of tickers) {
      if (requestCount >= requestLimit) break;
      try {
        requestCount += 1;
        const rows = await fetchDailyQuotes(ticker, auth);
        const quote = summarizeInstrumentQuote(ticker, rows);
        if (quote) instrumentQuotes[ticker] = quote;
        if (rows.length >= 10) quoteSets.push(rows);
      } catch (error) {
        errors.push(`${theme.id}:${ticker}:${error.message}`);
        // Keep the rest of the universe usable even when one ticker fails.
      }
    }
    if (!quoteSets.length) continue;
    const metrics = summarizeThemeQuotes(quoteSets);
    Object.values(metrics).forEach((metric) => {
      metric.news = newsScores[theme.id] || metric.news;
    });
    applyMacroAdjustments(metrics, theme.id, macro);
    themes.push({ id: theme.id, metrics });
  }

  const themeInstrumentTickers = Array.from(new Set(THEME_UNIVERSE.flatMap((theme) => theme.tickers)));
  const treasureTickers = Array.from(new Set(TREASURE_TICKERS));
  const allInstrumentTickers = Array.from(new Set([...themeInstrumentTickers, ...treasureTickers]));
  const quoteRequestLimit = allInstrumentTickers.length;
  const quoteBatch = allInstrumentTickers;

  for (const ticker of quoteBatch) {
    try {
      const rows = await fetchDailyQuotes(ticker, auth);
      const quote = summarizeInstrumentQuote(ticker, rows);
      if (quote) instrumentQuotes[ticker] = quote;
    } catch (error) {
      errors.push(`quote:${ticker}:${error.message}`);
    }
  }

  return {
    source: auth.mode === "v2" ? "jquants-v2" : "jquants-v1",
    jquantsPlan: auth.mode === "v2" ? jquantsPlan() : "v1",
    jquantsHistoryDays: jquantsHistoryDays(),
    updatedAt: new Date().toISOString(),
    message: themes.length ? "" : errors.slice(0, 3).join(" / "),
    macro,
    instrumentQuotes,
    instrumentQuoteBatch: {
      count: quoteRequestLimit,
      tickers: quoteBatch,
      treasureTickers,
      rotatedTickers: themeInstrumentTickers.filter((ticker) => !treasureTickers.includes(ticker))
    },
    themes
  };
}

async function handler(request, response) {
  try {
    const data = await buildMarketData();
    response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    response.status(200).json(data);
  } catch (error) {
    response.status(200).json({
      source: "sample",
      message: error.message,
      themes: []
    });
  }
}

module.exports = handler;
module.exports.buildMarketData = buildMarketData;
