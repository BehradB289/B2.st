/**
 * @file env_config.js
 * @layer Studio B2.st Cyber Security Division - Layer 10 Config Validator
 * @description اعتبارسنجی قطعی، ایمن‌سازی ضد نشت و انجماد عمیق متغیرهای محیطی
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// حل مسیرهای مطلق ماژولار در محیط ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// بارگذاری فایل .env از ریشه پروژه
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * متد انجماد بازگشتی برای جلوگیری از حملات Prototype Pollution و دستکاری زمان اجرا
 * @param {Object} obj 
 * @returns {Readonly<Object>}
 */
function deepFreeze(obj) {
  Object.keys(obj).forEach((prop) => {
    if (
      typeof obj[prop] === 'object' &&
      obj[prop] !== null &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
}

/**
 * پاک‌سازی و اعتبارسنجی مقادیر عددی
 * @param {string|undefined} val 
 * @param {number} fallback 
 * @returns {number}
 */
function parseSafeInt(val, fallback) {
  if (!val) return fallback;
  const parsed = Number.parseInt(val, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * اعتبارسنجی مقادیر بولی
 * @param {string|undefined} val 
 * @param {boolean} fallback 
 * @returns {boolean}
 */
function parseSafeBool(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  const normalized = String(val).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return fallback;
}

/**
 * استخراج محیط اجرا با ارزیابی لیست سفید
 * @param {string|undefined} env 
 * @returns {'development'|'production'|'test'}
 */
function parseSafeEnv(env) {
  const allowedEnvs = ['development', 'production', 'test'];
  const currentEnv = String(env || '').trim().toLowerCase();
  return allowedEnvs.includes(currentEnv) ? currentEnv : 'development';
}

/**
 * تجزیه لیست دامنه‌های مجاز (CORS / Safe Origin)
 * @param {string|undefined} originsStr 
 * @returns {string[]}
 */
function parseAllowedOrigins(originsStr) {
  if (!originsStr) return ['http://127.0.0.1:3000', 'http://localhost:3000'];
  return originsStr
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => {
      try {
        const parsedUrl = new URL(origin);
        return Boolean(parsedUrl.protocol && parsedUrl.host);
      } catch {
        return false;
      }
    });
}

// ساخت و اعتبارسنجی شی پیکربندی پایه
const rawConfig = {
  env: parseSafeEnv(process.env.NODE_ENV),
  isProduction: parseSafeEnv(process.env.NODE_ENV) === 'production',
  isDevelopment: parseSafeEnv(process.env.NODE_ENV) === 'development',
  server: {
    host: process.env.HOST ? String(process.env.HOST).trim() : '127.0.0.1',
    port: parseSafeInt(process.env.PORT, 3000),
    assetsDir: process.env.STATIC_ASSETS_DIR ? String(process.env.STATIC_ASSETS_DIR).trim() : 'public'
  },
  security: {
    allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
    cspReportOnly: parseSafeBool(process.env.ENABLE_CSP_REPORT_ONLY, false),
    rateLimit: {
      windowMs: parseSafeInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      max: parseSafeInt(process.env.RATE_LIMIT_MAX_REQUESTS, 100)
    }
  },
  game: {
    enableTelemetry: parseSafeBool(process.env.ENABLE_GAME_TELEMETRY, false),
    debugCollision: parseSafeBool(process.env.DEBUG_COLLISION_BOXES, false)
  }
};

// مسدودسازی هرگونه تغییر ساختاری در پیکربندی (Immutability Enforcement)
export const Config = deepFreeze(rawConfig);
export default Config;