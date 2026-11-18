const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { configuration } = require('./config.cjs');

async function freePort(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer(); server.once('error', reject);
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
async function waitReady(url, predicate) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok && (!predicate || await predicate(res))) return;
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Readiness timeout: ${url}`);
}
async function control(command, config = configuration()) {
  const state = JSON.parse(fs.readFileSync(config.manifest, 'utf8'));
  if (state.runId !== config.runId || state.control !== config.control || state.status !== 'ready') throw new Error('No matching running QA environment');
  return new Promise((resolve, reject) => {
    const socket = net.connect(config.control); let body = '';
    socket.setTimeout(60000, () => socket.destroy(new Error('QA control timeout')));
    socket.on('connect', () => socket.write(JSON.stringify({ command, token: state.token }) + '\n'));
    socket.on('data', data => { body += data; if (body.includes('\n')) {
      socket.end(); const response = JSON.parse(body.split('\n')[0]);
      if (response.error) reject(new Error(response.error)); else resolve(response);
    } });
    socket.on('error', reject);
    socket.on('end', () => { if (!body) reject(new Error('QA control closed without response')); });
  });
}
async function start(config = configuration()) {
  if (process.env.NODE_ENV === 'production') throw new Error('QA launcher refuses NODE_ENV=production');
  if (config.uiMode === 'preview' && !fs.existsSync(path.join(config.root, 'client/dist/index.html'))) {
    throw new Error('Build the client before starting QA preview');
  }
  // No runtime URI/JWT/provider credentials from a development shell are forwarded.
  process.env.NODE_ENV = 'test';
  await freePort(config.apiPort); await freePort(config.uiPort);
  fs.mkdirSync(config.runtime, { recursive: true });
  const lockPath = path.join(config.runtime, 'owner.lock');
  const lock = fs.openSync(lockPath, 'wx');
  const token = randomBytes(32).toString('hex');
  const children = []; const logs = []; let database; let controlServer; let stopping;
  const state = { runId: config.runId, uiMode: config.uiMode || 'development', status: 'starting', dataState: 'empty', resets: 0, token, control: config.control,
    apiURL: config.apiURL, uiURL: config.uiURL, pid: process.pid };
  function save() { fs.writeFileSync(config.manifest, JSON.stringify(state, null, 2), { mode: 0o600 }); }
  save();
  const stop = () => {
    if (stopping) return stopping;
    stopping = (async () => {
      state.status = 'stopping'; save();
      if (controlServer) await new Promise(resolve => controlServer.close(resolve));
      await Promise.all(children.map(child => new Promise(resolve => {
        if (child.exitCode !== null || child.signalCode !== null) return resolve();
        child.once('close', resolve); child.kill();
      })));
      try { if (database) await database.close(); }
      finally {
        logs.forEach(fd => fs.closeSync(fd)); fs.closeSync(lock); fs.unlinkSync(lockPath);
        // Do not leave capabilities, generated fixture passwords, or DB URI in a stopped manifest.
        fs.writeFileSync(config.manifest, JSON.stringify({ runId: config.runId, status: 'stopped', apiURL: config.apiURL, uiURL: config.uiURL }, null, 2));
        fs.writeFileSync(path.join(config.runtime, 'cleanup-summary.json'), JSON.stringify({ runId: config.runId,
          databaseName: database?.name, status: 'stopped', resets: state.resets, children: children.map(child => child.pid) }, null, 2));
      }
    })();
    return stopping;
  };
  function child(name, directory, args, env) {
    const log = fs.openSync(path.join(config.runtime, `${name}.log`), 'w'); logs.push(log);
    const process = spawn(global.process.execPath, args, { cwd: path.join(config.root, directory), env, windowsHide: true, stdio: ['ignore', log, log] });
    children.push(process);
    process.on('error', () => { void stop(); });
    process.on('exit', () => { if (!stopping) void stop(); });
    return process;
  }
  try {
    const { createOwnedDatabase } = require('../server/test-support/owned-database');
    database = await createOwnedDatabase({ runId: config.runId });
    state.fixture = await database.reset(); state.accounts = database.credentials; state.dataState = 'ready'; state.resets++;
    state.databaseName = database.name;
    const jwtSecret = randomBytes(48).toString('hex');
    // Negative-session fixture signed by this disposable API's key; never expose the key.
    state.testSessions = { expiredCustomer: require('../server/node_modules/jsonwebtoken').sign(
      { id: state.fixture.ids.customer }, jwtSecret, { algorithm: 'HS256', expiresIn: -1 }) };
    const env = { ...process.env, NODE_ENV: 'test', HOST: config.host, PORT: String(config.apiPort),
      MONGODB_URI: database.uri, JWT_SECRET: jwtSecret,
      GEMINI_API_KEY: '', EMAIL_USER: '', EMAIL_PASS: '', QA_RUN_ID: config.runId,
      VITE_API_URL: config.apiURL, VITE_API_PROXY_TARGET: config.apiURL, VITE_QA_3D: 'true' };
    child('api', 'server', ['index.js'], env);
    const uiCommand = config.uiMode === 'preview' ? ['preview'] : ['--mode', 'qa'];
    child('ui', 'client', ['node_modules/vite/bin/vite.js', ...uiCommand, '--host', config.host, '--port', String(config.uiPort), '--strictPort'], env);
    const matches = async response => { const data = await response.json(); return data.status === 'ready' && data.runId === config.runId; };
    await waitReady(`${config.apiURL}/api/health/ready`, matches);
    await waitReady(`${config.uiURL}/api/health/ready`, matches);
    await waitReady(config.uiURL, async response => (await response.text()).includes('id="root"'));
    controlServer = net.createServer(socket => {
      let body = ''; socket.setTimeout(60000, () => socket.destroy());
      socket.on('error', () => {});
      socket.on('data', async data => {
        body += data; if (body.length > 4096) return socket.destroy();
        if (!body.includes('\n')) return;
        socket.pause();
        let command;
        try {
          const request = JSON.parse(body.split('\n')[0]);
          if (request.token !== token) throw new Error('Invalid QA control capability');
          command = request.command; let result;
          if (command === 'reset') { state.fixture = await database.reset(); state.dataState = 'ready'; state.resets++; result = { state: 'ready', fixture: state.fixture }; save(); }
          else if (command === 'clear') { result = await database.clear(); state.dataState = 'empty'; save(); }
          else if (command === 'status' || command === 'stop') result = { state: command === 'stop' ? 'stopping' : state.status, dataState: state.dataState, runId: config.runId };
          else throw new Error('Unknown QA control command');
          socket.end(JSON.stringify(result) + '\n', () => socket.destroy());
        } catch (error) { socket.end(JSON.stringify({ error: error.message }) + '\n', () => socket.destroy()); }
        if (command === 'stop') socket.once('close', () => { void stop(); });
      });
    });
    await new Promise((resolve, reject) => { controlServer.once('error', reject); controlServer.listen(config.control, resolve); });
    if (process.platform !== 'win32') fs.chmodSync(config.control, 0o600);
    state.status = 'ready'; save();
    return { config, database, state, stop };
  } catch (error) { await stop(); throw error; }
}
module.exports = { start, control, waitReady, freePort };
