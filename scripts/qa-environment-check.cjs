const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { randomUUID } = require('node:crypto');
const { configuration } = require('../qa/config.cjs');
const { start, freePort } = require('../qa/environment.cjs');
async function main() {
  const config = configuration({ ...process.env, QA_RUN_ID: `control_${randomUUID().replaceAll('-', '')}` });
  // A listener on the requested port must cause refusal, never reuse/adoption.
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(config.apiPort, config.host, resolve); });
  try { await assert.rejects(start(config), /EADDRINUSE/); }
  finally { await new Promise(resolve => listener.close(resolve)); }
  const environment = await start(config);
  const command = async operation => {
    const { stdout } = await promisify(execFile)(process.execPath, [path.join(config.root, 'scripts/qa-environment.cjs'), operation],
      { env: { ...process.env, QA_RUN_ID: config.runId, QA_API_PORT: String(config.apiPort), QA_UI_PORT: String(config.uiPort) }, windowsHide: true });
    return JSON.parse(stdout);
  };
  try {
    assert.equal((await command('status')).dataState, 'ready');
    const { UserModel, ProductModel, OrderModel } = require('../server/models');
    await ProductModel.updateOne({ id: 50101 }, { name: 'mutated by environment check' });
    assert.equal((await command('reset')).state, 'ready');
    assert.equal(await UserModel.countDocuments(), 3); assert.equal(await OrderModel.countDocuments(), 2);
    assert.equal((await ProductModel.findOne({ id: 50101 })).name, 'QA Cotton Shirt');
    // A forged capability cannot run cleanup even on the correct local pipe.
    const denied = await new Promise((resolve, reject) => {
      const socket = net.connect(config.control); let body = '';
      socket.on('connect', () => socket.write(JSON.stringify({ command: 'clear', token: 'wrong' }) + '\n'));
      socket.on('data', data => { body += data; }); socket.on('error', reject);
      socket.on('end', () => resolve(JSON.parse(body)));
    });
    assert.match(denied.error, /capability/); assert.equal(await UserModel.countDocuments(), 3);
    await command('clear'); assert.equal(await UserModel.countDocuments(), 0);
    assert.equal((await fetch(`${config.apiURL}/api/health/ready`)).status, 503);
    assert.equal((await fetch(`${config.apiURL}/api/health/live`)).status, 200);
    await command('reset'); assert.equal((await fetch(`${config.uiURL}/api/health/ready`)).status, 200);
    assert.equal((await command('stop')).state, 'stopped');
  } finally { await environment.stop(); }
  await freePort(config.apiPort); await freePort(config.uiPort);
  const manifest = JSON.parse(fs.readFileSync(config.manifest, 'utf8'));
  assert.equal(manifest.status, 'stopped'); assert.equal(manifest.accounts, undefined); assert.equal(manifest.token, undefined);
  const result = { runId: config.runId, portCollisionRefused: true, forgedCapabilityRefused: true,
    cliReset: true, cliClear: true, cliStop: true, readinessTransitions: [200, 503, 200], portsReleased: true, credentialsScrubbed: true };
  fs.writeFileSync(path.join(config.runtime, 'verification.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
