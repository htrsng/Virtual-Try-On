jest.mock('../config/mailer', () => ({ sendMail: jest.fn().mockResolvedValue({}) }));
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { actor, product, shippingInfo } = require('./helpers');
const { UserModel, OrderModel, ChatMessageModel } = require('../models');
const { JWT_SECRET } = require('../config/env');

describe('Stage 1 P0 security regression', () => {
  // Anonymous/user denial for these paths is covered by permissions.test.js's full matrix.
  test('server recalculates forged order totals from catalog', async () => {
    const { token } = await actor(); const item = await product();
    const res = await request(app).post('/api/orders').auth(token, { type: 'bearer' }).send({
      products: [{ productId: item.id, quantity: 2, price: 1, name: 'forged' }],
      totalAmount: 1, shippingFee: -100, discountAmount: 999999, shippingInfo });
    expect(res.status).toBe(201);
    expect(res.body.order.totalAmount).toBe(430000);
    expect(res.body.order.products[0]).toMatchObject({ price: 200000, name: item.name });
  });
  test('admin setup HTTP endpoint is retired', async () => {
    expect((await request(app).post('/api/auth/create-admin').send({})).status).toBe(404);
  });
  test.each(['/api/admin/reset-data', '/api/admin/clear-all-data'])('%s is retired even for admin', async url => {
    const { token, user } = await actor('admin');
    expect((await request(app).post(url).auth(token, { type: 'bearer' }).send({ confirm: 'CLEAR_ALL_DATA' })).status).toBe(404);
    expect(await UserModel.findById(user._id)).not.toBeNull();
  });
  test.each(['invalid', 'expired', 'deleted', 'wrong-scheme'])('%s credentials return 401', async kind => {
    const { token, user } = await actor();
    let value = kind === 'invalid' ? 'broken' : token;
    if (kind === 'expired') value = jwt.sign({ id: String(user._id) }, JWT_SECRET, { expiresIn: -1 });
    if (kind === 'deleted') await user.deleteOne();
    expect((await request(app).get('/api/auth/me').set('Authorization', `${kind === 'wrong-scheme' ? 'Basic' : 'Bearer'} ${value}`)).status).toBe(401);
  });
  test('demoted admin token cannot retain admin privileges', async () => {
    const { user, token } = await actor('admin');
    await UserModel.updateOne({ _id: user._id }, { role: 'user' });
    expect((await request(app).get('/api/users').auth(token, { type: 'bearer' })).status).toBe(403);
  });
  test('profile cannot promote role or replace password', async () => {
    const { user, token } = await actor();
    const res = await request(app).put('/api/auth/profile').auth(token, { type: 'bearer' })
      .send({ role: 'admin', password: 'injected', fullName: 'valid' });
    expect(res.status).toBe(400);
    expect((await UserModel.findById(user._id)).role).toBe('user');
  });
  test('chat cannot impersonate client supplied userId', async () => {
    const { user } = await actor();
    const res = await request(app).post('/api/chat/send').send({ message: 'hello', userId: String(user._id) });
    expect(res.status).toBe(200);
    expect(res.body.userMessage.userId).toBeUndefined();
    expect(await ChatMessageModel.countDocuments({ userId: user._id })).toBe(0);
  });
  test('payment cannot mutate another user order', async () => {
    const owner = await actor(); const other = await actor();
    const order = await OrderModel.create({ userId: owner.user._id, totalAmount: 100, products: [] });
    const res = await request(app).post('/api/payment/create').auth(other.token, { type: 'bearer' })
      .send({ orderId: String(order._id), amount: 1, method: 'momo' });
    expect(res.status).toBe(404);
    expect((await OrderModel.findById(order._id)).paymentMethod).toBe('COD');
  });
  test('unknown payment status cannot claim success', async () => {
    const { token } = await actor();
    const res = await request(app).get('/api/payment/status/unknown').auth(token, { type: 'bearer' });
    expect(res.status).toBe(404);
  });
  test('invalid Mongo id is 400 instead of internal database error', async () => {
    const { token } = await actor('admin');
    expect((await request(app).get('/api/users/not-an-id').auth(token, { type: 'bearer' })).status).toBe(400);
  });
  test('user responses exclude credential and internal fields', async () => {
    const { token } = await actor('admin');
    const res = await request(app).get('/api/users').auth(token, { type: 'bearer' });
    expect(res.status).toBe(200);
    for (const user of res.body) {
      expect(user).not.toHaveProperty('password'); expect(user).not.toHaveProperty('failedLoginCount');
    }
  });
});
