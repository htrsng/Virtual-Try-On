const request = require('supertest');
const app = require('../index');
const { actor } = require('./helpers');
describe('Admin API', () => {
  test('admin sees sync counts', async () => {
    const { token } = await actor('admin');
    const res = await request(app).get('/api/admin/sync-status').auth(token, { type: 'bearer' });
    expect(res.status).toBe(200); expect(res.body.data.totalUsers).toBe(1); expect(res.body.data.totalOrders).toBe(0);
  });
  test('admin sync returns aggregate data without user credentials', async () => {
    const { token } = await actor('admin');
    const res = await request(app).get('/api/admin/get-all-data').auth(token, { type: 'bearer' });
    expect(res.status).toBe(200); expect(res.body.data.users).toBe(1); expect(res.body.data.products).toEqual([]);
    expect(JSON.stringify(res.body)).not.toContain('password');
  });
});
