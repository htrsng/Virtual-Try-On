const path = require('node:path');
const { spawnSync } = require('node:child_process');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
describe('Fail closed configuration and readiness', () => {
  test.each(['', 'short', 'your-secret-key-change-this-in-production', 'replace-with-a-long-random-secret'])('unsafe JWT configuration is refused: %p', secret => {
    const result = spawnSync(process.execPath, ['-e', 'require("./config/env")'], {
      cwd: path.join(__dirname, '..'), env: { ...process.env, NODE_ENV: 'test', JWT_SECRET: secret }, encoding: 'utf8' });
    expect(result.status).toBe(1); expect(result.stderr).toContain('JWT_SECRET must be explicitly configured');
  });
  test('database outage returns 503; retired reset remains unavailable', async () => {
    await mongoose.disconnect();
    const res = await request(app).get('/api/products'); expect(res.status).toBe(503); expect(res.body.code).toBe('DB_NOT_READY');
    expect((await request(app).post('/api/admin/reset-data').send({})).status).toBe(404);
  });
});
