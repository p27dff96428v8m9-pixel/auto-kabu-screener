const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(
  process.cwd(),
  process.env.TREASURE_STOCKS_INPUT_PATH ||
    path.join("docs", "fund-flow-ai-system", "data", "treasure-stocks.json")
);
const WEBHOOK_URL =
  process.env.INTEGRATED_RANKING_WEBHOOK_URL || process.env.WEBHOOK_URL || "";
const TARGET_SHEET = process.env.INTEGRATED_RANKING_TARGET_SHEET || "\u7d71\u5408\u30e9\u30f3\u30ad\u30f3\u30b0";
const LIMIT = Number(process.env.INTEGRATED_RANKING_LIMIT || 10);
const FORCE_APPEND = String(process.env.INTEGRATED_RANKING_FORCE_APPEND || "1") !== "0";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function round(value, fallback = null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n);
}

function buildPayload(stock, index, rankingUpdatedAt) {
  const price = Number(stock.price);
  const buy = round(stock.buy, round(price * 0.99));
  const tp = round(stock.tp, round(price * 1.1));
  const sl = round(stock.sl, round(price * 0.95));
  const rank = index + 1;
  const score = Number(stock.score);
  const changes = stock.changes || {};
  const checks = stock.checks || {};
  const rankingDate = new Date(rankingUpdatedAt || Date.now()).toISOString().slice(0, 10);
  const summary = [
    `\u7d71\u5408\u30e9\u30f3\u30ad\u30f3\u30b0 ${rankingDate}`,
    `\u9806\u4f4d${rank}`,
    `${stock.name}(${stock.code})`,
    Number.isFinite(score) ? `総合 ${score}` : null,
    stock.flowScore != null ? `資金 ${stock.flowScore}` : null,
    stock.kabuScore != null ? `Kabu ${stock.kabuScore}` : null,
    stock.confirmationScore != null ? `確認 ${stock.confirmationScore}` : null,
    checks.earnings?.label ? `決算 ${checks.earnings.label}` : null,
    checks.material?.label ? `材料 ${checks.material.label}` : null,
    checks.volume?.label ? `出来高 ${checks.volume.label}` : null,
    checks.chart?.label ? `チャート ${checks.chart.label}` : null,
    stock.winRate != null ? `勝率 ${stock.winRate}%` : null,
    stock.rr != null ? `RR ${stock.rr}` : null,
    stock.signal || null,
    `7\u65e5 ${changes["7d"] ?? "-"}%`,
    `30\u65e5 ${changes["30d"] ?? "-"}%`
  ].filter(Boolean).join(" | ");

  return {
    action: "add_new",
    target_sheet: TARGET_SHEET,
    force_append: FORCE_APPEND,
    code: String(stock.code),
    name: stock.name,
    ticker_name: stock.name,
    current_price: Number.isFinite(price) ? price : null,
    buy,
    tp,
    sl,
    volume: 0,
    ai_color: "blue",
    ai_text: summary,
    x_post_text: summary,
    hp_text: summary,
    sns_done: false
  };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return text;
}

async function main() {
  if (!WEBHOOK_URL) {
    throw new Error("INTEGRATED_RANKING_WEBHOOK_URL or WEBHOOK_URL is required");
  }

  const ranking = readJson(INPUT_PATH);
  const stocks = (ranking.stocks || []).slice(0, LIMIT);
  if (!stocks.length) {
    throw new Error(`No stocks found in ${INPUT_PATH}`);
  }

  const results = [];
  for (let i = 0; i < stocks.length; i += 1) {
    const payload = buildPayload(stocks[i], i, ranking.updatedAt);
    const result = await postJson(WEBHOOK_URL, payload);
    results.push({ code: payload.code, result });
  }

  console.log(JSON.stringify({
    targetSheet: TARGET_SHEET,
    forceAppend: FORCE_APPEND,
    sent: results.length,
    results
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

