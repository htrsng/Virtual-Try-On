// Enumerate real native results; do not count browser repeats or diagnostic probes.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const reports = path.join(root, '.runtime/ci');
const rows = [];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const slash = file => file.replaceAll('\\', '/');
const basename = file => slash(file).split('/').pop();
function add(layer, module, name, source, status) {
  const ordinal = rows.filter(row => row.Layer === layer && row.Source === source && row.Name === name).length;
  const id = createHash('sha256').update(`${layer}|${source}|${name}|${ordinal}`).digest('hex').slice(0, 10).toUpperCase();
  rows.push({ ID: `${layer}-${id}`, Layer: layer, Module: module, Name: name, Source: source, Status: status });
}
for (const [layer, suite, file] of [['API', 'backend', 'backend.json'], ['DOM', 'frontend', 'frontend.json']]) {
  for (const result of read(path.join(reports, suite, file)).testResults) {
    const anchor = layer === 'API' ? '/server/tests/' : '/client/src/';
    const source = anchor.slice(1) + slash(result.name).split(anchor).pop();
    for (const test of result.assertionResults) add(layer, basename(result.name).replace(/\.test\.[^.]+$/, ''), test.fullName, source,
      test.status === 'passed' ? 'Passed local' : test.status);
  }
}
const decode = value => value.replace(/&(#x[\da-f]+|#\d+|quot|apos|amp|lt|gt);/gi, (_, entity) => {
  if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
  if (entity.startsWith('#')) return String.fromCodePoint(Number(entity.slice(1)));
  return { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' }[entity];
});
// Trusted Maven Surefire testcase XML; this is not a general-purpose XML importer.
const xml = fs.readFileSync(path.join(reports, 'selenium-regression/surefire-reports/TEST-TestSuite.xml'), 'utf8');
for (const match of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
  const attrs = Object.fromEntries([...match[1].matchAll(/([\w.-]+)="([^"]*)"/g)].map(value => [value[1], decode(value[2])]));
  const body = match[2] || '';
  add('SEL', 'Commerce UI/E2E', attrs.name, `qa/selenium-java/src/test/java/com/vfitai/qa/tests/${attrs.classname.split('.').pop()}.java`,
    /<(failure|error)\b/.test(body) ? 'Failed' : /<skipped\b/.test(body) ? 'Skipped' : 'Passed local');
}
const seen = new Set();
function walk(suite) {
  for (const spec of suite.specs || []) {
    const file = basename(spec.file); const signature = `${file}|${spec.title}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    const results = spec.tests.flatMap(test => test.results);
    add('PW', file.replace('.spec.ts', ''), spec.title, `tests/e2e/${file}`,
      results.length && results.every(result => result.status === 'passed') ? 'Passed local' : 'Review native report');
  }
  for (const child of suite.suites || []) walk(child);
}
for (const suite of ['playwright-regression', 'playwright-visual', 'playwright-compat', 'playwright-accessibility', 'playwright-production']) {
  for (const data of read(path.join(reports, suite, 'playwright.json')).suites) walk(data);
}
const columns = ['ID', 'Layer', 'Module', 'Name', 'Source', 'Status'];
const csv = value => `"${String(value).replaceAll('"', '""')}"`;
fs.writeFileSync(path.join(root, 'qa/docs/automated-test-catalog.csv'), columns.join(',') + '\n' + rows.map(row => columns.map(column => csv(row[column])).join(',')).join('\n') + '\n');
const counts = {};
for (const row of rows) counts[row.Layer] = (counts[row.Layer] || 0) + 1;
console.log(JSON.stringify({ catalog: 'qa/docs/automated-test-catalog.csv', instances: rows.length, counts,
  note: 'Data rows count separately; not a unique business-requirement count. Support tests/probes/candidate export excluded.' }));
