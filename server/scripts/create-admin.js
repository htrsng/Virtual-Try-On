// Explicit local operation. Credentials come from environment, never CLI arguments/logs.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGODB_URI } = require('../config/env');
const { UserModel } = require('../models');
const { email, password } = require('../validation');
async function main() {
  if (!MONGODB_URI || !email(process.env.ADMIN_EMAIL) || !password(process.env.ADMIN_PASSWORD)) {
    throw new Error('Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters, at most 72 bytes) explicitly');
  }
  await mongoose.connect(MONGODB_URI);
  const normalized = process.env.ADMIN_EMAIL.trim().toLowerCase();
  // Do not silently promote an existing account or replace its password.
  if (await UserModel.exists({ email: normalized })) throw new Error('Account already exists; no changes made');
  await UserModel.create({ email: normalized, password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: 'admin', fullName: 'Administrator' });
  console.log('Admin account created. No credentials are printed.');
}
main().catch(() => { console.error('Admin creation failed. Check configuration and account existence.'); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
