const fs = require("fs");
const path = require("path");

const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MODELS = [GEMINI_MODEL, ...(process.env.GEMINI_FALLBACK_MODELS || "")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean)]
  .filter((model, index, models) => model && models.indexOf(model) === index);
const GEMINI_RETRY_COUNT = Math.max(1, Number(process.env.GEMINI_RETRY_COUNT || 3) || 3);
const GEMINI_RETRY_DELAY_MS = Math.max(0, Number(process.env.GEMINI_RETRY_DELAY_MS || 15000) || 15000);

const THEME_LABELS = {
  "jp-semiconductor": "半導体・製造装置",
  "jp-defense": "防衛・重工",
  "jp-banks": "銀行・金利上昇メリット",
  "jp-electric-power": "電力・原子力再稼働",
  "jp-trading-houses": "総合商社・資源",
  "jp-gold": "金・インフレヘッジ",
  "jp-inbound": "インバウンド・消費",
  "jp-small-growth": "グロース250・中小型成長",
  "jpy-exporters": "円安メリット・輸出株",
  "jp-reits": "J-REIT・利回り資産",
  "jp-auto": "自動車",
  "jp-pharma": "医薬品・ヘルスケア",
  "jp-telecom": "通信・ディフェンシブ",
  "jp-retail": "小売・国内消費",
  "jp-construction": "建設・インフラ",
  "jp-insurance": "保険・金利上昇メリット",
  "jp-chemical": "化学・素材",
  "jp-low-pbr": "低PBR・東証改革"
};

const NEWS_QUERIES = {
  "jp-semiconductor": "日本 半導体 製造装置 株",
  "jp-defense": "日本 防衛 重工 株",
  "jp-banks": "日本 銀行 金利 株",
  "jp-electric-power": "日本 電力 原発 再稼働 株",
  "jp-trading-houses": "総合商社 資源 株",
  "jp-gold": "金価格 インフレヘッジ ETF 日本",
  "jp-inbound": "インバウンド 百貨店 観光 株",
  "jp-small-growth": "東証グロース 中小型株",
  "jpy-exporters": "円安 輸出株 自動車 電機",
  "jp-reits": "J-REIT 利回り 金利 日本",
  "jp-auto": "自動車株 日本 円安 EV",
  "jp-pharma": "医薬品株 日本 ヘルスケア",
  "jp-telecom": "通信株 日本 NTT KDDI",
  "jp-retail": "小売株 日本 消費",
  "jp-construction": "建設株 日本 インフラ",
  "jp-insurance": "保険株 日本 金利",
  "jp-chemical": "化学株 日本 半導体材料",
  "jp-low-pbr": "低PBR 東証改革 株"
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
  const message = error?.message || "";
  return /(^|\D)(429|500|502|503|504)(\D|$)|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(message);
}

function metric(theme, period = "90d") {
  return theme.metrics?.[period] || {};
}

function acceleration(theme, period = "90d") {
  const current = metric(theme, period).fundFlow || 0;
  const base = period === "7d" ? metric(theme, "30d").fundFlow : metric(theme, "90d").fundFlow;
  return Math.round(current - (base || current));
}

function scoreTheme(theme) {
  const m90 = metric(theme, "90d");
  const m30 = metric(theme, "30d");
  const m7 = metric(theme, "7d");
  const fundChange = (m7.fundFlow || 0) - (m90.fundFlow || 0);
  const recentChange = (m7.fundFlow || 0) - (m30.fundFlow || 0);
  const accel = acceleration(theme, "90d");
  const breadth = m90.breadth || 0;
  const crowded = m90.crowdedness || 0;
  return clamp((m90.fundFlow || 0) * 0.38 + breadth * 0.28 + accel * 1.2 + fundChange * 0.7 + recentChange * 1.4 - Math.max(0, crowded - 72) * 1.1);
}

