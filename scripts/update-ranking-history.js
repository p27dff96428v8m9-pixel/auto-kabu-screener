const fs = require("fs");
const path = require("path");

const weights = {
  momentum: 0.25,
  volume: 0.20,
  fundFlow: 0.20,
  breadth: 0.15,
  news: 0.10,
  ai: 0.10,
  crowdedness: -0.10
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

function calculateScore(theme, period) {
  const m = theme.metrics?.[period];
  if (!m) return 0;
  const base =
    m.momentum * weights.momentum +
    m.volume * weights.volume +
    m.fundFlow * weights.fundFlow +
    m.breadth * weights.breadth +
    m.news * weights.news +
    m.ai * weights.ai +
    m.crowdedness * weights.crowdedness;
  return Math.max(0, Math.min(100, Math.round(base)));
}

function snapshotFor(themes, period) {
  const ranked = [...themes]
    .filter((theme) => theme.metrics?.[period])
    .sort((a, b) => calculateScore(b, period) - calculateScore(a, period));

  return {
    savedAt: new Date().toISOString(),
    ranks: Object.fromEntries(ranked.map((theme, index) => [theme.id, index + 1])),
    scores: Object.fromEntries(ranked.map((theme) => [theme.id, calculateScore(theme, period)]))
  };
}

function main() {
  const marketPath = path.resolve(process.cwd(), process.env.MARKET_DATA_INPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "market-data.json"));
  const outputPath = path.resolve(process.cwd(), process.env.RANKING_HISTORY_OUTPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "ranking-history.json"));
  const marketData = readJson(marketPath, { themes: [] });
  const previousFile = readJson(outputPath, {});

  const snapshots = {};
  ["90d", "30d", "7d"].forEach((period) => {
    snapshots[`${period}:all:all:all:show-crowded`] = snapshotFor(marketData.themes || [], period);
  });

  const payload = {
    source: "github-actions",
    updatedAt: new Date().toISOString(),
    marketUpdatedAt: marketData.updatedAt || null,
    previous: previousFile.current || previousFile.snapshots || {},
    current: snapshots
  };

  writeJson(outputPath, payload);
  console.log(JSON.stringify({
    source: payload.source,
    periods: Object.keys(payload.current).length,
    previousPeriods: Object.keys(payload.previous).length
  }));
}

main();
