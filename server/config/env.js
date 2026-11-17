const fs = require("fs");
const path = require("path");

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

// Tests never inherit a development database or external service credentials.
if (process.env.NODE_ENV !== 'test') loadEnvFile(path.join(__dirname, "..", ".env"));

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32 || ['your-secret-key-change-this-in-production', 'replace-with-a-long-random-secret'].includes(secret)) {
    throw new Error('JWT_SECRET must be explicitly configured with at least 32 characters');
}

module.exports = {
    JWT_SECRET: secret,
    MONGODB_URI: process.env.MONGODB_URI,
    EMAIL_USER: process.env.EMAIL_USER || "",
    EMAIL_PASS: process.env.EMAIL_PASS || "",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};
