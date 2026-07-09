const fs = require("fs");
const path = require("path");

function resolveWebhookUrl() {
  if (process.env.INTEGRATED_RANKING_WEBHOOK_URL || process.env.WEBHOOK_URL) {
    return process.env.INTEGRATED_RANKING_WEBHOOK_URL || process.env.WEBHOOK_URL;
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
  const webhookUrl = resolveWebhookUrl();
  const targetSheet = process.env.INTEGRATED_RANKING_TARGET_SHEET || "統合ランキング";
  if (!webhookUrl) {
    throw new Error("WEBHOOK_URL is required");
  }

  let columnResult = "skipped";
  try {
    columnResult = await postJson(webhookUrl, {
      action: "ensure_comparison_columns",
      target_sheet: targetSheet
    });
  } catch (error) {
    columnResult = `failed:${error.message}`;
  }

  const { spawnSync } = require("child_process");
  const sync = spawnSync(process.execPath, [path.join(__dirname, "sync-integrated-ranking-sheet.js")], {
    cwd: path.resolve(__dirname, ".."),
    env: process.env,
    encoding: "utf8"
  });

  if (sync.status !== 0) {
    console.error(sync.stdout || "");
    console.error(sync.stderr || "");
    throw new Error(`sync failed with exit code ${sync.status}`);
  }

  console.log(JSON.stringify({
    webhookUrl,
    targetSheet,
    columnResult,
    syncOutput: sync.stdout.trim()
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});