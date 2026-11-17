// Run against a clean checkout. Logs stay local; no development .env is read.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const out = path.join(root, '.runtime', `baseline-${Date.now()}`);
fs.mkdirSync(out, { recursive: true });
const env = { ...process.env, NODE_ENV: 'test', MONGODB_URI: '',
  JWT_SECRET: 'baseline-only-not-a-deployed-secret', GEMINI_API_KEY: '',
  EMAIL_USER: '', EMAIL_PASS: '' };
const results = [];
async function run(name, directory, executable, args) {
  const log = fs.openSync(path.join(out, `${name}.log`), 'w');
  const started = new Date().toISOString();
  const code = await new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(root, directory, executable), ...args],
      { cwd: path.join(root, directory), env, stdio: ['ignore', log, log] });
    child.on('error', error => { fs.writeSync(log, error.message); resolve(-1); });
    child.on('close', code => resolve(code));
  });
  fs.closeSync(log);
  results.push({ name, started, code });
  console.log(`${name}: exit ${code}`);
}
(async () => {
  await run('build', 'client', 'node_modules/typescript/bin/tsc', ['-b']);
  // The existing build stops at tsc if it fails; do not claim Vite bundle passed.
  if (results[0].code === 0) await run('bundle', 'client', 'node_modules/vite/bin/vite.js', ['build']);
  await run('lint', 'client', 'node_modules/eslint/bin/eslint.js', ['.', '--format', 'json']);
  await run('unit', 'client', 'node_modules/vitest/vitest.mjs', ['run']);
  await run('backend', 'server', 'node_modules/jest/bin/jest.js', ['--runInBand']);
  await run('browser-inventory', 'tests', 'node_modules/@playwright/test/cli.js', ['test', '--list']);
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ root, node: process.version, results }, null, 2));
  console.log(`Logs: ${out}`);
  process.exitCode = results.some(result => result.code !== 0) ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
