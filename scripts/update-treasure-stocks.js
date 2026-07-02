const fs = require("fs");
const path = require("path");

const STOCK_NAMES = {
  "1306": "TOPIX連動型上場投信",
  "1321": "日経225連動型上場投信",
  "1615": "東証銀行業株価指数連動型ETF",
  "1801": "大成建設",
  "1802": "大林組",
  "1803": "清水建設",
  "2516": "東証グロース250 ETF",
  "2768": "双日",
  "3099": "三越伊勢丹ホールディングス",
  "3283": "日本プロロジスリート投資法人",
  "3462": "野村不動産マスターファンド投資法人",
  "4063": "信越化学工業",
  "4478": "フリー",
  "4483": "JMDC",
  "5713": "住友金属鉱山",
  "6146": "ディスコ",
  "6208": "石川製作所",
  "6301": "小松製作所",
  "6501": "日立製作所",
  "6503": "三菱電機",
  "6723": "ルネサスエレクトロニクス",
  "6857": "アドバンテスト",
  "6902": "デンソー",
  "6920": "レーザーテック",
  "6954": "ファナック",
  "6981": "村田製作所",
  "7011": "三菱重工業",
  "7012": "川崎重工業",
  "7013": "IHI",
  "7201": "日産自動車",
  "7203": "トヨタ自動車",
  "7267": "ホンダ",
  "7270": "SUBARU",
  "7532": "パン・パシフィック",
  "7735": "SCREENホールディングス",
  "8001": "伊藤忠商事",
  "8015": "豊田通商",
  "8031": "三井物産",
  "8035": "東京エレクトロン",
  "8053": "住友商事",
  "8058": "三菱商事",
  "8267": "イオン",
  "8306": "三菱UFJフィナンシャル・グループ",
  "8308": "りそなホールディングス",
  "8316": "三井住友フィナンシャルグループ",
  "8411": "みずほフィナンシャルグループ",
  "8750": "第一生命ホールディングス",
  "8766": "東京海上ホールディングス",
  "8795": "T&Dホールディングス",
  "8951": "日本ビルファンド投資法人",
  "8952": "ジャパンリアルエステイト投資法人",
  "8953": "日本都市ファンド投資法人",
  "9201": "日本航空",
  "9432": "NTT",
  "9433": "KDDI",
  "9434": "ソフトバンク",
  "9501": "東京電力ホールディングス",
  "9502": "中部電力",
  "9503": "関西電力",
  "9504": "中国電力",
  "9506": "東北電力",
  "9508": "九州電力",
  "9983": "ファーストリテイリング"
};

const THEME_UNIVERSE = [
  { id: "jp-semiconductor", tickers: ["8035", "6857", "7735", "1321"] },
  { id: "jp-defense", tickers: ["7011", "7012", "7013", "6208"] },
  { id: "jp-banks", tickers: ["8306", "8316", "8411", "1615"] },
  { id: "jp-electric-power", tickers: ["9501", "9503", "9502", "9513"] },
  { id: "jp-trading-houses", tickers: ["8001", "8058", "8031", "1306"] },
  { id: "jp-gold", tickers: ["1540", "1328", "5713"] },
  { id: "jp-inbound", tickers: ["3099", "9201", "9020", "4661"] },
  { id: "jp-small-growth", tickers: ["2516", "4483", "4478"] },
  { id: "jpy-exporters", tickers: ["7203", "7267", "6954", "6503"] },
  { id: "jp-reits", tickers: ["1343", "8951", "3283"] },
  { id: "jp-auto", tickers: ["7203", "7267", "6902"] },
  { id: "jp-pharma", tickers: ["4502", "4568", "4519"] },
  { id: "jp-telecom", tickers: ["9432", "9433", "9434"] },
  { id: "jp-retail", tickers: ["9983", "7532", "8267"] },
  { id: "jp-construction", tickers: ["1801", "1802", "1803"] },
  { id: "jp-insurance", tickers: ["8766", "8630", "8725"] },
  { id: "jp-chemical", tickers: ["4063", "4188", "4004"] },
  { id: "jp-low-pbr", tickers: ["1306", "8411", "8058"] }
];

