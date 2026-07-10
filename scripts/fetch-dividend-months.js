// 銘柄別の配当月（権利確定月）を fins/summary から取得して公開データに書き出す。
//
// 権利落ち日の偽押し目対策（update-integrated-obs.js が「配当月の権利落ち日は新規エントリーを
// 見送る」判定に使う）。10年検証で権利落ち日エントリーは勝率25.9%/平均-1.45%と
// 基準(51%/+0.91%)より大幅に悪いことが確認済み（scripts/analyze-ex-dividend.js）。
//
// 期末月 = 直近FY行の CurFYEn の月（DivFY/FDivFY/DivAnn のいずれか>0で配当月とみなす）
// 中間月 = 期末月+6ヶ月（Div2Q/FDiv2Q/NxFDiv2Q のいずれか>0の場合）
// 決算期変更はまれなので更新は年1回で十分（annual-data-harvest.yml に組み込み済み）。
//
// 使い方: node scripts/fetch-dividend-months.js
// 出力: docs/fund-flow-ai-system/data/dividend-months.json

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const JQUANTS_V2_BASE_URL = process.env.JQUANTS_V2_BASE_URL || "https://api.jquants.com/v2";

function loadDotEnv() {
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    if (process.env[m[1]] == null || process.env[m[1]] === "") {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const numeric = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

async function fetchWithRetry(url, headers, tries = 3) {
  for (let i = 0; i < tries; i += 1) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status === 429 && i < tries - 1) {
      await new Promise((r) => setTimeout(r, 8000 * (i + 1))); // レート制限は待って再試行
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error("retry exhausted");
}

async function main() {
  loadDotEnv();
  const marketPath = path.resolve(process.cwd(), process.env.MARKET_DATA_INPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "market-data.json"));
  const outputPath = path.resolve(process.cwd(), process.env.DIVIDEND_MONTHS_OUTPUT_PATH || path.join("docs", "fund-flow-ai-system", "data", "dividend-months.json"));
  const codes = Object.keys(JSON.parse(fs.readFileSync(marketPath, "utf8")).instrumentQuotes || {});
  const key = process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN;
  if (!key) throw new Error("JQUANTS_API_KEY 未設定");

  const months = {};
  for (const code of codes) {
    const norm = /^\d{4}$/.test(code) ? `${code}0` : code;
    try {
      const data = await fetchWithRetry(`${JQUANTS_V2_BASE_URL}/fins/summary?code=${norm}`, { "x-api-key": key });
      const rows = (data.data || []).filter((r) => r.CurPerType === "FY");
      const fy = rows[rows.length - 1];
      const list = [];
      if (fy && fy.CurFYEn) {
        const fyMonth = Number(fy.CurFYEn.slice(5, 7));
        const hasFyDiv = (numeric(fy.DivFY) || 0) > 0 || (numeric(fy.FDivFY) || 0) > 0 || (numeric(fy.DivAnn) || 0) > 0;
        const hasMidDiv = (numeric(fy.Div2Q) || 0) > 0 || (numeric(fy.FDiv2Q) || 0) > 0 || (numeric(fy.NxFDiv2Q) || 0) > 0;
        if (hasFyDiv) list.push(fyMonth);
        if (hasMidDiv) list.push(((fyMonth + 6 - 1) % 12) + 1);
      }
      months[code] = list.sort((a, b) => a - b);
      process.stdout.write(`${code}:${months[code].join("/") || "-"} `);
    } catch (e) {
      console.warn(`\n${code} 取得失敗: ${e.message}（この銘柄はスキップ判定なしで運用）`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log("");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ source: "jquants-fins-summary", updatedAt: new Date().toISOString(), months }, null, 1)}\n`, "utf8");
  console.log(`配当月: ${Object.keys(months).length}/${codes.length}銘柄 → ${outputPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
