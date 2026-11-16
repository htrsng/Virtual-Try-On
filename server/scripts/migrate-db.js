const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const envFile = fs.readFileSync(filePath, "utf8");
  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^['\"]|['\"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(path.join(__dirname, "..", ".env"));

const SOURCE_URI = process.env.SOURCE_MONGODB_URI;
const TARGET_URI = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;
const SOURCE_DB_NAME = process.env.SOURCE_DB_NAME;
const TARGET_DB_NAME = process.env.TARGET_DB_NAME;
const RESET_TARGET = String(process.env.RESET_TARGET || "true").toLowerCase() !== "false";

const connect = async (uri, dbName) => {
  if (!uri) {
    throw new Error("Thiếu MongoDB URI");
  }

  return mongoose.createConnection(uri, dbName ? { dbName } : {}).asPromise();
};

const cloneIndexes = async (sourceCollection, targetCollection) => {
  const indexes = await sourceCollection.indexes();
  const extraIndexes = indexes.filter((index) => index.name !== "_id_");

  if (extraIndexes.length === 0) {
    return;
  }

  const indexSpecs = extraIndexes.map((index) => {
    const spec = {
      key: index.key,
      name: index.name,
    };

    for (const optionName of ["unique", "sparse", "expireAfterSeconds", "background", "collation", "partialFilterExpression", "weights", "default_language", "language_override", "textIndexVersion", "2dsphereIndexVersion", "bits", "min", "max", "bucketSize", "storageEngine", "wildcardProjection"]) {
      const value = index[optionName];
      if (value !== undefined && value !== null) {
        spec[optionName] = value;
      }
    }

    return spec;
  });

  await targetCollection.createIndexes(indexSpecs);
};

const copyCollection = async (sourceDb, targetDb, collectionName) => {
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);

  const documents = await sourceCollection.find({}).toArray();

  if (RESET_TARGET) {
    const existingCollections = await targetDb.listCollections({ name: collectionName }).toArray();
    if (existingCollections.length > 0) {
      await targetCollection.drop();
    }
  }

  if (documents.length > 0) {
    await targetCollection.insertMany(documents, { ordered: false });
  }

  await cloneIndexes(sourceCollection, targetCollection);

  return {
    collectionName,
    count: documents.length,
  };
};

const main = async () => {
  if (!SOURCE_URI) {
    throw new Error("Thiếu SOURCE_MONGODB_URI");
  }

  if (!TARGET_URI) {
    throw new Error("Thiếu TARGET_MONGODB_URI hoặc MONGODB_URI");
  }

  const sourceConn = await connect(SOURCE_URI, SOURCE_DB_NAME);
  const targetConn = await connect(TARGET_URI, TARGET_DB_NAME);

  try {
    const sourceDb = sourceConn.db;
    const targetDb = targetConn.db;
    const collections = await sourceDb.listCollections().toArray();
    const names = collections
      .map((item) => item.name)
      .filter((name) => !name.startsWith("system."));

    if (!names.length) {
      console.log("Không có collection nào để copy.");
      return;
    }

    const summary = [];
    for (const collectionName of names) {
      const result = await copyCollection(sourceDb, targetDb, collectionName);
      summary.push(result);
      console.log(`✅ Copied ${result.count} docs from ${collectionName}`);
    }

    console.log("\nMigration completed:");
    for (const item of summary) {
      console.log(`- ${item.collectionName}: ${item.count} documents`);
    }
  } finally {
    await sourceConn.close();
    await targetConn.close();
  }
};

main().catch((error) => {
  console.error("❌ Database migration failed:", error.message);
  process.exitCode = 1;
});