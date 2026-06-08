const fs = require("fs");
const path = require("path");
const {
  readJson,
  resolveHistoryPath,
  updateIntegratedRankingHistory
} = require("./lib/integrated-ranking-compare");

function resolveInputPath() {
  const candidates = [
    process.env.TREASURE_STOCKS_INPUT_PATH,
    path.join("docs", "fund-flow-ai-system", "data", "treasure-stocks.json"),
    path.join("data", "treasure-stocks.json"),
    path.resolve(__dirname, "..", "docs", "fund-flow-ai-system", "data", "treasure-stocks.json")
  ].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) return resolved;
  }
  return path.resolve(process.cwd(), "docs", "fund-flow-ai-system", "data", "treasure-stocks.json");
}

function main() {
  const inputPath = resolveInputPath();
  const ranking = readJson(inputPath, null);
  if (!ranking?.stocks?.length) {
    throw new Error(`No stocks found in ${inputPath}`);
  }

  const limit = Number(process.env.INTEGRATED_RANKING_LIMIT || 10);
  const includeEtf = String(process.env.INTEGRATED_RANKING_INCLUDE_ETF || "0") === "1";
  const result = updateIntegratedRankingHistory({
    ranking,
    historyPath: resolveHistoryPath(),
    limit,
    includeEtf
  });

  console.log(JSON.stringify({
    inputPath,
    historyPath: result.path,
    dateKey: result.dateKey,
    snapshotCount: Object.keys(result.payload.snapshots || {}).length,
    stockCount: Object.keys(result.payload.snapshots?.[result.dateKey]?.stocks || {}).length
  }, null, 2));
}

main();