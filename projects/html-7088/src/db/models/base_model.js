/**
 * مدل پایه داده‌ها با پشتیبانی از اعتبارسنجی، امضای دیجیتال و رهگیری تغییرات
 */
(function (global) {
  'use strict';

  const Vault = typeof CryptoVault !== 'undefined' 
    ? CryptoVault 
    : (typeof require !== 'undefined' ? require('../security/crypto_vault').CryptoVault : null);

  const Config = typeof DatabaseConfig !== 'undefined'
    ? DatabaseConfig
    : (typeof require !== 'undefined' ? require('../../../config/database.config').DatabaseConfig : null);

  class BaseModel {
    constructor(data = {}) {
      this.createdAt = data.createdAt || new Date().toISOString();
      this.updatedAt = data.updatedAt || new Date().toISOString();
      this.signature = data.signature || null;
      this.isTampered = false;
    }

    /**
     * اعتبارسنجی فیلدهای مدل (باید توسط زیرکلاس‌ها بازنویسی شود)
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validate() {
      return { isValid: true, errors: [] };
    }

    /**
     * استخراج فیلدهای خالص بدون امضا
     */
    toPayload() {
      const payload = { ...this };
      delete payload.signature;
      delete payload.isTampered;
      return payload;
    }

    /**
     * امضا کردن خودکار داده با استفاده از CryptoVault
     * @param {string} [salt]
     */
    sign(salt = Config.SECURITY.SECRET_SALT) {
      this.updatedAt = new Date().toISOString();
      const payload = this.toPayload();
      this.signature = Vault.sign(payload, salt);
      return this.signature;
    }

    /**
     * بررسی تطابق امضا با محتوای فعلی آبجکت
     * @param {string} [salt]
     * @returns {boolean}
     */
    verifyIntegrity(salt = Config.SECURITY.SECRET_SALT) {
      if (!this.signature) {
        this.isTampered = true;
        return false;
      }
      const isValid = Vault.verify(this.toPayload(), this.signature, salt);
      this.isTampered = !isValid;
      return isValid;
    }

    /**
     * تبدیل ایمن به شیء خالص برای ثبت در استور دیتابیس
     */
    serialize() {
      const res = { ...this };
      return JSON.parse(JSON.stringify(res));
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseModel };
  } else {
    global.BaseModel = BaseModel;
  }
})(typeof window !== 'undefined' ? window : globalThis);