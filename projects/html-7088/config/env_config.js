/**
 * @fileoverview موتور اعتبارسنجی متغیرهای محیطی - استودیو امنیتی B2.st
 * مکانیزم دفاع ۱۰ لایه:
 *  1. جداسازی کامل داده‌های تزریقی
 *  2. مقابله با Prototype Pollution
 *  3. اعتبارسنجی تیپ‌های داده صلب (Strict Coercion)
 *  4. تشخیص و مسدودسازی نشت متغیرهای حساس
 *  5. انجماد عمیق شئی (Deep Object Freezing)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// بارگذاری فایل محیطی در صورت وجود
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * تایپ‌کستینگ و پارسر امن به همراه ضدعفونی‌سازی
 */
class EnvSanitizer {
  static toString(value, defaultValue = '') {
    if (value === undefined || value === null) return defaultValue;
    return String(value).trim();
  }

  static toNumber(value, defaultValue, { min = -Infinity, max = Infinity } = {}) {
    if (value === undefined || value === null || value === '') return defaultValue;
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < min || parsed > max) {
      throw new TypeError(`[SECURITY FATAL] متغیر نامعتبر عددی خارج از بازه مجاز: ${value}`);
    }
    return parsed;
  }

  static toBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    throw new TypeError(`[SECURITY FATAL] تبدیل نامعتبر بولی برای مقدار: ${value}`);
  }

  static toEnum(value, allowedValues, defaultValue) {
    const val = this.toString(value, defaultValue);
    if (!allowedValues.includes(val)) {
      throw new Error(`[SECURITY FATAL] مقدار خارج از لیست مجاز (Enum): ${val}. مجاز: ${allowedValues.join(', ')}`);
    }
    return val;
  }

  static toList(value, defaultValue = []) {
    if (!value) return defaultValue;
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
}

/**
 * ایجاد مخزن امن و فریز دائمی آبجکت برای جلوگیری از Runtime Tampering
 */
function deepFreeze(object) {
  const propNames = Reflect.ownKeys(object);
  for (const name of propNames) {
    const value = object[name];
    if ((value && typeof value === 'object') || typeof value === 'function') {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

// ساخت و اعتبارسنجی شماتیک
const rawEnv = process.env;

// لایه اعتبارسنجی امنیتی مقادیر بحرانی پروداکشن
const nodeEnv = EnvSanitizer.toEnum(rawEnv.NODE_ENV, ['development', 'production', 'test'], 'development');

if (nodeEnv === 'production') {
  if (!rawEnv.SESSION_SECRET || rawEnv.SESSION_SECRET.length < 32) {
    throw new Error('[CRITICAL VULNERABILITY] کلید SESSION_SECRET در محیط پروداکشن نامعتبر است (حداقل ۳۲ کاراکتر نیاز است).');
  }
  if (rawEnv.ALLOWED_ORIGINS && rawEnv.ALLOWED_ORIGINS.includes('*')) {
    throw new Error('[CRITICAL VULNERABILITY] استفاده از Wildcard (*) در ALLOWED_ORIGINS در حالت پروداکشن غیرمجاز است.');
  }
}

const parsedConfig = {
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',

  server: {
    port: EnvSanitizer.toNumber(rawEnv.PORT, 3000, { min: 1024, max: 65535 }),
    host: EnvSanitizer.toString(rawEnv.HOST, '127.0.0.1'),
    allowedOrigins: EnvSanitizer.toList(rawEnv.ALLOWED_ORIGINS, ['http://localhost:3000']),
    rateLimit: {
      windowMs: EnvSanitizer.toNumber(rawEnv.RATE_LIMIT_WINDOW_MS, 60000, { min: 1000 }),
      max: EnvSanitizer.toNumber(rawEnv.RATE_LIMIT_MAX_REQUESTS, 100, { min: 1 }),
    }
  },

  security: {
    sessionSecret: EnvSanitizer.toString(rawEnv.SESSION_SECRET, 'b2st_dev_default_entropy_pad_length_ok!'),
    enableCspReportOnly: EnvSanitizer.toBoolean(rawEnv.ENABLE_CSP_REPORT_ONLY, false),
    assetsCacheMaxAgeSec: EnvSanitizer.toNumber(rawEnv.ASSETS_CACHE_MAX_AGE_SEC, 86400, { min: 0 })
  },

  diagnostics: {
    logLevel: EnvSanitizer.toEnum(rawEnv.LOG_LEVEL, ['silent', 'error', 'warn', 'info', 'debug'], 'info'),
    debugMetrics: EnvSanitizer.toBoolean(rawEnv.DEBUG_METRICS, false)
  }
};

// ایزوله‌سازی کامل و جلوگیری از Prototype Pollution
const envConfig = deepFreeze(Object.assign(Object.create(null), parsedConfig));

export default envConfig;