const fs = require("fs");
const path = require("path");
const { rebuildAllThemeMetrics } = require("../api/market-data.js");

function main() {
  const inputPath = path.resolve(
    __dirname,
    "..",
    process.env.MARKET_DATA_INPUT_PATH || path.join("data", "market-data.json")
  );
  const outputPath = path.resolve(
    __dirname,
    "..",
    process.env.MARKET_DATA_OUTPUT_PATH || path.join("data", "market-data.json")
  );
  const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const themes = rebuildAllThemeMetrics(payload.instrumentQuotes || {}, payload.macro || {}, {});
  const next = {
    ...payload,
    themes,
    themeMetricsLogic: "weighted stocks (ETF×0.35) + breadth/volume confirm + overheat penalty; rebuilt from instrumentQuotes",
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ themes: themes.length, outputPath, updatedAt: next.updatedAt }));
}

main();