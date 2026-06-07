const http = require('http');
const fs = require('fs');
const path = require('path');
const marketDataHandler = require('./api/market-data');
const { rebuildAllThemeMetrics } = require('./api/market-data');
const { execFile } = require('child_process');

const root = __dirname;
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
    return handleRecomputeThemes(res);
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

function handleRecomputeThemes(res) {
  try {
    const dataPath = path.join(root, 'data', 'market-data.json');
    const payload = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const themes = rebuildAllThemeMetrics(payload.instrumentQuotes || {}, payload.macro || {}, {});
    payload.themes = themes;
    payload.themeMetricsLogic = 'weighted stocks (ETF×0.35) + breadth/volume confirm + overheat penalty';
    payload.updatedAt = new Date().toISOString();
    fs.writeFileSync(dataPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    const treasureScript = path.join(root, 'scripts', 'update-treasure-stocks.js');
    if (fs.existsSync(treasureScript)) {
      execFile(process.execPath, [treasureScript], { cwd: root }, () => {});
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, themes: themes.length, updatedAt: payload.updatedAt }));
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
