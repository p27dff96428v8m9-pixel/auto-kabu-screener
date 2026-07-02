const http = require('http');
const fs = require('fs');
const path = require('path');
const marketDataHandler = require('./api/market-data');
const { rebuildAllThemeMetrics } = require('./api/market-data');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const root = __dirname;
// 共有スクリプト(scripts/)はリポジトリ直下にある。cwd もリポジトリ直下にすると
// 各スクリプトのデフォルトパス(docs/fund-flow-ai-system/data/...)が GitHub Actions と同じに解決される。
const repoRoot = path.resolve(root, '..', '..');
const host = '127.0.0.1';
const preferredPort = Number(process.env.PORT || 8790);
const portFile = path.join(root, 'personal-server.port');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

async function main() {
  for (let port = preferredPort; port < preferredPort + 10; port += 1) {
    const server = http.createServer((req, res) => handleRequest(req, res));
    const ok = await new Promise(resolve => {
      server.once('error', err => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
          return;
        }
        console.error(err);
        resolve(false);
      });
      server.listen(port, host, () => resolve(true));
    });
    if (!ok) continue;

    writePortFile(port);
    console.log(`WorkFlow AI local server: http://${host}:${port}/`);
    return;
  }

  throw new Error('No free port found');
}

function writePortFile(port) {
  try {
    fs.writeFileSync(portFile, String(port), 'utf8');
  } catch (_) {
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${host}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/api/market-data' || pathname === 'api/market-data') {
    await marketDataHandler(makeRequest(req, url), makeResponse(res));
    return;
  }

  if (pathname === '/api/recompute-themes' && req.method === 'POST') {
    return handleRecomputeThemes(res);  // async function なので Promise を返す
  }

  if (pathname === '/api/integrated-obs') {
    const obsPath = path.join(root, 'data', 'integrated-obs.json');
    if (req.method === 'GET') {
      try {
        const raw = fs.readFileSync(obsPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(raw);
      } catch (_) {
        // 空の正規化済み構造を返す（クライアントの normalizeObs と互換）
        const empty = {
          standard: { active: [], closed: [], counts: { "統合買い候補": {tp:0,sl:0}, "監視継続": {tp:0,sl:0}, "確認候補": {tp:0,sl:0}, "見送り": {tp:0,sl:0} } },
          relax: { active: [], closed: [], counts: { "統合買い候補": {tp:0,sl:0}, "監視継続": {tp:0,sl:0}, "確認候補": {tp:0,sl:0}, "見送り": {tp:0,sl:0} } }
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(empty));
      }
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          fs.mkdirSync(path.dirname(obsPath), { recursive: true });
          fs.writeFileSync(obsPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    return serveFile('index.html', res);
  }

  if (pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const relative = pathname.replace(/^\//, '');
  const target = path.resolve(root, relative || 'index.html');
  if (!target.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  serveFile(relative, res);
}

function serveFile(relPath, res) {
  const target = path.resolve(root, relPath);
  const ext = path.extname(target).toLowerCase();
  const type = mimeTypes[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(target);
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  stream.pipe(res);
}

function makeRequest(req, url) {
  return {
    method: req.method,
    url: url.pathname + url.search,
    headers: req.headers
  };
}

async function handleRecomputeThemes(res) {
  try {
    const dataPath = path.join(root, 'data', 'market-data.json');
    const payload = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const themes = rebuildAllThemeMetrics(payload.instrumentQuotes || {}, payload.macro || {}, {});
    payload.themes = themes;
    payload.themeMetricsLogic = 'weighted stocks (ETF×0.35) + breadth/volume confirm + overheat penalty';
    payload.updatedAt = new Date().toISOString();
    fs.writeFileSync(dataPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    // 従来は root/scripts/... を参照していたが実体はリポジトリ直下の scripts/ のため
    // 存在チェックで常にスキップされていた（宝株更新が動いていなかった）。repoRoot に修正。
    const treasureScript = path.join(repoRoot, 'scripts', 'update-treasure-stocks.js');
    if (fs.existsSync(treasureScript)) {
      try {
        // 完了を待ってからレスポンスを返す（クライアントがすぐに loadIntegratedRanking するので重要）
        await execFileAsync(process.execPath, [treasureScript], { cwd: repoRoot });
      } catch (e) {
        console.warn('[recompute] update-treasure-stocks.js failed or had warnings:', e.message || e);
      }
    }

    // 観測スペースも公開側（GitHub Actions）と同一のトラッカーで更新する。
    // 買い目標の日次固定・市場時間内判定・ゆるめ上限(基準価格×0.999)・監視継続の購入除外・
    // 実戦候補順位(candidateRanking) までローカルでも同じロジックになる。LINE未設定なら通知は自動スキップ。
    const obsScript = path.join(repoRoot, 'scripts', 'update-integrated-obs.js');
    if (fs.existsSync(obsScript)) {
      try {
        await execFileAsync(process.execPath, [obsScript], { cwd: repoRoot });
      } catch (e) {
        console.warn('[recompute] update-integrated-obs.js failed or had warnings:', e.message || e);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, themes: themes.length, updatedAt: payload.updatedAt, treasureUpdated: true, obsUpdated: true }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
}

function makeResponse(res) {
  return {
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(value) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(value));
    }
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
