```js
/**
 * ─── LinkBox Configuration ───
 * Merges config/default.json with environment variables.
 * ENV vars always take priority.
 */

const path = require('path');
const fs = require('fs');

// Load .env file if present
require('dotenv').config();

// Load default config file
const defaultConfigPath = path.join(__dirname, '..', 'config', 'default.json');
let fileConfig = {};
if (fs.existsSync(defaultConfigPath)) {
  fileConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf-8'));
}

const config = {
  port: parseInt(process.env.PORT, 10) || fileConfig.port || 3000,
  jwtSecret: process.env.JWT_SECRET || fileConfig.jwtSecret || 'linkbox-dev-secret',
  tokenExpiry: process.env.TOKEN_EXPIRY || fileConfig.tokenExpiry || '7d',
  dbPath: process.env.DB_PATH || fileConfig.dbPath || './data/linkbox.db',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || fileConfig.bcryptRounds || 10,
  shortCodeLength: fileConfig.shortCodeLength || 7,
  rateLimit: {
    windowMs: fileConfig.rateLimit?.windowMs || 60000,
    max: fileConfig.rateLimit?.max || 60,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Warn if using default secret in production
if (config.nodeEnv === 'production' && config.jwtSecret.includes('dev-secret')) {
  console.error('⚠️  WARNING: Using default JWT secret in production! Set JWT_SECRET env var.');
}

module.exports = config;
```