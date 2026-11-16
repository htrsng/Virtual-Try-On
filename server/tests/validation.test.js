const request = require('supertest');
const app = require('../index');
const { actor } = require('./helpers');
const { ProductModel, ViewHistoryModel, NotificationModel, SavedOutfitModel, ReviewModel } = require('../models');
describe('Validation and predictable errors', () => {
  test.each([{ name: '', price: 1 }, { name: 'QA', price: -1 }, { name: 'QA', price: '100' },
    { name: 'QA', price: 100, stock: -2 }, { name: 'QA', price: 100, $set: { role: 'admin' } },
    { name: 'QA', price: 100, variants: [{ color: { name: 'Red' }, sizes: [{ size: 'M', stock: -1 }] }] }])('invalid admin product %j changes nothing', async body => {
    const { token } = await actor('admin');
    for (const url of ['/api/products', '/api/products/', '/API/PRODUCTS']) {
      expect((await request(app).post(url).auth(token, { type: 'bearer' }).send(body)).status).toBe(400);
    }
    expect(await ProductModel.countDocuments()).toBe(0);
  });
  test('malformed and oversized JSON return bounded client errors', async () => {
    expect((await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{')).status).toBe(400);
    expect((await request(app).post('/api/auth/register').send({ data: 'x'.repeat(110000) })).status).toBe(413);
  });
  test.each(['limit=0', 'limit=-1', 'limit=abc', 'limit=1000', 'category[$ne]=x', 'limit=1&limit=2'])('invalid recommendation query %s', async query => {
    expect((await request(app).get(`/api/recommendations?${query}`)).status).toBe(400);
  });
  test('valid reviews remain publicly readable by numeric productId', async () => {
    const { user } = await actor();
    await ReviewModel.create({ productId: 101, userId: user._id, userName: 'QA', rating: 4 });
    const res = await request(app).get('/api/reviews/101'); expect(res.status).toBe(200); expect(res.body.avgRating).toBe(4);
    expect(res.body.reviews[0]).not.toHaveProperty('userId');
    const liked = await request(app).post(`/api/reviews/${res.body.reviews[0]._id}/like`).send({});
    expect(liked.status).toBe(200); expect(liked.body.likes).toBe(1); expect(liked.body).not.toHaveProperty('userId');
  });
  test('view history uses authenticated owner rather than submitted userId', async () => {
    const owner = await actor(); const other = await actor();
    const res = await request(app).post('/api/view-history').auth(owner.token, { type: 'bearer' }).send({ userId: String(other.user._id), productId: 101, category: 'QA' });
    expect(res.status).toBe(200); expect(await ViewHistoryModel.countDocuments({ userId: owner.user._id })).toBe(1);
    expect(await ViewHistoryModel.countDocuments({ userId: other.user._id })).toBe(0);
  });
  test('notifications and saved-outfit deletion remain owner scoped', async () => {
    const owner = await actor(); const other = await actor();
    const note = await NotificationModel.create({ userId: owner.user._id, title: 'QA', message: 'QA' });
    const outfit = await SavedOutfitModel.create({ userId: owner.user._id, name: 'QA' });
    expect((await request(app).put('/api/notifications/read').auth(other.token, { type: 'bearer' }).send({})).status).toBe(200);
    expect((await NotificationModel.findById(note._id)).isRead).toBe(false);
    expect((await request(app).delete(`/api/saved-outfits/${outfit._id}`).auth(other.token, { type: 'bearer' })).status).toBe(404);
    expect(await SavedOutfitModel.findById(outfit._id)).not.toBeNull();
  });
});
