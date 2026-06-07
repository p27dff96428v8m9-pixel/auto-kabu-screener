const fs = require("fs");
const path = require("path");
const {
  buildComparisonSummary,
  buildComparisons,
  resolveHistoryPath,
  updateIntegratedRankingHistory
} = require("./lib/integrated-ranking-compare");

function resolveInputPath() {
  const candidates = [
    process.env.TREASURE_STOCKS_INPUT_PATH,
    path.join("docs", "fund-flow-ai-system", "data", "treasure-stocks.json"),
    path.join("data", "treasure-stocks.json"),
    path.resolve(__dirname, "..", "docs", "fund-flow-ai-system", "data", "treasure-stocks.json"),
    path.resolve(__dirname, "..", "..", ".gemini", "fund-flow-ai-system", "data", "treasure-stocks.json")
  ].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) return resolved;
  }
  return path.resolve(process.cwd(), "docs", "fund-flow-ai-system", "data", "treasure-stocks.json");
}

function resolveWebhookUrl() {
  if (process.env.INTEGRATED_RANKING_WEBHOOK_URL || process.env.WEBHOOK_URL) {
    return process.env.INTEGRATED_RANKING_WEBHOOK_URL || process.env.WEBHOOK_URL;
  }
  const configCandidates = [
    path.resolve(__dirname, "..", "..", "kabukazidou", "config.json"),
    path.resolve("D:", "kabukazidou", "config.json"),
    path.resolve(__dirname, "..", "..", ".gemini", "kabukazidou", "config.json")
  ];
  for (const configPath of configCandidates) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.webhook_url) return config.webhook_url;
    } catch {
      // ignore
    }
  }
  return "";
}

const INPUT_PATH = resolveInputPath();
const WEBHOOK_URL = resolveWebhookUrl();
const TARGET_SHEET = process.env.INTEGRATED_RANKING_TARGET_SHEET || "統合ランキング";
const LIMIT = Number(process.env.INTEGRATED_RANKING_LIMIT || 10);
const REPLACE_MODE = String(process.env.INTEGRATED_RANKING_REPLACE || "1") !== "0";
const INCLUDE_ETF = String(process.env.INTEGRATED_RANKING_INCLUDE_ETF || "0") === "1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function round(value, fallback = null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n);
}

function isIndexLinked(stock) {
  return /ETF|投信|連動|REIT|リート/i.test(`${stock.type || ""} ${stock.name || ""}`);
}

function signalColor(signal = "") {
  if (/統合買い|買い候補/i.test(signal)) return "green";
  if (/確認候補/i.test(signal)) return "blue";
  if (/監視/i.test(signal)) return "yellow";
  return "orange";
}

function selectSheetStocks(stocks, limit = 10) {
  const picked = [];
  for (const stock of stocks) {
    if (picked.length >= limit) break;
    if (!INCLUDE_ETF && isIndexLinked(stock)) continue;
    picked.push(stock);
  }
  if (picked.length < limit) {
    for (const stock of stocks) {
      if (picked.length >= limit) break;
      if (!picked.some((item) => item.code === stock.code)) picked.push(stock);
    }
  }
  return picked;
}

