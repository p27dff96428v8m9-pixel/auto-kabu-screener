// ローカル単独運転モード — GitHubに一切依存せず、このPCだけでシステム全体を回す非常用ランナー。
//
// GitHub Actions が担っている実行係の仕事（20分毎のデータ更新→ランキング→到達判定→LINE通知、
// 夜の全市場スキャン、21時の前夜ダイジェスト、月初の月次答え合わせ）を、このスクリプト1本で
// ローカル再現する。GitHubが障害・有料化・サービス終了になっても、これを起動すれば運用は続く。
//
// 使い方: リポジトリ直下の「ローカル単独運転.bat」をダブルクリック（このスクリプトを起動する）。
//         止めるときはウィンドウを閉じる（Ctrl+C）。
//
// ⚠️ 重要: GitHub Actions が生きている通常時に起動するとLINE通知が二重になる。
//          GitHubが止まっている（または使うのをやめた）ときだけ使うこと。
//
// 認証情報はリポジトリ直下の .env から読む（GitHub Secretsのローカル版）:
//   JQUANTS_REFRESH_TOKEN … J-Quants APIキー（必須）
//   LINE_ACCESS_TOKEN / LINE_USER_ID … LINE通知（無ければ通知スキップで動作は継続）
//   OBS_PRICE_SOURCE=tachibana + TACHIBANA_USER_ID / TACHIBANA_PASSWORD
//     … 立花証券リアルタイム価格（無ければYahoo遅延価格で判定＝GitHub運転と同じ既定）
//   FUND_FLOW_GEMINI_API_KEY … AIテーマリサーチ（無ければスキップ）

const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join("docs", "fund-flow-ai-system", "data");
const stateFile = path.join(repoRoot, "data-cache", "local-runner-state.json");
const CYCLE_MINUTES = 20;

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

function jstNow() {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  return {
    dateKey: jst.toISOString().slice(0, 10),
    hour: jst.getUTCHours(),
    minute: jst.getUTCMinutes(),
    day: jst.getUTCDay()
  };
}

function readState() {
  try { return JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch { return {}; }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state));
}

function stamp() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(11, 19) + " JST";
}

// 1ステップ実行。失敗してもランナー全体は止めない（GitHub Actionsのcontinue-on-error相当）。
async function runStep(name, script, extraEnv = {}, { optional = false } = {}) {
  try {
    const { stdout, stderr } = await execFileAsync("node", [path.join("scripts", script)], {
      cwd: repoRoot,
      env: { ...process.env, ...extraEnv },
      maxBuffer: 32 * 1024 * 1024,
      timeout: 10 * 60 * 1000
    });
    const summary = String(stdout || "").trim().split("\n").slice(-2).join(" / ");
    console.log(`  ✅ ${name}${summary ? `: ${summary.slice(0, 220)}` : ""}`);
    if (stderr && String(stderr).trim()) console.log(`     (stderr: ${String(stderr).trim().slice(0, 160)})`);
    return true;
  } catch (e) {
    const msg = (e && (e.stderr || e.message)) || e;
    console.log(`  ${optional ? "⏭" : "❌"} ${name} 失敗${optional ? "（任意ステップのため続行）" : ""}: ${String(msg).slice(0, 220)}`);
    return false;
  }
}

