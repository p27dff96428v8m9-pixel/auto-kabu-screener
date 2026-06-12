const fs = require("fs");
const path = require("path");
const { buildMarketData } = require("../api/market-data.js");

async function main() {
  const data = await buildMarketData();
  const outputPath = path.resolve(process.cwd(), process.env.MARKET_DATA_OUTPUT_PATH || path.join("data", "market-data.json"));
  const outputDir = path.dirname(outputPath);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    source: data.source,
    themes: data.themes.length,
    priorityRankingRefresh: data.priorityRankingRefresh || false,
    macro: {
      fx: Object.keys(data.macro?.alpha?.fx || {}).length,
      commodities: Object.keys(data.macro?.alpha?.commodities || {}).length,
      errors: data.macro?.alpha?.errors?.length || 0
    },
    instrumentQuotes: Object.keys(data.instrumentQuotes || {}).length,
    instrumentQuoteBatch: data.instrumentQuoteBatch || null,
    updatedAt: data.updatedAt,
    message: data.message || ""
  }));

  if (!data.themes.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
