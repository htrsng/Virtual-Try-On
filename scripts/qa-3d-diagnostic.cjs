// Negative visual control: success means a real wrong-model pixel mismatch was detected.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.runtime', 'qa3d-diagnostic');
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const report = path.join(output, 'report.json');
  for (const file of [report, path.join(output, 'summary.json')]) if (fs.existsSync(file)) fs.unlinkSync(file);
  const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--project=3d-visual', '--grep', '@diagnostic', '--output', path.join(output, 'test-results')],
    { cwd: path.join(root, 'tests'), windowsHide: true, stdio: 'inherit', env: { ...process.env,
      CI_REPORT_DIR: '', QA_3D_VISUAL: '1', QA_3D_DIAGNOSTIC: '1', QA_PW_JSON: report } });
  const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  if (!fs.existsSync(report)) throw new Error('Diagnostic report missing');
  const data = JSON.parse(fs.readFileSync(report, 'utf8')); const results = [];
  const visit = suite => {
    for (const spec of suite.specs || []) for (const test of spec.tests) results.push(...test.results);
    for (const nested of suite.suites || []) visit(nested);
  };
  for (const suite of data.suites) visit(suite);
  const failed = results[0];
  const diffs = failed?.attachments?.filter(a => /diff/i.test(a.name) && a.path && fs.existsSync(a.path)) || [];
  const message = failed?.error?.message || '';
  if (exit !== 1 || results.length !== 1 || failed.status !== 'failed' || !/toMatchSnapshot/.test(message) || !/pixel/i.test(message) || diffs.length !== 1)
    throw new Error('Expected a single wrong-model pixel mismatch with a diff image; other failures are not accepted');
  const trace = failed.attachments.find(a => a.name === 'trace' && a.path && fs.existsSync(a.path));
  if (!trace) throw new Error('Expected diagnostic trace missing');
  const summary = { expectedFault: 'HTTP200 shirt URL replaced by valid trousers GLB', testExit: exit,
    oracle: 'pixel mismatch confirmed; no update-snapshots', diff: path.relative(root, diffs[0].path),
    trace: path.relative(root, trace.path), verdict: 'detector verified' };
  fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
