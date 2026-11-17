const { configuration } = require('../qa/config.cjs');
const { start, control } = require('../qa/environment.cjs');
const fs = require('node:fs');
async function main() {
  const command = process.argv[2] || 'start'; const config = configuration();
  if (command !== 'start') {
    if (!['reset', 'clear', 'status', 'stop'].includes(command)) throw new Error('Use start|reset|clear|status|stop');
    const result = await control(command, config);
    if (command === 'stop') {
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        try {
          if (JSON.parse(fs.readFileSync(config.manifest, 'utf8')).status === 'stopped') {
            console.log(JSON.stringify({ state: 'stopped', runId: config.runId })); return;
          }
        } catch (_) {}
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Timed out waiting for QA cleanup');
    }
    console.log(JSON.stringify(result)); return;
  }
  const environment = await start(config);
  console.log(`QA ready: UI ${config.uiURL}, API ${config.apiURL}; credentials: ${config.manifest}`);
  const stop = () => environment.stop().catch(error => { console.error(error.message); process.exitCode = 1; });
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