function buildFallbackResearch(marketData, reason = "GEMINI_API_KEY is not configured") {
  const themes = [...(marketData.themes || [])]
    .map((theme) => ({ theme, score: scoreTheme(theme) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    source: "rule-fallback",
    updatedAt: new Date().toISOString(),
    period: "90d",
    model: null,
    message: reason,
    summary: "Gemini未接続のため、株価・出来高から計算した暫定候補です。Gemini APIキー登録後はニュース・金利・為替材料を含めてAI調査に切り替わります。",
    candidates: themes.map(({ theme, score }) => {
      const m90 = metric(theme, "90d");
      const m30 = metric(theme, "30d");
      const m7 = metric(theme, "7d");
      return {
        id: theme.id,
        name: THEME_LABELS[theme.id] || theme.id,
        score,
        decision: score >= 70 ? "優先確認" : score >= 55 ? "候補監視" : "条件待ち",
        reason: `90日の資金量${m90.fundFlow}、7日の資金量${m7.fundFlow}、広がり${m90.breadth}。価格・出来高だけで見る暫定判定です。`,
        evidence: [`資金量 90日:${m90.fundFlow} / 30日:${m30.fundFlow} / 7日:${m7.fundFlow}`, `加速度:${acceleration(theme, "90d")}`, `過熱度:${m90.crowdedness}`],
        nextCheck: "Gemini APIキー登録後、ニュース・金利・為替の材料確認を行う。",
        risk: "ニュース未確認のため、材料の裏取り前提。"
      };
    })
  };
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").trim();
}

async function fetchNewsHeadlines(themeId) {
  const query = NEWS_QUERIES[themeId] || THEME_LABELS[themeId] || themeId;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;
  try {
    const response = await fetch(url, { headers: { "User-Agent": "fund-flow-ai-system/1.0" } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const xml = await response.text();
    return [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>/g)]
      .slice(0, 4)
      .map((match) => ({ title: stripTags(match[1]), publishedAt: match[2] }));
  } catch (error) {
    return [{ title: `ニュース取得失敗: ${error.message}`, publishedAt: "" }];
  }
}

async function buildResearchContext(marketData) {
  const ranked = [...(marketData.themes || [])]
    .map((theme) => ({ theme, score: scoreTheme(theme) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const themes = [];
  for (const { theme, score } of ranked) {
    themes.push({
      id: theme.id,
      name: THEME_LABELS[theme.id] || theme.id,
      score,
      metrics: theme.metrics,
      acceleration90d: acceleration(theme, "90d"),
      news: await fetchNewsHeadlines(theme.id)
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    marketSource: marketData.source,
    marketUpdatedAt: marketData.updatedAt,
    macro: marketData.macro || {},
    themes
  };
}

function extractGeminiText(payload) {
  return payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

async function requestGemini(model, apiKey, prompt) {
  const response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }

  return parseJsonText(extractGeminiText(await response.json()));
}

async function runGemini(context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = [
    "あなたは日本株の資金フロー分析アシスタントです。投資助言ではなく、次に確認すべきテーマ候補を整理してください。",
    "必ず日本語で返してください。Flow Scoreなど英語は使わず、資金量・加速度・広がり・過熱度という語に統一してください。",
    "価格・出来高、ニュース見出し、金利・為替材料を分けて考え、過熱しているテーマは追いかけ買い注意と書いてください。",
    "返答はJSONだけ。schema: {summary:string,candidates:[{id:string,name:string,score:number,decision:string,reason:string,evidence:string[],nextCheck:string,risk:string}]}",
    JSON.stringify(context)
  ].join("\n\n");

  const errors = [];
  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= GEMINI_RETRY_COUNT; attempt += 1) {
      try {
        return {
          model,
          payload: await requestGemini(model, apiKey, prompt)
        };
      } catch (error) {
        errors.push(`${model}#${attempt}:${error.message}`);
        if (!isRetryableGeminiError(error) || attempt === GEMINI_RETRY_COUNT) break;
        await sleep(GEMINI_RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(errors.join(" / "));
}

async function main() {
  const marketPath = path.resolve(process.cwd(), process.env.MARKET_DATA_INPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "market-data.json"));
  const outputPath = path.resolve(process.cwd(), process.env.AI_RESEARCH_OUTPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "ai-research.json"));
  const marketData = readJson(marketPath);

  let payload;
  try {
    const context = await buildResearchContext(marketData);
    const gemini = await runGemini(context);
    payload = {
      source: "gemini",
      updatedAt: new Date().toISOString(),
      period: "90d",
      model: gemini.model,
      marketUpdatedAt: marketData.updatedAt,
      summary: gemini.payload.summary || "",
      candidates: Array.isArray(gemini.payload.candidates) ? gemini.payload.candidates.slice(0, 5) : []
    };
  } catch (error) {
    payload = buildFallbackResearch(marketData, error.message);
  }

  writeJson(outputPath, payload);
  console.log(JSON.stringify({
    source: payload.source,
    model: payload.model,
    candidates: payload.candidates.length,
    message: payload.message || ""
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
