const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserModel, ProductModel } = require('../models');
const { JWT_SECRET } = require('../config/env');

async function actor(role = 'user') {
  const user = await UserModel.create({ email: `${role}-${new (require('mongoose').Types.ObjectId)()}@example.test`,
    password: await bcrypt.hash('Fixture123!', 4), role, fullName: 'QA fixture' });
  return { user, token: jwt.sign({ id: String(user._id), role, email: user.email }, JWT_SECRET, { expiresIn: '1h' }) };
}
async function product(overrides = {}) {
  return ProductModel.create({ id: 101, name: 'QA shirt', price: 200000, stock: 20, status: 'active', ...overrides });
}
const shippingInfo = { fullName: 'QA Fixture', phone: '0901234567', address: 'Test address' };
module.exports = { actor, product, shippingInfo };
