jest.mock('../config/mailer', () => ({ sendMail: jest.fn().mockResolvedValue({}) }));
const request = require('supertest');
const app = require('../index');
const { actor } = require('./helpers');
const { UserModel } = require('../models');
const address = { fullName: 'Synthetic QA', phone: '0901234567', province: 'QA', district: 'QA', ward: 'QA', street: 'Synthetic address' };
const endpoint = '/api/user/addresses';
const authenticated = (method, path, token) => request(app)[method](path).auth(token, { type: 'bearer' });

describe('Address contract before route extraction', () => {
  test('anonymous calls cannot read or mutate addresses', async () => {
    expect((await request(app).get(endpoint)).status).toBe(401);
    expect((await request(app).post(endpoint).send(address)).status).toBe(401);
  });
  test('new owner starts empty and persists an address with server identity', async () => {
    const { token, user } = await actor();
    expect((await authenticated('get', endpoint, token)).body.addresses).toEqual([]);
    const result = await authenticated('post', endpoint, token).send(address);
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, address: { ...address, type: 'home', isDefault: false } });
    expect(String((await UserModel.findById(user._id)).addresses[0]._id)).toBe(result.body.address._id);
  });
  test('creating a new default clears the former default', async () => {
    const { token } = await actor();
    await authenticated('post', endpoint, token).send({ ...address, isDefault: true });
    const next = await authenticated('post', endpoint, token).send({ ...address, street: 'Second', isDefault: true });
    const result = await authenticated('get', endpoint, token);
    expect(result.body.addresses).toHaveLength(2);
    expect(result.body.addresses.filter(item => item.isDefault).map(item => item._id)).toEqual([next.body.address._id]);
  });
  test('updating preserves identity and moves default in place', async () => {
    const { token } = await actor();
    const first = await authenticated('post', endpoint, token).send(address);
    await authenticated('post', endpoint, token).send({ ...address, isDefault: true });
    const id = first.body.address._id;
    const result = await authenticated('put', `${endpoint}/${id}`, token).send({ ...address, type: 'office', isDefault: true });
    expect(result.status).toBe(200);
    expect(result.body.address).toMatchObject({ _id: id, type: 'office', isDefault: true });
    const saved = (await authenticated('get', endpoint, token)).body.addresses;
    expect(saved).toHaveLength(2);
    expect(saved.filter(item => item.isDefault).map(item => item._id)).toEqual([id]);
  });
  test('another owner cannot see or update an address', async () => {
    const owner = await actor(); const other = await actor();
    const created = await authenticated('post', endpoint, owner.token).send(address);
    expect((await authenticated('get', endpoint, other.token)).body.addresses).toEqual([]);
    expect((await authenticated('put', `${endpoint}/${created.body.address._id}`, other.token).send(address)).status).toBe(404);
    expect((await UserModel.findById(owner.user._id)).addresses[0].street).toBe(address.street);
  });
  test('invalid fields and malformed address ID are rejected without persistence', async () => {
    const { token, user } = await actor();
    expect((await authenticated('post', endpoint, token).send({ ...address, isDefault: 'true' })).status).toBe(400);
    expect((await authenticated('put', `${endpoint}/invalid`, token).send(address)).status).toBe(400);
    expect((await UserModel.findById(user._id)).addresses).toHaveLength(0);
  });
});
