const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { spawn, spawnSync, execFileSync } = require('node:child_process');
const { classify, xml } = require('./policy.cjs');
const root = path.resolve(__dirname, '../..');
const definitions = {
  'ci-harness': { dependencies: [], minimum: 12 },
  lint: { dependencies: ['client'] }, build: { dependencies: ['client'] }, frontend: { dependencies: ['client'], minimum: 38 },
  helpers: { dependencies: ['client'], minimum: 14 }, 'playwright-types': { dependencies: ['tests'] },
  backend: { dependencies: ['server'], minimum: 134 },
  'selenium-smoke': { dependencies: ['server', 'client'], minimum: 5 },
  'selenium-regression': { dependencies: ['server', 'client'], minimum: 22 },
  'playwright-3d': { dependencies: ['server', 'client', 'tests'], minimum: 6 },
  'playwright-regression': { dependencies: ['server', 'client', 'tests'], minimum: 12 },
  'playwright-accessibility': { dependencies: ['server', 'client', 'tests'], minimum: 21 },
  'playwright-production': { dependencies: ['server', 'client', 'tests'], minimum: 4 },
  'playwright-compat': { dependencies: ['server', 'client', 'tests'], minimum: 20 },
  'playwright-visual': { dependencies: ['server', 'client', 'tests'], minimum: 1 },
};
const [action, suite] = process.argv.slice(2);
if (!definitions[suite] || !['init', 'install', 'browsers', 'run', 'finalize'].includes(action)) {
  console.error('Use init|install|browsers|run|finalize and a known CI suite'); process.exit(2);
}
const directory = path.join(root, '.runtime', 'ci', suite);
const stateFile = path.join(directory, 'state.json');
fs.mkdirSync(directory, { recursive: true });
const read = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : undefined;
const git = (...args) => { try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return undefined; } };
const hash = file => createHash('sha256').update(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')).digest('hex');
const fresh = file => fs.existsSync(file) && fs.statSync(file).mtimeMs >= Date.parse(state.startedAt);
function version(executable, args) {
  const windowsCmd = process.platform === 'win32' && ['mvn', 'npm'].includes(executable);
  const result = spawnSync(windowsCmd ? 'cmd.exe' : executable, windowsCmd ? ['/d', '/s', '/c', `${executable}.cmd`, ...args] : args,
    { encoding: 'utf8', windowsHide: true, timeout: 10000 });
  return result.status === 0 ? ((result.stdout || '') + (result.stderr || '')).trim().slice(0, 1500) : 'unavailable';
}
function metadata() {
  let event = {}; try { if (process.env.GITHUB_EVENT_PATH) event = read(process.env.GITHUB_EVENT_PATH) || {}; } catch {}
  return { checkedOutSha: git('rev-parse', 'HEAD'), sourceHeadSha: event.pull_request?.head?.sha,
    baseSha: event.pull_request?.base?.sha, dirty: !!git('status', '--porcelain', '--untracked-files=no'),
    runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT, event: process.env.GITHUB_EVENT_NAME || 'local',
    ref: process.env.GITHUB_REF, repository: process.env.GITHUB_REPOSITORY,
    node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release(),
    uiMode: suite === 'playwright-production' ? 'preview' : 'development',
    runnerImage: process.env.ImageOS, runnerImageVersion: process.env.ImageVersion,
    mongodbRequestedVersion: process.env.MONGOMS_VERSION || 'mongodb-memory-server default',
    lockSha256LF: Object.fromEntries(['client', 'server', 'tests'].map(name => [name, hash(path.join(root, name, 'package-lock.json'))])) };
}
let state = read(stateFile) || { suite, status: 'Blocked', reason: 'Execution has not started', phases: {}, startedAt: new Date().toISOString() };
function save() { fs.writeFileSync(stateFile, JSON.stringify(state, null, 2)); }
async function command(executable, args, cwd = root, extraEnv = {}, logName = action) {
  const file = path.join(directory, `${logName}.log`);
  const label = [executable === process.execPath ? 'node' : executable, ...args].join(' ');
  fs.appendFileSync(file, `\n$ ${label}\n`);
  const windowsNpm = process.platform === 'win32' && executable === 'npm';
  const child = spawn(windowsNpm ? 'cmd.exe' : executable, windowsNpm ? ['/d', '/s', '/c', 'npm.cmd', ...args] : args,
    { cwd, windowsHide: true, env: { ...process.env, CI_REPORT_DIR: directory, CI_COMMIT_SHA: state.environment?.checkedOutSha || '', ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { process.stdout.write(data); fs.appendFileSync(file, data); });
  return new Promise(resolve => {
    child.once('error', error => resolve({ command: label, code: 1, spawnError: error.code }));
    child.once('exit', (code, signal) => resolve({ command: label, code: code ?? 1, signal }));
  });
}
const node = (args, cwd, env) => command(process.execPath, args, cwd, env);
function plans() {
  const client = path.join(root, 'client'); const server = path.join(root, 'server'); const tests = path.join(root, 'tests');
  const pw = ['node_modules/@playwright/test/cli.js', 'test'];
  switch (suite) {
    case 'ci-harness': return [() => node(['--test', '--test-reporter=junit', `--test-reporter-destination=${path.join(directory, 'harness.xml')}`, 'scripts/ci/policy.test.cjs'])];
    case 'lint': return [() => node(['node_modules/eslint/bin/eslint.js', '.', '--format', 'json', '--output-file', path.join(directory, 'eslint.json')], client)];
    case 'build': return [() => command('npm', ['run', 'build'], client, { NODE_ENV: 'production' })];
    case 'frontend': return [() => node(['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.ci.config.ts'], client)];
    case 'helpers': return [() => node(['--experimental-strip-types', '--test', '--test-reporter=junit', `--test-reporter-destination=${path.join(directory, 'helpers.xml')}`, 'archive/coursework-api-fuzzing/automation-testing/tests/fetch-timeout.test.mjs', 'archive/coursework-api-fuzzing/automation-testing/tests/size-recommendation.test.mjs'])];
    case 'playwright-types': return [() => node(['node_modules/typescript/bin/tsc', '--noEmit'], tests)];
    case 'backend': return [() => node(['node_modules/jest/bin/jest.js', '--runInBand', '--json', `--outputFile=${path.join(directory, 'backend.json')}`, '--reporters=default', '--reporters=../scripts/ci/jest-reporter.cjs'], server, { NODE_ENV: 'test' })];
    case 'selenium-smoke': case 'selenium-regression': return [() => node(['scripts/qa-selenium.cjs', '-Dbrowser=chrome', `-Dgroups=${suite.endsWith('smoke') ? 'smoke' : 'regression'}`, `-Dqa.commitSha=${state.environment.checkedOutSha}`], root, { NODE_ENV: 'test' })];
    case 'playwright-3d': return [() => node([...pw, '--project=3d-chromium'], tests, { NODE_ENV: 'test', QA_3D_VISUAL: '0', QA_3D_DIAGNOSTIC: '0' }),
      () => node([...pw, '--config=playwright.candidates.config.ts'], tests, { NODE_ENV: 'test', CI_REPORT_DIR: path.join(directory, 'visual-candidates') })];
    case 'playwright-regression': return [() => node(pw, tests, { NODE_ENV: 'test', QA_3D_VISUAL: '0', QA_3D_DIAGNOSTIC: '0' })];
    case 'playwright-accessibility': return [() => node([...pw, '--config=playwright.accessibility.config.ts'], tests, { NODE_ENV: 'test' })];
    case 'playwright-production': return [() => command('npm', ['run', 'build'], client, { NODE_ENV: 'production', VITE_API_URL: '' }),
      () => node([...pw, '--config=playwright.production.config.ts'], tests, { NODE_ENV: 'test', QA_UI_MODE: 'preview' })];
    case 'playwright-compat': return [() => node([...pw, '--config=playwright.compat.config.ts'], tests, { NODE_ENV: 'test' })];
    case 'playwright-visual': return [() => node([...pw, '--project=3d-visual'], tests, { NODE_ENV: 'test', QA_3D_VISUAL: '1', QA_3D_DIAGNOSTIC: '0' }),
      () => node(['scripts/qa-3d-diagnostic.cjs'], root, { NODE_ENV: 'test' })];
  }
}
function counts() {
  const name = suite === 'backend' ? 'backend.json' : suite === 'frontend' ? 'frontend.json' : 'playwright.json';
  const json = read(path.join(directory, name));
  if (json && suite.startsWith('playwright-')) return { passed: json.stats.expected, failed: json.stats.unexpected + json.stats.flaky, skipped: json.stats.skipped };
  if (json) return { passed: json.numPassedTests, failed: json.numFailedTests, skipped: (json.numPendingTests || 0) + (json.numTodoTests || 0) };
  if (suite.startsWith('selenium-')) {
    const source = path.join(root, 'qa/selenium-java/target/surefire-reports/TEST-TestSuite.xml');
    if (!fresh(source)) return;
    const attributes = fs.readFileSync(source, 'utf8').match(/<testsuite\b[^>]*>/)?.[0] || '';
    const value = key => Number(attributes.match(new RegExp(`\\b${key}="(\\d+)"`))?.[1] || 0);
    return { passed: value('tests') - value('failures') - value('errors') - value('skipped'), failed: value('failures') + value('errors'), skipped: value('skipped') };
  }
  const nodeXml = path.join(directory, suite === 'helpers' ? 'helpers.xml' : 'harness.xml');
  if (['helpers', 'ci-harness'].includes(suite) && fs.existsSync(nodeXml)) {
    const text = fs.readFileSync(nodeXml, 'utf8');
    const total = (text.match(/<testcase\b/g) || []).length; const failed = (text.match(/<failure\b|<error\b/g) || []).length; const skipped = (text.match(/<skipped\b/g) || []).length;
    return { passed: total - failed - skipped, failed, skipped };
  }
}
function collect() {
  if (suite.startsWith('selenium-')) for (const folder of ['surefire-reports', 'screenshots']) {
    const from = path.join(root, 'qa/selenium-java/target', folder);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(directory, folder), { recursive: true, filter: file => fs.statSync(file).isDirectory() || fresh(file) });
  }
  if (suite === 'playwright-visual') {
    const from = path.join(root, '.runtime/qa3d-diagnostic');
    if (fs.existsSync(from)) fs.cpSync(from, path.join(directory, 'negative-control'), { recursive: true, filter: file => fs.statSync(file).isDirectory() || fresh(file) });
  }
}
function reports() {
  const properties = `<property name="vfitai.commit_sha" value="${xml(state.environment.checkedOutSha)}"/><property name="vfitai.source_head_sha" value="${xml(state.environment.sourceHeadSha)}"/><property name="vfitai.node" value="${xml(process.version)}"/><property name="vfitai.platform" value="${xml(process.platform)}"/>`;
  const stamp = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'negative-control') stamp(file); continue; }
      if (!entry.name.endsWith('.xml')) continue;
      let text = fs.readFileSync(file, 'utf8');
      if (text.includes('name="vfitai.commit_sha"')) continue;
      text = text.replace(/(<testsuite\b[^>]*>)(\s*<properties>)?/g, (_, tag, existing) => existing ? tag + existing + properties : tag + '<properties>' + properties + '</properties>');
      fs.writeFileSync(file, text);
    }
  };
  stamp(directory);
  fs.writeFileSync(path.join(directory, 'gate.xml'), `<?xml version="1.0" encoding="UTF-8"?><testsuite name="${xml(suite)} quality gate" tests="1" failures="${state.status === 'Passed' ? 0 : 1}"><properties>${properties}</properties><testcase name="${xml(suite)} gate">${state.status === 'Passed' ? '' : `<failure type="${xml(state.status)}">${xml(state.reason)}</failure>`}</testcase></testsuite>`);
  fs.writeFileSync(path.join(directory, 'index.html'), `<!doctype html><meta charset="utf-8"><title>${xml(suite)} CI report</title><h1>${xml(suite)} — ${xml(state.status)}</h1><p>Commit: ${xml(state.environment.checkedOutSha)}</p><p>${xml(state.reason)}</p><p><a href="summary.json">Summary</a> · <a href="environment.json">Environment</a> · <a href="run.log">Execution log</a></p><pre>${xml(JSON.stringify(state, null, 2))}</pre>`);
  fs.writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(state, null, 2));
  fs.writeFileSync(path.join(directory, 'environment.json'), JSON.stringify(state.environment, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${suite}: ${state.status}\n\nCommit: \`${state.environment.checkedOutSha}\`\n\n${state.reason}\n\nCounts: ${JSON.stringify(state.counts || {})}\n\n`);
}
async function main() {
  if (action === 'init') {
    // Only this enum-owned generated output directory is reset. Never touch QA manifests or application data.
    const safeParent = path.join(root, '.runtime', 'ci') + path.sep;
    if (!path.resolve(directory).startsWith(safeParent)) throw new Error('Unsafe CI output directory');
    fs.rmSync(directory, { recursive: true, force: true }); fs.mkdirSync(directory, { recursive: true });
    state = { suite, environment: metadata(), status: 'Blocked', reason: 'Waiting for dependencies and test execution', phases: {}, startedAt: new Date().toISOString() }; save(); return;
  }
  state.environment ||= metadata();
  if (action === 'finalize') {
    collect(); state.counts = counts(); state.finishedAt = new Date().toISOString(); state.githubJobStatus = process.env.CI_JOB_STATUS;
    if (!state.phases.run) { state.status = state.phases.install?.code || state.phases.browsers?.code || process.env.CI_JOB_STATUS === 'failure' ? 'InfrastructureFailure' : 'Blocked'; state.reason = 'Execution did not start; inspect dependency/browser phases and GitHub job status'; }
    else if (state.phases.run.state !== 'completed') { state.status = 'InfrastructureFailure'; state.reason = 'Execution interrupted before runner completed; inspect GitHub job conclusion and partial log'; }
    else {
      Object.assign(state, classify({ phase: 'run', exitCode: state.phases.run.code, counts: state.counts,
        minimum: definitions[suite].minimum || 0, reportRequired: !!definitions[suite].minimum,
        text: fs.existsSync(path.join(directory, 'run.log')) ? fs.readFileSync(path.join(directory, 'run.log'), 'utf8') : '', blockedReason: state.blockedReason }));
    }
    state.environment.completedNode = process.version;
    state.environment.npm = version('npm', ['--version']);
    if (suite === 'lint' && fs.existsSync(path.join(directory, 'eslint.json'))) {
      const findings = read(path.join(directory, 'eslint.json'));
      state.diagnostics = { errors: findings.reduce((sum, file) => sum + file.errorCount, 0), warnings: findings.reduce((sum, file) => sum + file.warningCount, 0),
        affectedFiles: findings.filter(file => file.errorCount || file.warningCount).map(file => ({ path: path.relative(root, file.filePath).replaceAll('\\', '/'), errors: file.errorCount, warnings: file.warningCount })) };
      if (state.status === 'Failed') state.reason = `ESLint: ${state.diagnostics.errors} errors, ${state.diagnostics.warnings} warnings; full findings in eslint.json`;
    }
    if (suite === 'build' && fs.existsSync(path.join(directory, 'run.log'))) {
      state.diagnostics = { typescript: (fs.readFileSync(path.join(directory, 'run.log'), 'utf8').match(/\berror TS\d+:/g) || []).length };
      if (state.status === 'Failed' && state.diagnostics.typescript) state.reason = `Frontend build failed with ${state.diagnostics.typescript} TypeScript diagnostics; no build bypass`;
    }
    if (fs.existsSync(path.join(root, 'tests/node_modules/@playwright/test/package.json'))) state.environment.playwright = read(path.join(root, 'tests/node_modules/@playwright/test/package.json')).version;
    if (suite === 'playwright-accessibility' && fs.existsSync(path.join(root, 'tests/node_modules/@axe-core/playwright/package.json'))) state.environment.axePlaywright = read(path.join(root, 'tests/node_modules/@axe-core/playwright/package.json')).version;
    if (suite.startsWith('selenium-')) {
      state.environment.java = version('java', ['-version']); state.environment.maven = version('mvn', ['--version']);
      const log = fs.existsSync(path.join(directory, 'run.log')) ? fs.readFileSync(path.join(directory, 'run.log'), 'utf8') : '';
      state.environment.seleniumBrowserVersions = [...new Set([...log.matchAll(/^Browser:\s*(.+)$/gm)].map(match => match[1].trim()))];
    }
    if (fs.existsSync(path.join(root, 'tests/node_modules/playwright-core/browsers.json'))) state.environment.chromium = read(path.join(root, 'tests/node_modules/playwright-core/browsers.json')).browsers.find(browser => browser.name === 'chromium');
    if (['playwright-compat', 'playwright-accessibility'].includes(suite)) state.environment.firefox = read(path.join(root, 'tests/node_modules/playwright-core/browsers.json'))?.browsers.find(browser => browser.name === 'firefox');
    save(); reports(); console.log(JSON.stringify({ suite, status: state.status, counts: state.counts, sha: state.environment.checkedOutSha }));
    process.exitCode = state.status === 'Passed' ? 0 : 1; return;
  }
  const results = [];
  state.phases[action] = { state: 'running', code: null, startedAt: new Date().toISOString() }; save();
  if (action === 'install') {
    for (const dependency of definitions[suite].dependencies) { const result = await command('npm', ['ci', '--include=dev'], path.join(root, dependency)); results.push(result); if (result.code) break; }
  } else if (action === 'browsers') {
    if (suite.startsWith('playwright-') && suite !== 'playwright-types') results.push(await node(['node_modules/@playwright/test/cli.js', 'install', ...(process.platform === 'linux' ? ['--with-deps'] : []), 'chromium', ...(['playwright-compat', 'playwright-accessibility'].includes(suite) ? ['firefox'] : [])], path.join(root, 'tests')));
  } else {
    if (suite === 'playwright-visual' && process.platform !== 'win32') { state.blockedReason = 'Approved visual baselines are Windows-only; no cross-platform substitution'; results.push({ code: 1 }); }
    else for (const execute of plans()) { const result = await execute(); results.push(result); if (result.code) break; }
  }
  const failed = results.find(result => result.code !== 0);
  state.phases[action] = { ...state.phases[action], state: 'completed', code: failed ? failed.code : 0, commands: results, finishedAt: new Date().toISOString() }; save();
  process.exitCode = failed ? 1 : 0;
}
main().catch(error => {
  state.status = 'InfrastructureFailure'; state.reason = `CI harness error: ${error.message}`;
  state.environment ||= metadata(); save(); try { reports(); } catch {}
  console.error(error.message); process.exitCode = 1;
});
