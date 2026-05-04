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

loadEnvFile(path.join(__dirname, "..", ".env"));

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
    MONGODB_URI: process.env.MONGODB_URI,
    EMAIL_USER: process.env.EMAIL_USER || "thanhtb2005@gmail.com",
    EMAIL_PASS: process.env.EMAIL_PASS || "xndu nxcu wuea aizn",
};