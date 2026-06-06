const fs = require("fs");
const path = require("path");

const STOCK_NAMES = {
  "6723": "ルネサスエレクトロニクス",
  "6146": "ディスコ",
  "6920": "レーザーテック",
  "8308": "りそなホールディングス",
  "7182": "ゆうちょ銀行",
  "7167": "めぶきフィナンシャルグループ",
  "9508": "九州電力",
  "9506": "東北電力",
  "9504": "中国電力",
  "8015": "豊田通商",
  "8053": "住友商事",
  "2768": "双日",
  "8952": "ジャパンリアルエステイト投資法人",
  "8953": "日本都市ファンド投資法人",
  "3462": "野村不動産マスターファンド投資法人",
  "6301": "小松製作所",
  "6501": "日立製作所",
  "6981": "村田製作所",
  "7201": "日産自動車",
  "7270": "SUBARU",
  "8750": "第一生命ホールディングス",
  "8795": "T&Dホールディングス",
  "8766": "東京海上ホールディングス",
  "8630": "SOMPOホールディングス",
  "8725": "MS&ADインシュアランスグループ",
  "4063": "信越化学工業",
  "9983": "ファーストリテイリング"
};

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

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, low = 0, high = 100) {
  return Math.max(low, Math.min(high, value));
}

function avg(values) {
  const clean = values.map(Number).filter(Number.isFinite);
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function last(values, count) {
  return values.slice(Math.max(0, values.length - count));
}

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
  const rs = gain / loss;
  return 100 - (100 / (1 + rs));
}

function quoteHistory(quote) {
  return (quote?.history || [])
    .filter((item) => Number.isFinite(Number(item.close)))
    .map((item) => ({
      date: item.date || null,
      close: Number(item.close),
      volume: num(item.volume, null)
    }));
}

function instrumentScore(instrument) {
  const warningPenalty = instrument.warning ? 12 : 0;
  const quality = instrument.quality || "";
  const qualityBonus = quality.includes("業績良好") ? 8 : quality ? 4 : 0;
  const newsBonus = instrument.newsRisk === "悪材料未検出" ? 6 : 0;
  return num(instrument.strength) + qualityBonus + newsBonus - warningPenalty;
}

function fundFlowScore(quote) {
  const c = quote?.changes || {};
  const p90 = num(c["90d"]);
  const p30 = num(c["30d"]);
  const p7 = num(c["7d"]);
  const v30 = num(c.volume30d);
  const v7 = num(c.volume7d);
  const trend = p90 * 0.22 + p30 * 0.34 + p7 * 0.44;
  const volume = clamp(v30 * 0.25 + v7 * 0.35, -20, 40);
  return clamp(Math.round(50 + trend * 1.2 + volume));
}

function stockSignalKind(instrument, quote) {
  const c = quote?.changes || {};
  const p90 = num(c["90d"], NaN);
  const p30 = num(c["30d"], NaN);
  const p7 = num(c["7d"], NaN);
  const v30 = num(c.volume30d, NaN);
  const v7 = num(c.volume7d, NaN);
  if (![p90, p30, p7, v30, v7].every(Number.isFinite)) return "neutral";
  if (p90 > 0 && p30 > p90 && p7 > p30 && v7 > v30 && instrumentScore(instrument) >= 70) return "buy";
  if (p90 > 0 && p30 > 0 && p7 > 0) return "watch";
  if (p90 <= 0 && p30 > 0) return "early";
  return "neutral";
}

function technicalSignal(quote) {
  const history = quoteHistory(quote);
  if (history.length < 30) return null;
  const closes = history.map((item) => item.close);
  const volumes = history.map((item) => item.volume).filter((value) => value != null);
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
  const momentumOk = rsi != null && rsi >= 28 && rsi <= 72;
  const pullbackOk = deviation != null && deviation >= -8 && deviation <= 8;
  const volumeOk = volumeRatio != null && volumeRatio >= 0.95;

  let score = 0;
  score += trendOk ? 28 : 8;
  score += momentumOk ? 18 : 6;
  score += pullbackOk ? 18 : 4;
  score += volumeOk ? 18 : 4;
  if (deviation != null && deviation < -2 && deviation >= -8) score += 8;
  if (rsi != null && rsi >= 35 && rsi <= 58) score += 6;
  if (volumeRatio != null && volumeRatio >= 1.1) score += 4;

  return {
    current,
    sma25,
    sma75,
    rsi,
    deviation,
    volumeRatio,
    trendOk,
    momentumOk,
    pullbackOk,
    volumeOk,
    score: clamp(Math.round(score))
  };
}

