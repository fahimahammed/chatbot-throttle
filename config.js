import dotenv from "dotenv";
dotenv.config();

const envDefaults = {
    PORT: 3000,
    JWT_SECRET: "supersecret",
    JWT_EXPIRES_IN: "1h",
    OPENAI_API_KEY: null
};

const config = {};

for (const [key, defaultValue] of Object.entries(envDefaults)) {
    config[key] = process.env[key] || defaultValue;

    if (!process.env[key] && defaultValue !== null) {
        console.log(`⚠️ ${key} not set, using default '${defaultValue}'`);
    }

    if (!process.env[key] && defaultValue === null) {
        console.warn(`❌ ${key} is required but not set!`);
    }
}

export default config;