// GitHub Actions の update-market-data.yml と同じパイプラインを1周ぶん実行
async function runCycle() {
  console.log(`\n===== 更新サイクル開始 ${stamp()} =====`);
  await runStep("市場データ更新", "update-market-data.js", {
    JQUANTS_PLAN: "light",
    JQUANTS_HISTORY_DAYS: "1825",
    JQUANTS_MAX_REQUESTS_PER_RUN: "18",
    JQUANTS_INSTRUMENT_QUOTE_REQUESTS_PER_RUN: "36",
    JQUANTS_ENABLE_FINANCIALS: "1",
    JQUANTS_FINANCIALS_PER_RUN: "12",
    MARKET_DATA_OUTPUT_PATH: path.join(dataDir, "market-data.json")
  });
  await runStep("AIテーマリサーチ", "update-ai-research.js", {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.FUND_FLOW_GEMINI_API_KEY || "",
    GEMINI_MODEL: "gemini-2.5-flash",
    MARKET_DATA_INPUT_PATH: path.join(dataDir, "market-data.json"),
    AI_RESEARCH_OUTPUT_PATH: path.join(dataDir, "ai-research.json")
  }, { optional: true });
  await runStep("ランキング履歴", "update-ranking-history.js", {
    MARKET_DATA_INPUT_PATH: path.join(dataDir, "market-data.json"),
    RANKING_HISTORY_OUTPUT_PATH: path.join(dataDir, "ranking-history.json")
  }, { optional: true });
  await runStep("統合ランキング", "update-treasure-stocks.js", {
    MARKET_DATA_INPUT_PATH: path.join(dataDir, "market-data.json"),
    TREASURE_STOCKS_OUTPUT_PATH: path.join(dataDir, "treasure-stocks.json")
  });
  await runStep("統合ランキング履歴", "update-integrated-ranking-history.js", {
    TREASURE_STOCKS_INPUT_PATH: path.join(dataDir, "treasure-stocks.json"),
    INTEGRATED_RANKING_HISTORY_PATH: path.join(dataDir, "integrated-ranking-history.json"),
    INTEGRATED_RANKING_LIMIT: "10",
    INTEGRATED_RANKING_INCLUDE_ETF: "0"
  }, { optional: true });
  await runStep("観測スペース更新（到達判定・LINE通知）", "update-integrated-obs.js", {
    TREASURE_STOCKS_INPUT_PATH: path.join(dataDir, "treasure-stocks.json"),
    INTEGRATED_OBS_PATH: path.join(dataDir, "integrated-obs.json")
    // LINE_* / OBS_PRICE_SOURCE / TACHIBANA_* は .env から process.env 経由で引き継がれる
  });

  // 全市場スキャン: 平日19:40以降の最初のサイクルで1日1回（GitHubの market-discovery.yml 相当）
  const jst = jstNow();
  const state = readState();
  const isWeekday = jst.day >= 1 && jst.day <= 5;
  const after1940 = jst.hour > 19 || (jst.hour === 19 && jst.minute >= 40);
  if (isWeekday && after1940 && state.discoveryDate !== jst.dateKey) {
    console.log("  （1日1回の全市場スキャンを実行します。数分かかります…）");
    const ok = await runStep("全市場スキャン", "scan-market-universe.js", {
      MARKET_DATA_INPUT_PATH: path.join(dataDir, "market-data.json"),
      DISCOVERY_OUTPUT_PATH: path.join(dataDir, "market-discovery.json")
    }, { optional: true });
    if (ok) writeState({ ...state, discoveryDate: jst.dateKey });
  }
  console.log(`===== サイクル完了 ${stamp()}（次回は約${CYCLE_MINUTES}分後） =====`);
}

// ローカル観測スペース(personal-server)が起動していなければ起動する
async function ensureLocalServer() {
  const alive = await new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port: 8790, path: "/", timeout: 1500 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
  if (alive) {
    console.log("ローカル観測スペースは起動済み: http://127.0.0.1:8790/");
    return;
  }
  const server = spawn("node", [path.join("docs", "fund-flow-ai-system", "personal-server.js")], {
    cwd: repoRoot,
    stdio: ["ignore", "inherit", "inherit"]
  });
  server.on("error", (e) => console.log(`ローカルサーバー起動失敗: ${e.message}`));
  console.log("ローカル観測スペースを起動しました（このウィンドウを閉じると一緒に止まります）");
}

async function main() {
  loadDotEnv();
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  ローカル単独運転モード（GitHub非依存の非常運転）     ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`LINE通知: ${process.env.LINE_ACCESS_TOKEN && process.env.LINE_USER_ID ? "有効" : "未設定（.envにLINE_ACCESS_TOKEN/LINE_USER_IDを書くと有効化）"}`);
  console.log(`判定価格: ${String(process.env.OBS_PRICE_SOURCE || "yahoo")}${process.env.TACHIBANA_USER_ID ? "（立花証券の認証情報あり）" : ""}`);
  console.log(`J-Quants: ${process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN ? "キーあり" : "⚠️ キーなし（.envを確認）"}`);
  await ensureLocalServer();

  if (process.env.LOCAL_RUNNER_ONCE === "1") {
    await runCycle();
    console.log("（LOCAL_RUNNER_ONCE=1 のため1周で終了）");
    process.exit(0);
  }

  // 20分毎に無限ループ（サイクル所要時間ぶんは差し引く）
  for (;;) {
    const started = Date.now();
    try {
      await runCycle();
    } catch (e) {
      console.error(`サイクル異常: ${e && e.message ? e.message : e}`);
    }
    const waitMs = Math.max(30 * 1000, CYCLE_MINUTES * 60 * 1000 - (Date.now() - started));
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
