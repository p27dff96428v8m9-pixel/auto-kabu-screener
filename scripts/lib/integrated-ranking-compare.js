const fs = require("fs");
const path = require("path");

const DEFAULT_HISTORY_PATH = path.join("docs", "fund-flow-ai-system", "data", "integrated-ranking-history.json");
const MAX_SNAPSHOT_DAYS = Number(process.env.INTEGRATED_RANKING_HISTORY_DAYS || 90);

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

function normalizeCode(value) {
  const text = String(value || "").replace(/\u200b/g, "").trim();
  if (text.slice(-2) === ".0") return text.slice(0, -2);
  return text;
}

function toDateKey(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function round(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function isIndexLinked(stock) {
  return /ETF|投信|連動|REIT|リート/i.test(`${stock.type || ""} ${stock.name || ""}`);
}

function selectSheetStocks(stocks, limit = 10, includeEtf = false) {
  const picked = [];
  for (const stock of stocks) {
    if (picked.length >= limit) break;
    if (!includeEtf && isIndexLinked(stock)) continue;
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

function snapshotEntry(stock, rank) {
  return {
    code: normalizeCode(stock.code),
    name: stock.name || "",
    rank,
    score: round(stock.score),
    price: round(stock.price),
    buy: round(stock.buy),
    tp: round(stock.tp),
    sl: round(stock.sl),
    signal: stock.signal || ""
  };
}

function buildSnapshot(stocks, limit = 10, includeEtf = false) {
  const picked = selectSheetStocks(stocks, limit, includeEtf);
  const byCode = {};
  picked.forEach((stock, index) => {
    const entry = snapshotEntry(stock, index + 1);
    byCode[entry.code] = entry;
  });
  return {
    savedAt: new Date().toISOString(),
    stocks: byCode,
    order: picked.map((stock) => normalizeCode(stock.code))
  };
}

function sortedSnapshotDates(snapshots = {}) {
  return Object.keys(snapshots).filter((date) => snapshots[date]?.stocks).sort();
}

function resolveHistoryPath(customPath) {
  if (customPath) {
    return path.isAbsolute(customPath) ? customPath : path.resolve(process.cwd(), customPath);
  }
  return path.resolve(process.cwd(), process.env.INTEGRATED_RANKING_HISTORY_PATH || DEFAULT_HISTORY_PATH);
}

function trimSnapshots(snapshots) {
  const dates = sortedSnapshotDates(snapshots);
  if (dates.length <= MAX_SNAPSHOT_DAYS) return snapshots;
  const keep = new Set(dates.slice(-MAX_SNAPSHOT_DAYS));
  const trimmed = {};
  dates.forEach((date) => {
    if (keep.has(date)) trimmed[date] = snapshots[date];
  });
  return trimmed;
}

function updateIntegratedRankingHistory({
  ranking,
  historyPath,
  limit = 10,
  includeEtf = false
} = {}) {
  const resolvedPath = resolveHistoryPath(historyPath);
  const previous = readJson(resolvedPath, { snapshots: {} });
  const dateKey = toDateKey(ranking?.updatedAt);
  const snapshot = buildSnapshot(ranking?.stocks || [], limit, includeEtf);
  const snapshots = trimSnapshots({
    ...(previous.snapshots || {}),
    [dateKey]: snapshot
  });
  const payload = {
    source: "github-actions",
    updatedAt: new Date().toISOString(),
    rankingUpdatedAt: ranking?.updatedAt || null,
    limit,
    includeEtf,
    snapshots
  };
  writeJson(resolvedPath, payload);
  return { path: resolvedPath, payload, dateKey };
}

function formatSignedDelta(current, previous) {
  const cur = Number(current);
  const prev = Number(previous);
  if (!Number.isFinite(cur)) return "-";
  if (!Number.isFinite(prev)) return String(cur);
  if (cur === prev) return `${cur} (±0)`;
  const diff = cur - prev;
  const sign = diff > 0 ? "+" : "";
  return `${prev}→${cur} (${sign}${diff})`;
}

function rankMoveLabel(previousRank, currentRank) {
  if (!Number.isFinite(previousRank)) {
    return { label: "新規", className: "new", title: "前日ランキング外", diff: null };
  }
  const diff = previousRank - currentRank;
  if (diff > 0) {
    return {
      label: `↑${diff}`,
      className: "up",
      title: `前日${previousRank}位→当日${currentRank}位`,
      diff
    };
  }
  if (diff < 0) {
    const abs = Math.abs(diff);
    return {
      label: `↓${abs}`,
      className: "down",
      title: `前日${previousRank}位→当日${currentRank}位`,
      diff
    };
  }
  return {
    label: "→",
    className: "flat",
    title: `前日${previousRank}位から変化なし`,
    diff: 0
  };
}

function compareStock({
  stock,
  rank,
  snapshots,
  todayDate,
  yesterdayDate,
  dayBeforeDate
} = {}) {
  const code = normalizeCode(stock.code);
  const today = snapshots[todayDate]?.stocks?.[code] || null;
  const yesterday = yesterdayDate ? snapshots[yesterdayDate]?.stocks?.[code] || null : null;
  const dayBefore = dayBeforeDate ? snapshots[dayBeforeDate]?.stocks?.[code] || null : null;
  const currentRank = rank;
  const prevRank = yesterday?.rank ?? null;
  const prev2Rank = dayBefore?.rank ?? null;
  const moveVsYesterday = rankMoveLabel(prevRank, currentRank);
  const moveVsDayBefore = rankMoveLabel(prev2Rank, currentRank);
  const tpChange = formatSignedDelta(stock.tp ?? today?.tp, yesterday?.tp);
  const slChange = formatSignedDelta(stock.sl ?? today?.sl, yesterday?.sl);
  const buyChange = formatSignedDelta(stock.buy ?? today?.buy, yesterday?.buy);
  const tpChanged = Number.isFinite(Number(yesterday?.tp)) && Number(yesterday?.tp) !== Number(stock.tp ?? today?.tp);
  const slChanged = Number.isFinite(Number(yesterday?.sl)) && Number(yesterday?.sl) !== Number(stock.sl ?? today?.sl);
  const comparisonText = [
    moveVsYesterday.label === "新規" ? "🆕ランキング新規" : `順位 ${moveVsYesterday.label}`,
    prevRank != null ? `前日${prevRank}位` : null,
    prev2Rank != null ? `前々日${prev2Rank}位` : null,
    tpChanged ? `利確 ${tpChange}` : null,
    slChanged ? `損切 ${slChange}` : null
  ].filter(Boolean).join(" / ");

  return {
    code,
    rank: currentRank,
    prev_rank: prevRank,
    prev2_rank: prev2Rank,
    rank_change: moveVsYesterday.label,
    rank_change_class: moveVsYesterday.className,
    rank_change_title: moveVsYesterday.title,
    rank_change_vs_prev2: moveVsDayBefore.label,
    tp_change: tpChange,
    sl_change: slChange,
    buy_change: buyChange,
    tp_changed: tpChanged,
    sl_changed: slChanged,
    is_new: moveVsYesterday.label === "新規",
    comparison_text: comparisonText
  };
}

function buildComparisons(ranking, historyPayload, { limit = 10, includeEtf = false } = {}) {
  const snapshots = historyPayload?.snapshots || {};
  const dates = sortedSnapshotDates(snapshots);
  const todayDate = toDateKey(ranking?.updatedAt);
  const effectiveTodayDate = snapshots[todayDate] ? todayDate : dates[dates.length - 1] || todayDate;
  const priorDates = dates.filter((date) => date < effectiveTodayDate);
  const yesterdayDate = priorDates[priorDates.length - 1] || null;
  const dayBeforeDate = priorDates.length >= 2 ? priorDates[priorDates.length - 2] : null;
  const stocks = selectSheetStocks(ranking?.stocks || [], limit, includeEtf);

  return {
    todayDate: effectiveTodayDate,
    yesterdayDate,
    dayBeforeDate,
    items: stocks.map((stock, index) =>
      compareStock({
        stock,
        rank: index + 1,
        snapshots,
        todayDate: effectiveTodayDate,
        yesterdayDate,
        dayBeforeDate
      })
    )
  };
}

function buildComparisonSummary(comparisons) {
  const items = comparisons?.items || [];
  const added = items.filter((item) => item.is_new);
  const rankUps = items.filter((item) => item.rank_change_class === "up");
  const rankDowns = items.filter((item) => item.rank_change_class === "down");
  const tpChanged = items.filter((item) => item.tp_changed);
  const slChanged = items.filter((item) => item.sl_changed);

  const lines = [
    `📊 日次比較 (${comparisons.todayDate || "-"})`,
    comparisons.yesterdayDate ? `前日: ${comparisons.yesterdayDate}` : "前日: 記録なし",
    comparisons.dayBeforeDate ? `前々日: ${comparisons.dayBeforeDate}` : null,
    `新規 ${added.length}件`,
    `ランクアップ ${rankUps.length}件 / ダウン ${rankDowns.length}件`,
    `利確変化 ${tpChanged.length}件 / 損切変化 ${slChanged.length}件`
  ].filter(Boolean);

  const detailLines = [];
  if (added.length) {
    detailLines.push(`🆕新規: ${added.map((item) => `${item.code}(${item.rank}位)`).join(", ")}`);
  }
  if (rankUps.length) {
    detailLines.push(`↑: ${rankUps.map((item) => `${item.code}${item.rank_change}`).join(", ")}`);
  }
  if (rankDowns.length) {
    detailLines.push(`↓: ${rankDowns.map((item) => `${item.code}${item.rank_change}`).join(", ")}`);
  }
  if (tpChanged.length) {
    detailLines.push(`利確変化: ${tpChanged.map((item) => `${item.code} ${item.tp_change}`).join(" / ")}`);
  }
  if (slChanged.length) {
    detailLines.push(`損切変化: ${slChanged.map((item) => `${item.code} ${item.sl_change}`).join(" / ")}`);
  }

  return {
    headline: lines.join(" | "),
    details: detailLines.join("\n"),
    counts: {
      added: added.length,
      rankUps: rankUps.length,
      rankDowns: rankDowns.length,
      tpChanged: tpChanged.length,
      slChanged: slChanged.length
    }
  };
}

module.exports = {
  buildComparisonSummary,
  buildComparisons,
  buildSnapshot,
  compareStock,
  formatSignedDelta,
  rankMoveLabel,
  readJson,
  resolveHistoryPath,
  selectSheetStocks,
  sortedSnapshotDates,
  toDateKey,
  updateIntegratedRankingHistory,
  writeJson
};