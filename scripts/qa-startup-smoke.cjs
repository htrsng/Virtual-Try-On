// Isolated startup evidence; does not seed users/orders or touch development DB.
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const { MongoMemoryServer } = require(path.join(root, 'server/node_modules/mongodb-memory-server'));
const out = path.join(root, '.runtime', `startup-${Date.now()}`);
fs.mkdirSync(out, { recursive: true });
const children = [];
const handles = [];
function start(name, directory, args, env) {
  const handle = fs.openSync(path.join(out, `${name}.log`), 'w');
  handles.push(handle);
  const child = spawn(process.execPath, args, { cwd: path.join(root, directory), env,
    stdio: ['ignore', handle, handle] });
  child.on('error', error => fs.writeSync(handle, error.message));
  children.push(child);
  return child;
}
async function ready(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { const response = await fetch(url); if (response.ok) return response; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Readiness failed: ${url}`);
}
(async () => {
  let mongo;
  try {
    // Refuse port reuse: a response must belong to this run.
    const net = require('node:net');
    for (const port of [3300, 55173]) await new Promise((resolve, reject) => {
      const probe = net.createServer(); probe.once('error', reject);
      probe.listen(port, '127.0.0.1', () => probe.close(resolve));
    });
    mongo = await MongoMemoryServer.create();
    const env = { ...process.env, NODE_ENV: 'development', PORT: '3300',
      MONGODB_URI: mongo.getUri('vfitai_baseline'), JWT_SECRET: 'baseline-only-not-a-deployed-secret',
      GEMINI_API_KEY: '', EMAIL_USER: '', EMAIL_PASS: '', VITE_API_URL: 'http://127.0.0.1:3300',
      VITE_API_PROXY_TARGET: 'http://127.0.0.1:3300' };
    start('api', 'server', ['index.js'], env);
    start('ui', 'client', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '55173', '--strictPort'], env);
    const api = await ready('http://127.0.0.1:3300/api/products');
    const body = await api.json();
    const ui = await ready('http://127.0.0.1:55173');
    const html = await ui.text();
    if (!html.includes('id="root"')) throw new Error('Missing React root');
    const proxy = await ready('http://127.0.0.1:55173/api/products');
    if (!Array.isArray(await proxy.json())) throw new Error('Unexpected proxied product response');
    const config = path.join(out, 'playwright.config.cjs');
    fs.writeFileSync(config, `module.exports = ${JSON.stringify({ testDir: path.join(root, 'tests/e2e'), workers: 1, retries: 0,
      reporter: 'line', outputDir: path.join(out, 'test-results'), use: { baseURL: 'http://127.0.0.1:55173', browserName: 'chromium' } })};`);
    const browser = start('playwright', 'tests', ['node_modules/@playwright/test/cli.js', 'test', '--config', config], env);
    const browserExit = await new Promise(resolve => browser.on('close', resolve));
    const summary = { apiStatus: api.status, apiBodyType: Array.isArray(body) ? 'array' : typeof body,
      uiStatus: ui.status, proxyStatus: proxy.status, reactRoot: true, browserExit, ports: [3300, 55173], database: 'disposable MongoMemoryServer' };
    fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary));
    process.exitCode = browserExit === 0 ? 0 : 1;
  } finally {
    await Promise.all(children.map(child => new Promise(resolve => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      child.once('close', resolve); child.kill();
    })));
    if (mongo) await mongo.stop();
    handles.forEach(handle => fs.closeSync(handle));
    console.log(`Logs: ${out}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
