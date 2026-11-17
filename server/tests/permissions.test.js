const request = require('supertest');
const app = require('../index');
const { actor, product } = require('./helpers');
const { UserModel, BannerContentModel } = require('../models');
// Independent contract list: no reflection over the middleware being tested.
const adminRoutes = [
  ['get', '/api/users'], ['get', '/api/users/:id'], ['put', '/api/users/:id'], ['delete', '/api/users/:id'],
  ['get', '/api/users/:id/orders'], ['get', '/api/users/:id/used-coupons'], ['get', '/api/users/:id/stats'],
  ['get', '/api/coupons/GIAM10/users'], ['get', '/api/orders'], ['put', '/api/orders/:id'], ['delete', '/api/orders/:id'],
  ['post', '/api/products'], ['put', '/api/products/101'], ['delete', '/api/products/101'], ['get', '/api/products/next-id'],
  ['post', '/api/banner-contents'], ['put', '/api/banner-contents/qa'], ['delete', '/api/banner-contents/qa'],
  ['post', '/api/admin/products/normalize-ids'], ['post', '/api/admin/migrate-products'], ['get', '/api/admin/ai-stats'],
  ['get', '/api/admin/chat/conversations'], ['get', '/api/admin/chat/messages/:id'], ['post', '/api/admin/chat/reply'],
  ['get', '/api/admin/sync-status'], ['get', '/api/admin/get-all-data'], ['post', '/api/admin/check-sync'],
];
describe('Admin permission matrix: anonymous/user denial', () => {
  test.each(adminRoutes)('%s %s rejects unauthenticated and ordinary users', async (method, route) => {
    const user = await actor(); const url = route.replace(':id', String(user.user._id));
    expect((await request(app)[method](url).send({})).status).toBe(401);
    expect((await request(app)[method](url).auth(user.token, { type: 'bearer' }).send({})).status).toBe(403);
    expect(await UserModel.countDocuments()).toBe(1);
  });
  test('authorized admin can manage users, catalog and banners', async () => {
    const admin = await actor('admin'); const user = await actor();
    const call = (method, url, data) => request(app)[method](url).auth(admin.token, { type: 'bearer' }).send(data);
    expect((await call('get', '/api/users')).status).toBe(200);
    expect((await call('put', `/api/users/${user.user._id}`, { role: 'admin' })).status).toBe(200);
    expect((await UserModel.findById(user.user._id)).role).toBe('admin');
    expect((await call('delete', `/api/users/${user.user._id}`)).status).toBe(200);
    expect((await call('post', '/api/products', { id: 101, name: 'QA', price: 100, stock: 4 })).status).toBe(201);
    expect((await call('put', '/api/products/101', { price: 200 })).status).toBe(200);
    expect((await call('get', '/api/products/next-id')).body.nextId).toBe(102);
    expect((await call('delete', '/api/products/101')).status).toBe(200);
    expect((await call('post', '/api/banner-contents', { bannerId: 'qa', title: 'QA', content: 'QA' })).status).toBe(200);
    expect((await call('put', '/api/banner-contents/qa', { title: 'Updated' })).status).toBe(200);
    expect((await call('delete', '/api/banner-contents/qa')).status).toBe(200);
    expect(await BannerContentModel.countDocuments()).toBe(0);
  });
  test('admin reporting/migration routes accept a valid current admin', async () => {
    const { token, user } = await actor('admin'); await product();
    for (const [method, route] of adminRoutes.filter(([method, path]) => path.startsWith('/api/admin') && !path.includes('/reply') || method === 'get' && path.startsWith('/api/users/:id'))) {
      const res = await request(app)[method](route.replace(':id', String(user._id))).auth(token, { type: 'bearer' }).send({});
      expect({ route, status: res.status }).toEqual({ route, status: 200 });
    }
    const reply = await request(app).post('/api/admin/chat/reply').auth(token, { type: 'bearer' }).send({ userId: String(user._id), message: 'QA reply' });
    expect(reply.status).toBe(200); expect(reply.body.sender).toBe('admin');
  });
});
