const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const loadEnvFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    const envFile = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of envFile.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && process.env[key] === undefined) process.env[key] = val;
    }
};

loadEnvFile(path.join(__dirname, '..', '.env'));

const MONGODB_URI = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;
const TARGET_DB_NAME = process.env.TARGET_DB_NAME || 'vfitai-db';

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI or TARGET_MONGODB_URI in environment');
    process.exit(2);
}

(async () => {
    try {
        const conn = await mongoose.createConnection(MONGODB_URI, { dbName: TARGET_DB_NAME }).asPromise();
        const db = conn.db;
        const usersColl = db.collection('users');
        const count = await usersColl.countDocuments();
        console.log('Users count:', count);
        if (count > 0) {
            const sample = await usersColl.find({}, { projection: { email: 1, role: 1, fullName: 1 } }).limit(50).toArray();
            console.table(sample.map(u => ({ email: u.email, role: u.role, fullName: u.fullName })));
        } else {
            console.log('No users found in database.');
        }
        await conn.close();
    } catch (err) {
        console.error('Error checking users:', err.message || err);
        process.exitCode = 1;
    }
})();
