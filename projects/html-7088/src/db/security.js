/**
 * @file security.js
 * @description ماژول امنیتی برای اعتبارسنجی، تولید امضای دیجیتال و جلوگیری از تقلب و دستکاری داده‌ها (Anti-Tamper)
 */

import { DATABASE_CONFIG } from '../../config/database.config.js';

export class DatabaseSecurity {
  /**
   * محاسبه هش رمزنگاری‌شده بر پایه SHA-256 با استفاده از Web Crypto API
   * @param {Object} payload داده‌های مورد ارزیابی
   * @param {string} salt نمک امنیتی
   * @returns {Promise<string>} هش هگزادسیمال داده
   */
  static async generateHash(payload, salt = DATABASE_CONFIG.SECURITY.INTEGRITY_SALT) {
    try {
      // حذف امضاهای قبلی جهت محاسبه خالص هش
      const sanitized = { ...payload };
      delete sanitized._checksum;
      delete sanitized._signature;

      // مرتب‌سازی کلیدها برای تضمین جبرگرایی (Determinism)
      const sortedKeys = Object.keys(sanitized).sort();
      const canonicalString = sortedKeys.map(k => `${k}:${JSON.stringify(sanitized[k])}`).join('|');
      const inputBuffer = new TextEncoder().encode(canonicalString + '|' + salt);

      const cryptoSubtle = globalThis.crypto?.subtle;
      if (!cryptoSubtle) {
        // فال‌بک نرم‌افزاری استاندارد (DJB2-XOR) در صورت عدم پشتیبانی Web Crypto در محیط‌های ایزوله
        return this._softwareHashFallback(canonicalString + salt);
      }

      const hashBuffer = await cryptoSubtle.digest(
        DATABASE_CONFIG.SECURITY.HASH_ALGORITHM,
        inputBuffer
      );

      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('[DatabaseSecurity] Hash generation failed:', error);
      throw new Error(`Security hashing failure: ${error.message}`);
    }
  }

  /**
   * الصاق امضای امنیتی و زمان ثبت رکورد
   * @param {Object} record رکورد خام
   * @returns {Promise<Object>} رکورد محافظت‌شده با امضا
   */
  static async sealRecord(record) {
    if (!DATABASE_CONFIG.SECURITY.ENABLE_TAMPER_PROTECTION) {
      return { ...record, _timestamp: Date.now() };
    }

    const timestampedRecord = {
      ...record,
      _timestamp: Date.now()
    };

    const checksum = await this.generateHash(timestampedRecord);
    return {
      ...timestampedRecord,
      _checksum: checksum
    };
  }

  /**
   * اعتبارسنجی اصالت رکورد و عدم دستکاری در DevTools یا لایه Storage
   * @param {Object} record رکورد بازیابی شده از دیتابیس
   * @returns {Promise<boolean>} تایید یا عدم تایید سلامت رکورد
   */
  static async verifyRecordIntegrity(record) {
    if (!DATABASE_CONFIG.SECURITY.ENABLE_TAMPER_PROTECTION) {
      return true;
    }

    if (!record || typeof record !== 'object') {
      return false;
    }

    if (!record._checksum) {
      return false; // رکوردهای بدون امضا مشکوک به تزریق دستی هستند
    }

    const calculatedHash = await this.generateHash(record);
    return calculatedHash === record._checksum;
  }

  /**
   * پالایش و ضدعفونی رشته‌ها برای جلوگیری از حملات XSS و اسکریپت‌های تزریقی
   * @param {string} input ورودی متنی
   * @returns {string} متن پالایش شده
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>'"&]/g, (char) => {
        switch (char) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case "'": return '&#39;';
          case '"': return '&quot;';
          case '&': return '&amp;';
          default: return char;
        }
      })
      .slice(0, 32); // محدودسازی طول نام کاراکتر به استاندارد ۳۲ کاراکتری NES
  }

  /**
   * فال‌بک نرم‌افزاری پایدار برای تولید کد هش ۶۴ بیتی
   * @private
   */
  static _softwareHashFallback(str) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c64e6d;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  }
}