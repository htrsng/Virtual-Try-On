// Own the QA services for exactly one Maven invocation; never attach to development DB.
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { configuration } = require('../qa/config.cjs');
const { start, freePort } = require('../qa/environment.cjs');
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  process.env.QA_RUN_ID ||= `sel_${randomUUID().slice(0, 8)}`;
  const config = configuration();
  const environment = await start(config);
  const started = Date.now();
  let mavenExit = 1;
  try {
    const args = ['-B', '-f', 'qa/selenium-java/pom.xml', 'test', ...process.argv.slice(2)];
    // cmd.exe is needed for Maven's Windows .cmd launcher. Reject shell metacharacters.
    if (args.some(arg => !/^[a-zA-Z0-9_./:=,\-]+$/.test(arg))) throw new Error('Unsupported Maven argument');
    const child = spawn(process.platform === 'win32' ? 'cmd.exe' : 'mvn',
      process.platform === 'win32' ? ['/d', '/s', '/c', 'mvn.cmd', ...args] : args,
      { cwd: config.root, windowsHide: true, stdio: 'inherit', env: { ...process.env, QA_MANIFEST: config.manifest } });
    const stop = () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      if (process.platform === 'win32') {
        // Maven's .cmd wrapper owns Java/driver descendants; terminate that exact tree.
        const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => child.kill());
      } else child.kill('SIGTERM');
    };
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
    try {
      mavenExit = await new Promise((resolve, reject) => {
        child.once('error', reject); child.once('exit', code => resolve(code ?? 1));
      });
    } finally { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); }
  } finally {
    await environment.stop();
    await freePort(config.apiPort); await freePort(config.uiPort);
    const stopped = JSON.parse(fs.readFileSync(config.manifest, 'utf8'));
    if (stopped.status !== 'stopped' || stopped.accounts || stopped.token) throw new Error('QA manifest cleanup failed');
    const summary = { runId: config.runId, mavenExit, durationMs: Date.now() - started,
      cleanup: 'stopped; manifest scrubbed; API/UI ports released' };
    fs.writeFileSync(path.join(config.runtime, 'selenium-summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary));
  }
  process.exitCode = mavenExit;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