const THEME_LABELS = {
  "jp-semiconductor": "半導体",
  "jp-defense": "防衛",
  "jp-banks": "銀行",
  "jp-electric-power": "電力",
  "jp-trading-houses": "商社",
  "jp-gold": "金",
  "jp-inbound": "インバウンド",
  "jp-small-growth": "グロース",
  "jpy-exporters": "円安恩恵",
  "jp-reits": "REIT",
  "jp-auto": "自動車",
  "jp-pharma": "製薬",
  "jp-telecom": "通信",
  "jp-retail": "小売",
  "jp-construction": "建設",
  "jp-insurance": "保険",
  "jp-chemical": "化学",
  "jp-low-pbr": "低PBR"
};

function buildThemeTickerMap() {
  const map = new Map();
  THEME_UNIVERSE.forEach((theme) => {
    theme.tickers.forEach((ticker) => {
      const key = String(ticker);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(theme.id);
    });
  });
  return map;
}

function themeFlowBonus(themeIds, marketData) {
  if (!themeIds?.length) return 0;
  const themes = marketData?.themes || [];
  let best = 0;
  themeIds.forEach((id) => {
    const theme = themes.find((item) => item.id === id);
    const m7 = num(theme?.metrics?.["7d"]?.fundFlow, NaN);
    const m30 = num(theme?.metrics?.["30d"]?.fundFlow, NaN);
    if (Number.isFinite(m7) && Number.isFinite(m30)) {
      best = Math.max(best, m7 * 0.4 + m30 * 0.6);
    }
  });
  if (best <= 50) return 0;
  return clamp(Math.round((best - 50) * 0.15), 0, 8);
}

function isIndexLinkedType(type = "", name = "") {
  return /ETF|投信|連動|REIT|リート/i.test(`${type} ${name}`);
}

function overheatAdjustments(quote, technical) {
  let flowPenalty = 0;
  let scorePenalty = 0;
  const p7 = num(quote?.changes?.["7d"], NaN);
  const rsi = num(technical?.rsi, NaN);
  if (Number.isFinite(rsi)) {
    if (rsi > 70) {
      flowPenalty += 8;
      scorePenalty += 6;
    } else if (rsi > 65) {
      flowPenalty += 4;
      scorePenalty += 3;
    }
  }
  if (Number.isFinite(p7)) {
    if (p7 > 15) {
      flowPenalty += 10;
      scorePenalty += 8;
    } else if (p7 > 10) {
      flowPenalty += 5;
      scorePenalty += 4;
    }
  }
  return { flowPenalty, scorePenalty };
}

function resolveMarketDataDefaultPath() {
  const candidates = [
    path.join("data", "market-data.json"),
    path.join("docs", "fund-flow-ai-system", "data", "market-data.json"),
    path.resolve(__dirname, "..", "data", "market-data.json"),
    path.resolve(__dirname, "..", "docs", "fund-flow-ai-system", "data", "market-data.json"),
    path.resolve(__dirname, "..", "..", ".gemini", "fund-flow-ai-system", "data", "market-data.json")
  ];
  for (const candidate of candidates) {
    const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) return resolved;
  }
  return path.resolve(process.cwd(), "docs", "fund-flow-ai-system", "data", "market-data.json");
}

function resolveTreasureOutputDefaultPath() {
  const input = resolveMarketDataDefaultPath();
  if (input.includes(`${path.sep}data${path.sep}market-data.json`)) {
    return input.replace(/market-data\.json$/, "treasure-stocks.json");
  }
  return path.resolve(process.cwd(), "docs", "fund-flow-ai-system", "data", "treasure-stocks.json");
}

