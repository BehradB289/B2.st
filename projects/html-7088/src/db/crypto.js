/**
 * لایه امنیتی، امضای دیجیتال و جلوگیری از تقلب (Anti-Tamper & Cryptography)
 * @module src/db/crypto
 */

import { DATABASE_CONFIG } from '../../config/database_config.js';

export class CryptoSecurity {
  /**
   * تولید هش امنیتی بر اساس داده و کلید امنیتی استودیو
   * @param {Object|string} data 
   * @param {string} [salt=DATABASE_CONFIG.INTEGRITY_SALT]
   * @returns {Promise<string>}
   */
  static async generateChecksum(data, salt = DATABASE_CONFIG.INTEGRITY_SALT) {
    const rawPayload = typeof data === 'string' ? data : JSON.stringify(this._normalizeData(data));
    const combined = `${salt}:${rawPayload}:${salt}`;
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(combined);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        return this._fallbackHash(combined);
      }
    }
    return this._fallbackHash(combined);
  }

  /**
   * صحت‌سنجی یکپارچگی داده و عدم دستکاری در کلاینت
   * @param {Object} record 
   * @param {string} signatureKey 
   * @returns {Promise<boolean>}
   */
  static async verifyRecordIntegrity(record, signatureKey = 'checksum') {
    if (!record || typeof record !== 'object') return false;
    const originalChecksum = record[signatureKey];
    if (!originalChecksum) return false;

    const payloadToVerify = { ...record };
    delete payloadToVerify[signatureKey];

    const recalculatedChecksum = await this.generateChecksum(payloadToVerify);
    return recalculatedChecksum === originalChecksum;
  }

  /**
   * امضاگذاری روی یک رکورد پیش از ذخیره‌سازی
   * @param {Object} record 
   * @param {string} signatureKey 
   * @returns {Promise<Object>}
   */
  static async signRecord(record, signatureKey = 'checksum') {
    const payload = { ...record };
    delete payload[signatureKey];
    const checksum = await this.generateChecksum(payload);
    return {
      ...payload,
      [signatureKey]: checksum
    };
  }

  /**
   * مرتب‌سازی و نرمال‌سازی کلیدهای آبجکت جهت ایجاد دترمینیسم در هش
   * @private
   */
  static _normalizeData(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this._normalizeData(item));
    }
    const sortedKeys = Object.keys(obj).sort();
    const normalized = {};
    for (const key of sortedKeys) {
      normalized[key] = this._normalizeData(obj[key]);
    }
    return normalized;
  }

  /**
   * پیاده‌سازی پشتیبان FNV-1a 64-bit در صورت عدم دسترسی به SubtleCrypto
   * @private
   */
  static _fallbackHash(str) {
    let h1 = 0x811c9dc5;
    let h2 = 0xcbf29ce4;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 ^= ch;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= ch;
      h2 = Math.imul(h2, 0x000001b3);
    }
    const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return `${hex1}${hex2}`;
  }
}