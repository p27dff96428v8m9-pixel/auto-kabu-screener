// 信用残・空売り比率の一括収穫ツール（Standardプラン専用データ）。
//
// J-Quants Standardは月3,300円のため常時契約せず、年1回の契約月に10年分をまとめて取得して
// data-cache に保存する運用（2026-07の方針）。取得後は Light に戻してもローカルの
// キャッシュで研究（予測力の検証・バックテストへの組込み試作）を続けられる。
//
//   markets/margin-interest?code=XXXXX0 … 銘柄別 信用取引週末残高（買い残/売り残、2016年〜）
//   markets/short-ratio?s33=XXXX       … 33業種別 空売り比率（日次）
//
// 使い方: node scripts/fetch-margin-short.js
// 出力: data-cache/margin-interest.json / data-cache/short-ratio.json

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(repoRoot, "data-cache");
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

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "x-api-key": process.env.JQUANTS_API_KEY || process.env.JQUANTS_REFRESH_TOKEN } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function main() {
  loadDotEnv();
  const marketData = JSON.parse(fs.readFileSync(path.join(repoRoot, "docs", "fund-flow-ai-system", "data", "market-data.json"), "utf8"));
  const codes = Object.keys(marketData.instrumentQuotes || {});
  fs.mkdirSync(cacheDir, { recursive: true });

  // 1) 銘柄別 信用残（週次）
  const margin = {};
  for (const code of codes) {
    const norm = /^\d{4}$/.test(code) ? `${code}0` : code;
    try {
      const data = await fetchJson(`${JQUANTS_V2_BASE_URL}/markets/margin-interest?code=${norm}`);
      margin[code] = data.data || [];
      process.stdout.write(`${code}:${margin[code].length} `);
    } catch (e) {
      console.warn(`\n${code} 信用残取得失敗: ${e.message}`);
      margin[code] = [];
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  fs.writeFileSync(path.join(cacheDir, "margin-interest.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), codes: codes.length, data: margin }));
  console.log(`\n信用残: ${codes.length}銘柄 → data-cache/margin-interest.json`);

  // 2) 33業種別 空売り比率（日次）。ユニバースの所属業種ぶんだけ取得
  const sectors = new Set();
  try {
    const master = await fetchJson(`${JQUANTS_V2_BASE_URL}/equities/master`);
    const byCode = new Map((master.data || []).map((r) => [String(r.Code || "").slice(0, 4), r.S33]));
    for (const code of codes) {
      const s33 = byCode.get(code);
      if (s33 && s33 !== "-") sectors.add(String(s33));
    }
  } catch (e) {
    console.warn(`業種マスタ取得失敗: ${e.message}`);
  }
  const shortRatio = {};
  for (const s33 of sectors) {
    try {
      const data = await fetchJson(`${JQUANTS_V2_BASE_URL}/markets/short-ratio?s33=${s33}`);
      shortRatio[s33] = data.data || [];
      process.stdout.write(`${s33}:${shortRatio[s33].length} `);
    } catch (e) {
      console.warn(`\n業種${s33} 空売り比率取得失敗: ${e.message}`);
      shortRatio[s33] = [];
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  fs.writeFileSync(path.join(cacheDir, "short-ratio.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), sectors: [...sectors], data: shortRatio }));
  console.log(`\n空売り比率: ${sectors.size}業種 → data-cache/short-ratio.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