function resolveAppJsPath() {
  const candidates = [
    process.env.APP_JS_PATH,
    path.join("app.js"),
    path.join("docs", "fund-flow-ai-system", "app.js"),
    path.resolve(__dirname, "..", "app.js"),
    path.resolve(__dirname, "..", "docs", "fund-flow-ai-system", "app.js"),
    path.resolve(__dirname, "..", "..", ".gemini", "fund-flow-ai-system", "app.js")
  ].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) return resolved;
  }
  return null;
}

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

function includesAny(value, words) {
  const text = String(value || "");
  return words.some((word) => text.includes(word));
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
  const qualityBonus = includesAny(quality, ["業績良好", "安定業績", "高成長", "改善", "高配当", "割安", "回復"]) ? 8 : quality ? 4 : 0;
  const newsBonus = includesAny(instrument.newsRisk, ["悪材料未検出"]) ? 6 : 0;
  return num(instrument.strength) + qualityBonus + newsBonus - warningPenalty;
}

function fundFlowScore(quote) {
  const c = quote?.changes || {};
  const p90 = num(c["90d"]);
  const p30 = num(c["30d"]);
  const p7 = num(c["7d"]);
  const v30 = num(c.volume30d);
  const v7 = num(c.volume7d);
  const trend = p90 * 0.28 + p30 * 0.36 + p7 * 0.36;
  const volume = clamp(v30 * 0.25 + v7 * 0.35, -20, 40);
  return clamp(Math.round(50 + trend * 1.2 + volume));
}

