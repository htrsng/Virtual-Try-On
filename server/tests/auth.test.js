const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../index');
const { UserModel } = require('../models');
describe('Authentication API contract', () => {
  const user = { email: 'qa-auth@example.test', password: 'Fixture123!', fullName: 'QA' };
  test('registration hashes password, returns safe user and usable token', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201); expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.role).toBe('user'); expect(res.body.user).not.toHaveProperty('password');
    const stored = await UserModel.findOne({ email: user.email }).select('+password');
    expect(await bcrypt.compare(user.password, stored.password)).toBe(true); expect(stored.password).not.toBe(user.password);
    expect((await request(app).get('/api/auth/me').auth(res.body.token, { type: 'bearer' })).status).toBe(200);
  });
  test('duplicate normalized email is conflict', async () => {
    await request(app).post('/api/auth/register').send(user);
    expect((await request(app).post('/api/auth/register').send({ ...user, email: user.email.toUpperCase() })).status).toBe(409);
  });
  test('valid login uses normalized email and returns safe profile', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/login').send({ email: user.email.toUpperCase(), password: user.password });
    expect(res.status).toBe(200); expect(typeof res.body.token).toBe('string'); expect(res.body.user).not.toHaveProperty('password');
  });
  test('wrong password and missing account use identical 401 contract', async () => {
    await request(app).post('/api/auth/register').send(user);
    const wrong = await request(app).post('/api/auth/login').send({ email: user.email, password: 'incorrect' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'unknown@example.test', password: 'incorrect' });
    expect(wrong.status).toBe(401); expect(unknown.status).toBe(401); expect(wrong.body).toEqual(unknown.body);
  });
  test.each([{ email: { $ne: null }, password: 'Fixture123!' }, { ...user, password: '123' }, { ...user, role: 'admin' }, { ...user, email: 'bad' }])('invalid registration %j', async body => {
    expect((await request(app).post('/api/auth/register').send(body)).status).toBe(400);
    expect(await UserModel.countDocuments()).toBe(0);
  });
});