function estimateTradePlan(technical, quote) {
  const price = technical?.current ?? num(quote?.latest?.close, null);
  if (!price) return { buy: null, tp: null, sl: null, rr: null, winRate: null };
  const deviation = num(technical?.deviation, 0);
  const rsi = num(technical?.rsi, 50);
  const volatility = Math.max(0.035, Math.min(0.12, Math.abs(num(quote?.changes?.["30d"])) / 100 / 3));
  const buyDiscount = deviation > 4 ? 0.03 : deviation < -4 ? 0.005 : 0.015;
  const buy = Math.round(price * (1 - buyDiscount));
  const sl = Math.round(buy * (1 - Math.max(0.035, volatility * 0.9)));
  const tp = Math.round(buy * (1 + Math.max(0.07, volatility * 1.7)));
  const rr = (buy - sl) > 0 ? Number(((tp - buy) / (buy - sl)).toFixed(2)) : null;

  let winRate = 50;
  winRate += technical?.trendOk ? 12 : -4;
  winRate += technical?.pullbackOk ? 8 : -3;
  winRate += technical?.volumeOk ? 5 : -2;
  winRate += rsi >= 35 && rsi <= 58 ? 6 : rsi > 72 ? -8 : 0;
  winRate += num(quote?.changes?.["30d"]) > 0 ? 4 : -2;
  winRate += rr != null && rr >= 1.6 ? 4 : 0;

  return { buy, tp, sl, rr, winRate: clamp(Math.round(winRate), 35, 82) };
}

function collectInstrumentMap(marketData) {
  const map = new Map();
  const add = (instrument, theme) => {
    if (!instrument?.ticker) return;
    const ticker = String(instrument.ticker);
    const enriched = {
      quality: instrument.warning ? "注意あり" : "業績良好候補",
      newsRisk: instrument.warning ? "悪材料確認あり" : "悪材料未検出",
      themeId: theme?.id || null,
      themeName: theme?.name || null,
      ...instrument
    };
    const current = map.get(ticker);
    if (!current || instrumentScore(enriched) > instrumentScore(current)) {
      map.set(ticker, enriched);
    }
  };

  (marketData.themes || []).forEach((theme) => {
    (theme.instruments || []).forEach((instrument) => add(instrument, theme));
  });

  const appPath = path.resolve(process.cwd(), "docs", "fund-flow-ai-system", "app.js");
  try {
    const appText = fs.readFileSync(appPath, "utf8");
    const instrumentPattern = /\{\s*ticker:\s*"(\d{4})"\s*,\s*name:\s*"([^"]+)"\s*,\s*type:\s*"([^"]*)"\s*,\s*strength:\s*(\d+)\s*,\s*warning:\s*"([^"]*)"(?:\s*,\s*quality:\s*"([^"]*)")?(?:\s*,\s*newsRisk:\s*"([^"]*)")?/g;
    let match;
    while ((match = instrumentPattern.exec(appText)) !== null) {
      const [, ticker, name, type, strength, warning, quality, newsRisk] = match;
      add({
        ticker,
        name,
        type,
        strength: Number(strength),
        warning,
        quality: quality || (warning ? "注意あり" : "業績良好候補"),
        newsRisk: newsRisk || (warning ? "悪材料確認あり" : "悪材料未検出")
      }, null);
    }
  } catch {
    // Static app metadata is a display-quality enhancement. Market data remains the source of prices.
  }

  Object.keys(marketData.instrumentQuotes || {}).forEach((ticker) => {
    if (!map.has(ticker)) {
      map.set(ticker, {
        ticker,
        name: STOCK_NAMES[ticker] || ticker,
        type: "日本株",
        strength: 62,
        warning: "",
        quality: "市場データ候補",
        newsRisk: "未確認",
        themeId: null,
        themeName: null
      });
    }
  });

  (marketData.instrumentQuoteBatch?.treasureTickers || []).forEach((ticker) => {
    const code = String(ticker);
    if (!map.has(code)) {
      map.set(code, {
        ticker: code,
        name: STOCK_NAMES[code] || code,
        type: "日本株",
        strength: 64,
        warning: "",
        quality: "お宝候補",
        newsRisk: "未確認",
        themeId: null,
        themeName: null
      });
    }
  });

  return map;
}

