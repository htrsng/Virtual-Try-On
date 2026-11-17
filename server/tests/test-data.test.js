const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../index');
const { clear, createOwnedDatabase } = require('../test-support/owned-database');
const { seed } = require('../test-support/seed');
const { configuration } = require('../../qa/config.cjs');
const { UserModel, ProductModel, OrderModel, UsedCouponModel, TryonSessionModel } = require('../models');

describe('Owned test data lifecycle', () => {
  test('seed restores complete users/products/orders/3D data after mutations', async () => {
    const db = global.qaTestDatabase; const first = await db.reset();
    const before = await ProductModel.find().sort({ id: 1 }).lean();
    expect(await UserModel.countDocuments()).toBe(3); expect(await OrderModel.countDocuments()).toBe(2);
    expect(first.assets).toHaveLength(7);
    const login = await request(app).post('/api/auth/login').send(db.credentials.customer);
    expect(login.status).toBe(200);
    const placed = await request(app).post('/api/orders').auth(login.body.token, { type: 'bearer' }).send({
      products: [{ productId: 50101, quantity: 1, color: 'White', size: 'M' }], discountCode: 'GIAM10',
      shippingInfo: { fullName: 'QA', phone: '0900000000', address: 'Synthetic fixture address' },
    });
    expect(placed.status).toBe(201); expect(await UsedCouponModel.countDocuments()).toBe(1);
    await mongoose.connection.db.collection('future_test_collection').insertOne({ synthetic: true });
    const second = await db.reset();
    expect(second).toEqual(first);
    expect(await ProductModel.find().sort({ id: 1 }).lean()).toEqual(before);
    expect(await OrderModel.countDocuments()).toBe(2); expect(await UsedCouponModel.countDocuments()).toBe(0);
    expect(await mongoose.connection.db.collection('future_test_collection').countDocuments()).toBe(0);
    expect((await TryonSessionModel.findOne()).createdAt.getTime()).toBeGreaterThan(Date.now() - 60000);
  });
  test('clear keeps ownership marker and indexes, then seed works again', async () => {
    const db = global.qaTestDatabase; await db.reset(); await db.clear();
    expect(await UserModel.countDocuments()).toBe(0);
    expect(await mongoose.connection.db.collection('_qa_owner').countDocuments()).toBe(1);
    const indexes = await UsedCouponModel.collection.indexes();
    expect(indexes.some(i => i.unique && i.key.userId === 1 && i.key.couponCode === 1)).toBe(true);
    await db.reset(); expect(await UserModel.countDocuments()).toBe(3);
  });
  test('fake handle, direct seed and external URI config are refused', async () => {
    await expect(clear({})).rejects.toThrow('Not an owned');
    await expect(seed({})).rejects.toThrow('Not an owned');
    expect(() => configuration({ QA_MONGODB_URI: 'mongodb://127.0.0.1:27018/vfitai' })).toThrow('External');
    await expect(createOwnedDatabase()).rejects.toThrow('existing database');
  });
  test('NODE_ENV production cannot reset even with a real handle', async () => {
    const db = global.qaTestDatabase; await db.reset(); process.env.NODE_ENV = 'production';
    try { await expect(db.clear()).rejects.toThrow('Not an owned'); }
    finally { process.env.NODE_ENV = 'test'; }
    expect(await UserModel.countDocuments()).toBe(3);
  });
  test('tampered ownership marker fails before deletion', async () => {
    const db = global.qaTestDatabase; await db.reset();
    const collection = mongoose.connection.db.collection('_qa_owner'); const marker = await collection.findOne({});
    await collection.updateOne({}, { $set: { ownerHash: 'tampered' } });
    try { await expect(db.clear()).rejects.toThrow('marker mismatch'); expect(await UserModel.countDocuments()).toBe(3); }
    finally { await collection.updateOne({}, { $set: { ownerHash: marker.ownerHash } }); }
  });
  test('health endpoints expose readiness without database URI or account secrets', async () => {
    const db = global.qaTestDatabase; process.env.QA_RUN_ID = db.runId;
    try {
      expect((await request(app).get('/api/health/live')).status).toBe(200);
      expect((await request(app).get('/api/health/ready')).status).toBe(503);
      await db.reset(); const ready = await request(app).get('/api/health/ready');
      expect(ready.status).toBe(200); expect(ready.body.runId).toBe(db.runId);
      expect(JSON.stringify(ready.body)).not.toContain('mongodb://'); expect(ready.body).not.toHaveProperty('accounts');
      await db.clear(); expect((await request(app).get('/api/health/ready')).status).toBe(503);
    } finally { delete process.env.QA_RUN_ID; }
  });
  test.each([{ QA_HOST: '0.0.0.0' }, { QA_API_PORT: '0' }, { QA_API_PORT: '3300', QA_UI_PORT: '3300' }, { QA_RUN_ID: '../dev' }])('unsafe config %j is refused', input => {
    expect(() => configuration(input)).toThrow();
  });
});
