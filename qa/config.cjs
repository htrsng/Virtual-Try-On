const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
function configuration(env = process.env, fallbackRunId = 'local') {
  const port = (key, fallback) => {
    const value = env[key] === undefined ? fallback : Number(env[key]);
    if (!Number.isInteger(value) || value < 1024 || value > 65535) throw new Error(`Invalid ${key}`);
    return value;
  };
  if (env.QA_MONGODB_URI || env.QA_DATABASE_URI) throw new Error('External test database URIs are not supported');
  if (env.QA_HOST && env.QA_HOST !== '127.0.0.1') throw new Error('QA_HOST must be 127.0.0.1');
  const runId = env.QA_RUN_ID || fallbackRunId;
  if (!/^[a-z0-9_-]{1,40}$/.test(runId)) throw new Error('Invalid QA_RUN_ID (1..40 lowercase letters/digits/_/-)');
  const apiPort = port('QA_API_PORT', 3300); const uiPort = port('QA_UI_PORT', 55173);
  if (apiPort === uiPort) throw new Error('QA ports must differ');
  const root = path.resolve(__dirname, '..');
  const runtime = path.join(root, '.runtime', 'qa', runId);
  return { root, runId, host: '127.0.0.1', apiPort, uiPort,
    apiURL: `http://127.0.0.1:${apiPort}`, uiURL: `http://127.0.0.1:${uiPort}`,
    runtime, manifest: path.join(runtime, 'environment.json'),
    control: process.platform === 'win32' ? `\\\\.\\pipe\\vfitai-qa-${runId}`
      : path.join(os.tmpdir(), `vfitai-qa-${createHash('sha256').update(root + runId).digest('hex').slice(0, 20)}.sock`) };
}
module.exports = { configuration };
