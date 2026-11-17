const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { configuration } = require('../qa/config.cjs');
const { freePort } = require('../qa/environment.cjs');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '.runtime', 'qa-repeat', `${Date.now()}-${randomUUID().slice(0, 8)}`);
const scope = process.argv[2] || 'all';
if (!['all', 'backend', 'browser'].includes(scope)) throw new Error('Use all|backend|browser');
fs.mkdirSync(out, { recursive: true });
const runs = [];
async function run(name, args, env) {
  const fd = fs.openSync(path.join(out, `${name}.log`), 'w');
  const started = Date.now();
  try {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, { cwd: root, env, windowsHide: true, stdio: ['ignore', fd, fd] });
      child.once('error', reject); child.once('close', resolve);
    });
    const result = { name, code, durationMs: Date.now() - started }; runs.push(result);
    console.log(`${name}: exit ${code}`);
    if (code !== 0) throw new Error(`${name} failed; see ${out}`);
    return result;
  } finally { fs.closeSync(fd); }
}
(async () => {
  try {
    if (scope !== 'browser') for (let i = 1; i <= 2; i++) {
      const json = path.join(out, `backend-${i}.json`);
      const result = await run(`backend-${i}`, ['server/node_modules/jest/bin/jest.js', '--config', 'server/jest.config.js', '--runInBand', '--json', `--outputFile=${json}`],
        { ...process.env, NODE_ENV: 'test', QA_RUN_ID: '' });
      const data = JSON.parse(fs.readFileSync(json, 'utf8'));
      Object.assign(result, { passed: data.numPassedTests, failed: data.numFailedTests, suites: data.numTotalTestSuites });
    }
    if (scope !== 'backend') for (let i = 1; i <= 2; i++) {
      const env = { ...process.env, QA_RUN_ID: `repeat_${randomUUID().replaceAll('-', '')}`, QA_PW_JSON: path.join(out, `browser-${i}.json`) };
      const result = await run(`browser-${i}`, ['tests/node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/playwright.config.ts'], env);
      const config = configuration(env); const data = JSON.parse(fs.readFileSync(env.QA_PW_JSON, 'utf8'));
      const manifest = JSON.parse(fs.readFileSync(config.manifest, 'utf8'));
      if (manifest.status !== 'stopped' || manifest.accounts || manifest.token) throw new Error('Environment cleanup incomplete');
      await freePort(config.apiPort); await freePort(config.uiPort);
      const cleanup = JSON.parse(fs.readFileSync(path.join(config.runtime, 'cleanup-summary.json'), 'utf8'));
      Object.assign(result, { passed: data.stats.expected, failed: data.stats.unexpected, skipped: data.stats.skipped,
        runId: config.runId, database: cleanup.databaseName, cleanup: manifest.status, portsReleased: true, resets: cleanup.resets });
    }
  } finally {
    fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ scope, runs }, null, 2));
    console.log(`Evidence: ${out}`);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