// 地合い（マーケットレジーム）: TOPIX連動ETF(1306)、無ければ日経225連動(1321)の終値と25日線で判定。
// bullish=false（25日線割れ）の間、観測スペースは新規エントリーを停止する（決済追跡は継続）。
// 押し目買い+損切-3.5%/利確+7%の戦略は下落局面では損切だけが先に成立しやすいため、その期間を避ける。
function marketRegime(quotes) {
  for (const code of ["1306", "1321"]) {
    const history = quoteHistory(quotes?.[code]);
    if (history.length < 25) continue;
    const closes = history.map((item) => item.close);
    const current = closes[closes.length - 1];
    const sma25 = avg(last(closes, 25));
    if (!sma25 || !Number.isFinite(current)) continue;
    return {
      index: code === "1306" ? "TOPIX連動(1306)" : "日経225連動(1321)",
      current,
      sma25: Number(sma25.toFixed(2)),
      deviationPct: Number((((current - sma25) / sma25) * 100).toFixed(2)),
      bullish: current >= sma25,
      date: history[history.length - 1].date || null
    };
  }
  return null;
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

function formatFinancialValue(value, digits = 1, suffix = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${number.toFixed(digits)}${suffix}`;
}

function finiteFinancialValue(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function scoreEarnings(instrument, financial = null) {
  const actual = financial?.latestStatement || null;
  if (actual) {
    const progressVsExpected = finiteFinancialValue(actual.progressVsExpectedPct);
    const progress = finiteFinancialValue(actual.progressBasis);
    let score = 64;
    if (progressVsExpected != null) {
      if (progressVsExpected >= 10) score = 84;
      else if (progressVsExpected >= 0) score = 74;
      else if (progressVsExpected >= -10) score = 62;
      else score = 46;
    } else if (progress != null) {
      score = progress >= 75 ? 76 : progress >= 50 ? 68 : progress >= 25 ? 60 : 52;
    }
    if (actual.eps != null && Number(actual.eps) > 0) score += 4;
    if (actual.profit != null && Number(actual.profit) > 0) score += 4;
    const finalScore = clamp(score);
    return {
      score: finalScore,
      ok: finalScore >= 65,
      label: finalScore >= 78 ? "実決算良好" : finalScore >= 65 ? "実決算確認OK" : finalScore >= 55 ? "進捗注意" : "実決算弱い",
      reason: [
        actual.disclosedDate ? `決算日 ${actual.disclosedDate}` : null,
        actual.eps != null ? `EPS ${formatFinancialValue(actual.eps, 2)}` : null,
        progress != null ? `進捗 ${formatFinancialValue(progress, 1, "%")}` : null,
        progressVsExpected != null ? `期待比 ${formatFinancialValue(progressVsExpected, 1, "pt")}` : null
      ].filter(Boolean).join(" / "),
      actual
    };
  }

  const quality = instrument.quality || "";
  const warning = instrument.warning || "";
  let score = 58;
  if (includesAny(quality, ["業績良好", "安定業績", "高成長", "改善", "高配当", "割安", "回復"])) score += 22;
  if (includesAny(quality, ["市場データ候補", "お宝候補"])) score += 8;
  if (includesAny(warning, ["注意", "材料確認", "値動き", "混雑"])) score -= 10;
  const finalScore = clamp(score);
  return {
    score: finalScore,
    ok: finalScore >= 65,
    label: finalScore >= 75 ? "業績良好" : finalScore >= 62 ? "業績確認OK" : "決算確認待ち",
    reason: quality || "業績ラベル未確認"
  };
}

function scoreMaterial(instrument) {
  const newsRisk = instrument.newsRisk || "";
  const warning = instrument.warning || "";
  let score = 60;
  if (includesAny(newsRisk, ["悪材料未検出"])) score += 22;
  if (includesAny(newsRisk, ["未確認", "材料確認"])) score -= 6;
  if (includesAny(newsRisk, ["悪材料", "過熱", "注意"])) score -= 18;
  if (includesAny(warning, ["混雑", "値動き", "注意"])) score -= 8;
  const finalScore = clamp(score);
  return {
    score: finalScore,
    ok: finalScore >= 62,
    label: finalScore >= 76 ? "悪材料未検出" : finalScore >= 62 ? "材料確認OK" : "材料確認待ち",
    reason: newsRisk || warning || "材料ラベル未確認"
  };
}

function scoreVolume(technical, quote) {
  const changes = quote?.changes || {};
  const volumeRatio = num(technical?.volumeRatio, null);
  const volume7d = num(changes.volume7d, null);
  const volume30d = num(changes.volume30d, null);
  let score = 50;
  if (volumeRatio != null) score += clamp((volumeRatio - 0.8) * 35, -18, 28);
  if (volume7d != null) score += clamp(volume7d * 0.06, -10, 18);
  if (volume30d != null) score += clamp(volume30d * 0.035, -8, 14);
  const finalScore = clamp(Math.round(score));
  return {
    score: finalScore,
    ok: finalScore >= 60,
    label: finalScore >= 75 ? "出来高増加" : finalScore >= 60 ? "出来高確認OK" : "出来高不足",
    ratio: volumeRatio == null ? null : Number(volumeRatio.toFixed(2)),
    volume7d,
    volume30d
  };
}

function scoreChartPosition(technical) {
  if (!technical) {
    return { score: 45, ok: false, label: "チャート不足", reason: "履歴不足" };
  }
  const deviation = num(technical.deviation, null);
  const rsi = num(technical.rsi, null);
  let score = 48;
  if (technical.trendOk) score += 22;
  if (technical.pullbackOk) score += 16;
  if (rsi != null && rsi >= 35 && rsi <= 58) score += 12;
  if (rsi != null && rsi > 65) score -= 12;
  else if (rsi != null && rsi > 58) score -= 4;
  if (deviation != null && deviation >= -5 && deviation <= 5) score += 10;
  if (deviation != null && deviation > 10) score -= 12;
  const finalScore = clamp(Math.round(score));
  return {
    score: finalScore,
    ok: finalScore >= 65,
    label: finalScore >= 78 ? "好位置" : finalScore >= 65 ? "確認OK" : finalScore >= 55 ? "押し目待ち" : "位置悪い",
    reason: `25日乖離 ${deviation == null ? "-" : deviation.toFixed(1)}% / RSI ${rsi == null ? "-" : rsi.toFixed(1)}`
  };
}

function confirmationChecks(instrument, technical, quote, financial = null) {
  const earnings = scoreEarnings(instrument, financial);
  const material = scoreMaterial(instrument);
  const volume = scoreVolume(technical, quote);
  const chart = scoreChartPosition(technical);
  const score = clamp(Math.round(
    earnings.score * 0.25 +
    material.score * 0.23 +
    volume.score * 0.24 +
    chart.score * 0.28
  ));
  const passed = [earnings, material, volume, chart].filter((item) => item.ok).length;
  return { score, passed, earnings, material, volume, chart };
}

function normalizeInstrument(instrument, theme = null) {
  const warning = instrument.warning || "";
  return {
    quality: warning ? "注意あり" : "業績良好候補",
    newsRisk: warning ? "悪材料確認あり" : "悪材料未検出",
    themeId: theme?.id || null,
    themeName: theme?.name || null,
    ...instrument,
    ticker: String(instrument.ticker || "")
  };
}

function collectInstrumentMap(marketData) {
  const map = new Map();
  const themeTickerMap = buildThemeTickerMap();
  const add = (instrument, theme) => {
    if (!instrument?.ticker) return;
    const ticker = String(instrument.ticker);
    const enriched = normalizeInstrument(instrument, theme);
    const current = map.get(ticker);
    if (!current || instrumentScore(enriched) > instrumentScore(current)) {
      map.set(ticker, enriched);
    }
  };

  (marketData.themes || []).forEach((theme) => {
    (theme.instruments || []).forEach((instrument) => add(instrument, theme));
  });

  const appPath = resolveAppJsPath();
  if (!appPath) {
    console.warn("app.js not found; using market-data instruments only.");
  }
  try {
    if (!appPath) throw new Error("skip");
    const appText = fs.readFileSync(appPath, "utf8");
    const pattern = /\{\s*ticker:\s*"(\d{4})"\s*,\s*name:\s*"([^"]+)"\s*,\s*type:\s*"([^"]*)"\s*,\s*strength:\s*(\d+)\s*,\s*warning:\s*"([^"]*)"(?:\s*,\s*quality:\s*"([^"]*)")?(?:\s*,\s*newsRisk:\s*"([^"]*)")?/g;
    let match;
    while ((match = pattern.exec(appText)) !== null) {
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

  for (const [ticker, instrument] of map) {
    const themeIds = themeTickerMap.get(ticker) || [];
    instrument.themeIds = themeIds;
    if (!instrument.themeName && themeIds.length) {
      instrument.themeName = themeIds.map((id) => THEME_LABELS[id] || id).join(" / ");
    }
  }

  return map;
}

function signalFor(stock) {
  const checks = stock.checks || {};
  const rsi = num(stock.technical?.rsi, NaN);
  const overbought = Number.isFinite(rsi) && rsi > 65;
  const indexLinked = isIndexLinkedType(stock.type, stock.name);
  if (
    stock.score >= 78 &&
    stock.winRate >= 65 &&
    checks.passed >= 3 &&
    checks.chart?.ok &&
    !overbought &&
    !indexLinked
  ) {
    return "統合買い候補";
  }
  if (stock.score >= 68 && stock.winRate >= 58 && checks.passed >= 2) {
    return overbought || indexLinked ? "監視継続" : "確認候補";
  }
  if (stock.score >= 56) return "監視継続";
  return "見送り";
}

function buildStock(ticker, instrument, quote, financial = null, marketData = null) {
  const technical = technicalSignal(quote);
  const overheat = overheatAdjustments(quote, technical);
  let flow = clamp(fundFlowScore(quote) - overheat.flowPenalty);
  const baseTreasure = instrumentScore(instrument);
  const kind = stockSignalKind(instrument, quote);
  const signalBonus = kind === "buy" ? 18 : kind === "watch" ? 12 : kind === "early" ? 7 : -8;
  const trade = estimateTradePlan(technical, quote);
  const checks = confirmationChecks(instrument, technical, quote, financial);
  const technicalScore = technical?.score || 0;
  const kabuScore = trade.winRate != null
    ? clamp(technicalScore * 0.62 + trade.winRate * 0.38)
    : technicalScore;
  const treasureScore = clamp(baseTreasure + signalBonus);
  const themeIds = instrument.themeIds || [];
  const themeBonus = themeFlowBonus(themeIds, marketData);
  const indexLinked = isIndexLinkedType(instrument.type, instrument.name);
  let rawScore = flow * 0.28 + treasureScore * 0.18 + kabuScore * 0.34 + checks.score * 0.20;
  rawScore += themeBonus - overheat.scorePenalty;
  if (indexLinked) rawScore -= 4;
  const latest = quote?.latest || {};

  const stock = {
    code: String(ticker),
    name: instrument.name || STOCK_NAMES[String(ticker)] || String(ticker),
    score: clamp(Math.round(rawScore)),
    flowScore: flow,
    treasureScore: Math.round(treasureScore),
    kabuScore: Math.round(kabuScore),
    confirmationScore: checks.score,
    themeFlowBonus: themeBonus,
    overheatPenalty: overheat.scorePenalty,
    signal: "",
    price: num(latest.close, technical?.current ?? null),
    date: latest.date || technical?.date || null,
    theme: instrument.themeName || null,
    themeIds,
    type: instrument.type || "日本株",
    quality: instrument.quality || null,
    newsRisk: instrument.newsRisk || null,
    financial: financial || null,
    buy: trade.buy,
    tp: trade.tp,
    sl: trade.sl,
    rr: trade.rr,
    winRate: trade.winRate,
    checks,
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
  const marketPath = process.env.MARKET_DATA_INPUT_PATH
    ? path.resolve(process.cwd(), process.env.MARKET_DATA_INPUT_PATH)
    : resolveMarketDataDefaultPath();
  const outputPath = process.env.TREASURE_STOCKS_OUTPUT_PATH
    ? path.resolve(process.cwd(), process.env.TREASURE_STOCKS_OUTPUT_PATH)
    : resolveTreasureOutputDefaultPath();
  const marketData = readJson(marketPath, {});
  const quotes = marketData.instrumentQuotes || {};
  const financials = marketData.financials || {};
  const instruments = collectInstrumentMap(marketData);

  const stocks = [...instruments.entries()]
    .map(([ticker, instrument]) => {
      const quote = quotes[String(ticker)];
      if (!quote) return null;
      return buildStock(ticker, instrument, quote, financials[String(ticker)] || null, marketData);
    })
    .filter((stock) => stock && stock.price != null)
    .filter((stock) => stock.treasureScore >= 50 || stock.flowScore >= 52 || stock.kabuScore >= 45)
    .sort((a, b) => {
      // Strongly prefer individual stocks (non-ETF/REIT/index) at the front for 統合銘柄ランキング
      const aIsIndex = isIndexLinkedType(a.type, a.name) ? 1 : 0;
      const bIsIndex = isIndexLinkedType(b.type, b.name) ? 1 : 0;
      if (aIsIndex !== bIsIndex) return aIsIndex - bIsIndex;
      const aKabu = a.kabuScore - (aIsIndex ? 12 : 0);
      const bKabu = b.kabuScore - (bIsIndex ? 12 : 0);
      if (bKabu !== aKabu) return bKabu - aKabu;
      const aScore = a.score - (aIsIndex ? 8 : 0);
      const bScore = b.score - (bIsIndex ? 8 : 0);
      return bScore - aScore || b.flowScore - a.flowScore;
    });

  writeJson(outputPath, {
    source: "fund-flow-treasure-kabukazidou",
    logic: "score=fundFlow×28%+treasure×18%+kabu×34%+confirmation×20%+themeBonus-overheatPenalty; ETF/指数連動-4; 統合銘柄ランキング向けに個別株優先（非ETF/REIT/連動を上位に）; 買い候補はRSI≤65・個別株のみ",
    updatedAt: new Date().toISOString(),
    marketUpdatedAt: marketData.updatedAt || null,
    marketRegime: marketRegime(quotes),
    stocks
  });

  console.log(JSON.stringify({ stocks: stocks.length, updatedAt: new Date().toISOString() }));
}

main();
