const request = require('supertest');
const app = require('../index');
const { actor, product } = require('./helpers');
describe('Product API', () => {
  test('admin creates product with numeric identity', async () => {
    const { token } = await actor('admin');
    const res = await request(app).post('/api/products').auth(token, { type: 'bearer' }).send({ name: 'QA shirt', price: 200000, stock: 5 });
    expect(res.status).toBe(201); expect(res.body.stock).toBe(5); expect(res.body.id).toBe(1);
  });
  test('public catalog is array and includes independently seeded product', async () => {
    const item = await product(); const res = await request(app).get('/api/products');
    expect(res.status).toBe(200); expect(Array.isArray(res.body)).toBe(true); expect(res.body.map(p => p.id)).toContain(item.id);
  });
  test('product detail resolves numeric and Mongo identity; absent id is 404', async () => {
    const item = await product();
    for (const id of [item.id, String(item._id)]) {
      const res = await request(app).get(`/api/products/${id}`); expect(res.status).toBe(200); expect(res.body.name).toBe(item.name);
    }
    expect((await request(app).get('/api/products/999')).status).toBe(404);
  });
  test('partial edit preserves inventory; duplicate numeric identity is 409', async () => {
    const item = await product(); const { token } = await actor('admin');
    const res = await request(app).put(`/api/products/${item.id}`).auth(token, { type: 'bearer' }).send({ name: 'renamed', __v: 0 });
    expect(res.status).toBe(200); expect(res.body.stock).toBe(20);
    expect((await request(app).post('/api/products').auth(token, { type: 'bearer' }).send({ id: item.id, name: 'duplicate', price: 1 })).status).toBe(409);
  });
});
