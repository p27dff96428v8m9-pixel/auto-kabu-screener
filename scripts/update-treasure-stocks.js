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

function scoreQuote(quote) {
  const c = quote?.changes || {};
  const p90 = num(c["90d"]);
  const p30 = num(c["30d"]);
  const p7 = num(c["7d"]);
  const v30 = num(c.volume30d);
  const v7 = num(c.volume7d);
  const trend = p90 * 0.22 + p30 * 0.34 + p7 * 0.44;
  const volume = Math.max(-20, Math.min(40, v30 * 0.25 + v7 * 0.35));
  return Math.max(0, Math.min(100, Math.round(50 + trend * 1.2 + volume)));
}

function signalFor(score, quote) {
  const p7 = num(quote?.changes?.["7d"]);
  const p30 = num(quote?.changes?.["30d"]);
  if (score >= 75 && p7 >= 0) return "強い資金流入";
  if (score >= 62 && p30 >= 0) return "確認候補";
  if (score >= 52) return "監視継続";
  return "見送り";
}

function main() {
  const marketPath = path.resolve(process.cwd(), process.env.MARKET_DATA_INPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "market-data.json"));
  const outputPath = path.resolve(process.cwd(), process.env.TREASURE_STOCKS_OUTPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "treasure-stocks.json"));
  const marketData = readJson(marketPath, {});
  const tickers = marketData.instrumentQuoteBatch?.treasureTickers || Object.keys(STOCK_NAMES);
  const quotes = marketData.instrumentQuotes || {};

  const stocks = tickers
    .map((ticker) => {
      const quote = quotes[String(ticker)];
      const score = scoreQuote(quote);
      const latest = quote?.latest || {};
      return {
        code: String(ticker),
        name: STOCK_NAMES[String(ticker)] || String(ticker),
        score,
        signal: signalFor(score, quote),
        price: num(latest.close, null),
        date: latest.date || null,
        changes: {
          "7d": num(quote?.changes?.["7d"], null),
          "30d": num(quote?.changes?.["30d"], null),
          "90d": num(quote?.changes?.["90d"], null),
          volume7d: num(quote?.changes?.volume7d, null),
          volume30d: num(quote?.changes?.volume30d, null)
        }
      };
    })
    .filter((stock) => stock.price != null)
    .sort((a, b) => b.score - a.score);

  writeJson(outputPath, {
    source: "market-data",
    updatedAt: new Date().toISOString(),
    marketUpdatedAt: marketData.updatedAt || null,
    stocks
  });

  console.log(JSON.stringify({ stocks: stocks.length, updatedAt: new Date().toISOString() }));
}

main();