function buildPayload(stock, index, rankingUpdatedAt, comparison = null) {
  const price = Number(stock.price);
  const buy = round(stock.buy, round(price * 0.99));
  const tp = round(stock.tp, round(price * 1.1));
  const sl = round(stock.sl, round(price * 0.95));
  const rank = index + 1;
  const score = Number(stock.score);
  const changes = stock.changes || {};
  const checks = stock.checks || {};
  const technical = stock.technical || {};
  const actual = checks.earnings?.actual || stock.financial?.latestStatement || null;
  const rankingDate = new Date(rankingUpdatedAt || Date.now()).toISOString().slice(0, 10);
  const summary = [
    `統合ランキング ${rankingDate}`,
    `順位${rank}`,
    `${stock.name}(${stock.code})`,
    Number.isFinite(score) ? `総合 ${score}` : null,
    stock.flowScore != null ? `資金 ${stock.flowScore}` : null,
    stock.treasureScore != null ? `お宝 ${stock.treasureScore}` : null,
    stock.kabuScore != null ? `Kabu ${stock.kabuScore}` : null,
    stock.confirmationScore != null ? `確認 ${stock.confirmationScore}` : null,
    stock.themeFlowBonus ? `テーマ+${stock.themeFlowBonus}` : null,
    stock.overheatPenalty ? `過熱-${stock.overheatPenalty}` : null,
    technical.rsi != null ? `RSI ${technical.rsi}` : null,
    checks.earnings?.label ? `決算 ${checks.earnings.label}` : null,
    actual?.disclosedDate ? `実決算日 ${actual.disclosedDate}` : null,
    actual?.eps != null ? `EPS ${Number(actual.eps).toFixed(2)}` : null,
    actual?.progressBasis != null ? `進捗 ${Number(actual.progressBasis).toFixed(1)}%` : null,
    actual?.progressVsExpectedPct != null ? `期待比 ${Number(actual.progressVsExpectedPct).toFixed(1)}pt` : null,
    checks.material?.label ? `材料 ${checks.material.label}` : null,
    checks.volume?.label ? `出来高 ${checks.volume.label}` : null,
    checks.chart?.label ? `チャート ${checks.chart.label}` : null,
    stock.winRate != null ? `勝率 ${stock.winRate}%` : null,
    stock.rr != null ? `RR ${stock.rr}` : null,
    stock.signal || null,
    `7日 ${changes["7d"] ?? "-"}%`,
    `30日 ${changes["30d"] ?? "-"}%`,
    comparison?.comparison_text || null
  ].filter(Boolean).join(" | ");

  return {
    action: "add_new",
    target_sheet: TARGET_SHEET,
    code: String(stock.code),
    name: stock.name,
    ticker_name: stock.name,
    current_price: Number.isFinite(price) ? price : null,
    buy,
    tp,
    sl,
    volume: 0,
    rank: comparison?.rank ?? index + 1,
    prev_rank: comparison?.prev_rank ?? null,
    prev2_rank: comparison?.prev2_rank ?? null,
    rank_change: comparison?.rank_change ?? null,
    rank_change_class: comparison?.rank_change_class ?? null,
    tp_change: comparison?.tp_change ?? null,
    sl_change: comparison?.sl_change ?? null,
    comparison_text: comparison?.comparison_text ?? null,
    ai_color: signalColor(stock.signal),
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

async function fetchSheetRows() {
  const text = await postJson(WEBHOOK_URL, {
    action: "get_all",
    target_sheet: TARGET_SHEET
  });
  return JSON.parse(text);
}

function codeColumnIndex(headers) {
  return headers.findIndex((header) => /コード/.test(String(header).replace(/\u200b/g, "")));
}

async function clearTargetSheet() {
  const rows = await fetchSheetRows();
  if (!rows.length) return 0;
  const codeIdx = codeColumnIndex(rows[0]);
  if (codeIdx < 0) throw new Error("コード列が見つかりません");
  let deleted = 0;
  for (let i = 1; i < rows.length; i += 1) {
    const code = String(rows[i][codeIdx] || "").replace(/\u200b/g, "").trim();
    if (!code) continue;
    const result = await postJson(WEBHOOK_URL, {
      action: "delete",
      code,
      target_sheet: TARGET_SHEET
    });
    if (result.includes("deleted")) deleted += 1;
  }
  return deleted;
}

async function syncReplace(rows, comparisonNote = "") {
  try {
    const result = await postJson(WEBHOOK_URL, {
      action: "sync_replace",
      target_sheet: TARGET_SHEET,
      rows,
      comparison_note: comparisonNote || undefined
    });
    if (result.startsWith("synced:")) {
      return Number(result.split(":")[1]) || rows.length;
    }
  } catch {
    // fall back to clear + add
  }
  const deleted = await clearTargetSheet();
  const results = [];
  for (let i = 0; i < rows.length; i += 1) {
    const result = await postJson(WEBHOOK_URL, rows[i]);
    results.push({ code: rows[i].code, result });
  }
  return { deleted, added: results.length, results };
}

async function main() {
  if (!WEBHOOK_URL) {
    throw new Error("INTEGRATED_RANKING_WEBHOOK_URL / WEBHOOK_URL / kabukazidou config.json is required");
  }

  const ranking = readJson(INPUT_PATH);
  const stocks = selectSheetStocks(ranking.stocks || [], LIMIT);
  if (!stocks.length) {
    throw new Error(`No stocks found in ${INPUT_PATH}`);
  }

  const historyResult = updateIntegratedRankingHistory({
    ranking,
    historyPath: resolveHistoryPath(),
    limit: LIMIT,
    includeEtf: INCLUDE_ETF
  });
  const comparisons = buildComparisons(ranking, historyResult.payload, {
    limit: LIMIT,
    includeEtf: INCLUDE_ETF
  });
  const comparisonSummary = buildComparisonSummary(comparisons);
  const comparisonByCode = Object.fromEntries(
    comparisons.items.map((item) => [String(item.code), item])
  );

  const rows = stocks.map((stock, index) =>
    buildPayload(stock, index, ranking.updatedAt, comparisonByCode[String(stock.code)] || null)
  );

  const comparisonNote = [comparisonSummary.headline, comparisonSummary.details]
    .filter(Boolean)
    .join("\n");

  let output;
  if (REPLACE_MODE) {
    output = await syncReplace(rows, comparisonNote);
  } else {
    const results = [];
    for (const row of rows) {
      const result = await postJson(WEBHOOK_URL, row);
      results.push({ code: row.code, result });
    }
    output = { added: results.length, results };
  }

  console.log(JSON.stringify({
    inputPath: INPUT_PATH,
    targetSheet: TARGET_SHEET,
    replaceMode: REPLACE_MODE,
    includeEtf: INCLUDE_ETF,
    rankingUpdatedAt: ranking.updatedAt,
    logic: ranking.logic || null,
    codes: stocks.map((stock) => stock.code),
    comparison: {
      todayDate: comparisons.todayDate,
      yesterdayDate: comparisons.yesterdayDate,
      dayBeforeDate: comparisons.dayBeforeDate,
      summary: comparisonSummary.headline,
      counts: comparisonSummary.counts
    },
    historyPath: historyResult.path,
    output
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});