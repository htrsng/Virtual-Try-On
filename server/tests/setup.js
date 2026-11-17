const mongoose = require("mongoose");
const { createOwnedDatabase } = require('../test-support/owned-database');

let database;

beforeAll(async () => {
  database = await createOwnedDatabase();
  global.qaTestDatabase = database;
}, 60000);

afterAll(async () => {
  if (database) await database.close();
  delete global.qaTestDatabase;
}, 30000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1 && database) await database.clear();
}, 15000);
