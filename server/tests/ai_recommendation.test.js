const request = require('supertest');
const app = require('../index');
const { actor, product } = require('./helpers');
describe('Chat and recommendation API', () => {
  test('authenticated chat persists owner and returns shipping FAQ answer', async () => {
    const { token, user } = await actor();
    const res = await request(app).post('/api/chat/send').auth(token, { type: 'bearer' }).send({ message: 'hỏi về giao hàng' });
    expect(res.status).toBe(200); expect(res.body.userMessage.userId).toBe(String(user._id));
    expect(res.body.botReply.message).toContain('Nội thành: 1-2 ngày');
    const history = await request(app).get('/api/chat/history').auth(token, { type: 'bearer' });
    expect(history.status).toBe(200); expect(history.body).toHaveLength(2);
  });
  test('recommendations return catalog products within requested limit', async () => {
    const item = await product(); const res = await request(app).get('/api/recommendations?limit=2');
    expect(res.status).toBe(200); expect(res.body).toHaveLength(1); expect(res.body[0].id).toBe(item.id);
  });
});
