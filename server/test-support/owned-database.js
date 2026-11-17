const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { randomUUID, randomBytes, createHash } = require('node:crypto');
const owned = new WeakMap();
let creating = false;
const digest = value => createHash('sha256').update(value).digest('hex');

async function assertOwned(handle) {
  const state = owned.get(handle);
  if (!state || process.env.NODE_ENV !== 'test') throw new Error('Not an owned test database');
  if (mongoose.connection.readyState !== 1 || mongoose.connection.name !== state.name
    || mongoose.connection.getClient() !== state.client || !state.name.startsWith('vfitai_test_')) throw new Error('Test database connection ownership mismatch');
  const marker = await mongoose.connection.db.collection('_qa_owner').findOne({ _id: state.runId });
  if (!marker || marker.ownerHash !== digest(state.capability)) throw new Error('Test database ownership marker mismatch');
  return state;
}
async function exclusive(handle, action) {
  const state = await assertOwned(handle);
  if (state.busy) throw new Error('Test data operation already in progress');
  state.busy = true;
  try { return await action(state); } finally { state.busy = false; }
}
async function clearCollections(state) {
  const db = mongoose.connection.db;
  await db.collection('_qa_owner').updateOne({ _id: state.runId }, { $set: { state: 'empty' } });
  for (const collection of await db.listCollections({}, { nameOnly: true }).toArray()) {
    if (collection.name !== '_qa_owner' && !collection.name.startsWith('system.')) await db.collection(collection.name).deleteMany({});
  }
}
async function clear(handle) { return exclusive(handle, async state => { await clearCollections(state); return { state: 'empty' }; }); }
async function reset(handle) {
  return exclusive(handle, async state => {
    await clearCollections(state);
    const fixture = await require('./seed').seed(handle);
    await mongoose.connection.db.collection('_qa_owner').updateOne({ _id: state.runId }, { $set: { state: 'ready' } });
    return fixture;
  });
}
async function createOwnedDatabase({ runId = randomUUID().replaceAll('-', '') } = {}) {
  if (process.env.NODE_ENV !== 'test') throw new Error('NODE_ENV=test is required');
  if (!/^[a-z0-9_-]{1,40}$/.test(runId)) throw new Error('Invalid test run id');
  if (creating || mongoose.connection.readyState !== 0) throw new Error('Refusing to replace an existing database connection');
  creating = true;
  let mongo;
  try { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } }); }
  catch (error) { creating = false; throw error; }
  const name = `vfitai_test_${runId}_${randomBytes(4).toString('hex')}`;
  const uri = mongo.getUri(name);
  const handle = {};
  try {
    await mongoose.connect(uri);
    require('../models');
    await Promise.all(Object.values(mongoose.models).map(Model => Model.init()));
    const capability = randomBytes(32).toString('hex');
    const credentials = Object.fromEntries(['admin', 'customer', 'other'].map(role => [role, {
      email: `${role}+${runId}@example.test`, password: randomBytes(18).toString('base64url'),
    }]));
    owned.set(handle, { name, runId, client: mongoose.connection.getClient(), capability, credentials, busy: false });
    await mongoose.connection.db.collection('_qa_owner').insertOne({ _id: runId, ownerHash: digest(capability), state: 'empty' });
    Object.assign(handle, { uri, name, runId, credentials,
      reset: () => reset(handle), clear: () => clear(handle),
      close: async () => {
        const state = owned.get(handle); if (!state) return;
        // Never disconnect a foreign connection, even if a caller tampered with our marker.
        try { if (mongoose.connection.getClient() === state.client) await mongoose.disconnect(); }
        finally { owned.delete(handle); await mongo.stop(); }
      } });
    return handle;
  } catch (error) { await mongoose.disconnect(); await mongo.stop(); throw error; }
  finally { creating = false; }
}
module.exports = { createOwnedDatabase, assertOwned, clear, reset };
