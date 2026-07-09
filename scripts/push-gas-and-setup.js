const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function resolveWebhookUrl() {
  if (process.env.WEBHOOK_URL || process.env.INTEGRATED_RANKING_WEBHOOK_URL) {
    return process.env.WEBHOOK_URL || process.env.INTEGRATED_RANKING_WEBHOOK_URL;
  }
  const configCandidates = [
    path.resolve(__dirname, "..", "..", ".gemini", "kabukazidou", "config.json"),
    path.resolve("D:", "kabukazidou", "config.json")
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

const WEBHOOK_URL = resolveWebhookUrl();

const TARGET_SHEET = process.env.INTEGRATED_RANKING_TARGET_SHEET || "統合ランキング";

async function postJson(payload) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

async function main() {
  if (!WEBHOOK_URL) throw new Error("WEBHOOK_URL is required");

  const columnResult = await postJson({
    action: "ensure_comparison_columns",
    target_sheet: TARGET_SHEET
  });

  const sync = spawnSync(process.execPath, [path.join(__dirname, "sync-integrated-ranking-sheet.js")], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, WEBHOOK_URL },
    encoding: "utf8"
  });

  console.log(JSON.stringify({
    webhookUrl: WEBHOOK_URL,
    targetSheet: TARGET_SHEET,
    columnResult,
    syncExitCode: sync.status,
    syncStdout: sync.stdout?.trim() || "",
    syncStderr: sync.stderr?.trim() || ""
  }, null, 2));

  if (sync.status !== 0) process.exit(sync.status || 1);
  if (!columnResult.text.startsWith("columns_added:")) {
    console.error("GAS update required: deploy C:\\Users\\p27df\\mysite\\fund-flow-ai\\GAS.txt then rerun this script.");
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});