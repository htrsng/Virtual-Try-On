const request = require('supertest');
const app = require('../index');
const { actor, product, shippingInfo } = require('./helpers');
describe('Order API', () => {
  test('authenticated owner creates a COD order then reads persisted server totals', async () => {
    const { token } = await actor(); const item = await product();
    const placed = await request(app).post('/api/orders').auth(token, { type: 'bearer' })
      .send({ products: [{ productId: item.id, quantity: 2 }], shippingInfo, paymentMethod: 'COD' });
    expect(placed.status).toBe(201);
    const list = await request(app).get('/api/orders/my-orders').auth(token, { type: 'bearer' });
    expect(list.status).toBe(200); expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ _id: placed.body.order._id, totalAmount: 430000 });
  });
  test('user never sees other owners orders', async () => {
    const first = await actor(); const second = await actor(); const item = await product();
    await request(app).post('/api/orders').auth(first.token, { type: 'bearer' }).send({ products: [{ productId: item.id, quantity: 1 }], shippingInfo });
    const list = await request(app).get('/api/orders/my-orders').auth(second.token, { type: 'bearer' });
    expect(list.status).toBe(200); expect(list.body).toEqual([]);
  });
});