function signalFor(stock) {
  if (stock.score >= 78 && stock.winRate >= 65 && stock.technical?.pullbackOk) return "統合買い候補";
  if (stock.score >= 68 && stock.winRate >= 58) return "確認候補";
  if (stock.score >= 56) return "監視継続";
  return "見送り";
}

function buildStock(ticker, instrument, quote) {
  const flow = fundFlowScore(quote);
  const baseTreasure = instrumentScore(instrument);
  const kind = stockSignalKind(instrument, quote);
  const signalBonus = kind === "buy" ? 18 : kind === "watch" ? 12 : kind === "early" ? 7 : -8;
  const technical = technicalSignal(quote);
  const trade = estimateTradePlan(technical, quote);

  const technicalScore = technical?.score || 0;
  const kabuScore = trade.winRate != null
    ? clamp(technicalScore * 0.62 + trade.winRate * 0.38)
    : technicalScore;
  const treasureScore = clamp(baseTreasure + signalBonus);
  const rawScore = flow * 0.38 + treasureScore * 0.22 + kabuScore * 0.40;
  const latest = quote?.latest || {};
  const stock = {
    code: String(ticker),
    name: instrument.name || STOCK_NAMES[String(ticker)] || String(ticker),
    score: clamp(Math.round(rawScore)),
    flowScore: flow,
    treasureScore: Math.round(treasureScore),
    kabuScore: Math.round(kabuScore),
    signal: "",
    price: num(latest.close, technical?.current ?? null),
    date: latest.date || technical?.date || null,
    theme: instrument.themeName || null,
    type: instrument.type || "日本株",
    quality: instrument.quality || null,
    newsRisk: instrument.newsRisk || null,
    buy: trade.buy,
    tp: trade.tp,
    sl: trade.sl,
    rr: trade.rr,
    winRate: trade.winRate,
    changes: {
      "7d": num(quote?.changes?.["7d"], null),
      "30d": num(quote?.changes?.["30d"], null),
      "90d": num(quote?.changes?.["90d"], null),
      volume7d: num(quote?.changes?.volume7d, null),
      volume30d: num(quote?.changes?.volume30d, null)
    },
    technical: technical ? {
      deviation: technical.deviation == null ? null : Number(technical.deviation.toFixed(2)),
      rsi: technical.rsi == null ? null : Number(technical.rsi.toFixed(1)),
      volumeRatio: technical.volumeRatio == null ? null : Number(technical.volumeRatio.toFixed(2)),
      trendOk: technical.trendOk,
      pullbackOk: technical.pullbackOk,
      volumeOk: technical.volumeOk
    } : null
  };
  stock.signal = signalFor(stock);
  return stock;
}

function main() {
  const marketPath = path.resolve(process.cwd(), process.env.MARKET_DATA_INPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "market-data.json"));
  const outputPath = path.resolve(process.cwd(), process.env.TREASURE_STOCKS_OUTPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "treasure-stocks.json"));
  const marketData = readJson(marketPath, {});
  const quotes = marketData.instrumentQuotes || {};
  const instruments = collectInstrumentMap(marketData);

  const stocks = [...instruments.entries()]
    .map(([ticker, instrument]) => {
      const quote = quotes[String(ticker)];
      if (!quote) return null;
      return buildStock(ticker, instrument, quote);
    })
    .filter((stock) => stock && stock.price != null)
    .filter((stock) => stock.treasureScore >= 50 || stock.flowScore >= 52 || stock.kabuScore >= 45)
    .sort((a, b) => b.score - a.score || b.flowScore - a.flowScore || b.kabuScore - a.kabuScore);

  writeJson(outputPath, {
    source: "fund-flow-treasure-kabukazidou",
    logic: "fund-flowお宝候補銘柄 + kabukazidou型の25日線乖離/75日線トレンド/RSI/出来高/売買ライン推定",
    updatedAt: new Date().toISOString(),
    marketUpdatedAt: marketData.updatedAt || null,
    stocks
  });

  console.log(JSON.stringify({ stocks: stocks.length, updatedAt: new Date().toISOString() }));
}

main();
