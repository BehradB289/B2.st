/**
 * ماژول رمزنگاری و تایید اصالت داده‌ها (Cryptographic Vault & Anti-Tamper)
 * شامل پیاده‌سازی مستقل HMAC-SHA256 جهت امضای دیجیتال و شناسایی دستکاری فایل‌های ذخیره و امتیازات.
 */
(function (global) {
  'use strict';

  class CryptoVault {
    /**
     * پیاده‌سازی مستقل الگوریتم SHA-256 بدون وابستگی خارجی
     * @param {string} ascii 
     * @returns {string} رشته هش هگزادسیمال 64 کاراکتری
     */
    static sha256(ascii) {
      function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
      }

      const mathPow = Math.pow;
      const maxWord = mathPow(2, 32);
      const lengthProperty = 'length';
      let i, j;
      let result = '';
      const words = [];
      const asciiBitLength = ascii[lengthProperty] * 8;
      let hash = [];
      const k = [];
      let primeCounter = 0;
      const isComposite = {};

      for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
          for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
          hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
          k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
      }

      hash = hash.slice(0, 8);
      words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
      words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

      for (i = 0; i < asciiBitLength; i += 8) {
        words[i >> 5] |= (ascii.charCodeAt(i / 8) & 0xff) << (24 - (i % 32));
      }

      for (j = 0; j < words[lengthProperty]; j += 16) {
        const w = words.slice(j, j + 16);
        const oldHash = hash.slice(0);
        hash = hash.slice(0, 8);

        for (i = 0; i < 64; i++) {
          const i2 = i + j;
          const w15 = w[i - 15];
          const w2 = w[i - 2];
          const a = hash[0];
          const e = hash[4];

          const temp1 = hash[7]
            + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
            + ((e & hash[5]) ^ (~e & hash[6]))
            + k[i]
            + (w[i] = (i < 16) ? (w[i] | 0) : (
                w[i - 16]
                + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                + w[i - 7]
                + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
              ) | 0);

          const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
            + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

          hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
        }

        for (i = 0; i < 8; i++) {
          hash[i] = (hash[i] + oldHash[i]) | 0;
        }
      }

      for (i = 0; i < 8; i++) {
        for (j = 3; j >= 0; j--) {
          const b = (hash[i] >> (8 * j)) & 255;
          result += (b < 16 ? '0' : '') + b.toString(16);
        }
      }
      return result;
    }

    /**
     * محاسبه پیام‌کد اعتبارسنجی هش (HMAC-SHA256)
     * @param {string} key - کلید یا سالت محرمانه
     * @param {string} message - پیام یا داده استاندارد شده
     * @returns {string} کد HMAC هگزا
     */
    static hmacSha256(key, message) {
      const blockSize = 64;
      if (key.length > blockSize) {
        key = CryptoVault.sha256(key);
      }

      const keyBytes = [];
      for (let i = 0; i < key.length; i++) {
        keyBytes.push(key.charCodeAt(i));
      }
      while (keyBytes.length < blockSize) {
        keyBytes.push(0);
      }

      let oKeyPad = '';
      let iKeyPad = '';
      for (let i = 0; i < blockSize; i++) {
        oKeyPad += String.fromCharCode(keyBytes[i] ^ 0x5c);
        iKeyPad += String.fromCharCode(keyBytes[i] ^ 0x36);
      }

      const innerHashHex = CryptoVault.sha256(iKeyPad + message);
      let innerHashStr = '';
      for (let i = 0; i < innerHashHex.length; i += 2) {
        innerHashStr += String.fromCharCode(parseInt(innerHashHex.substr(i, 2), 16));
      }
      return CryptoVault.sha256(oKeyPad + innerHashStr);
    }

    /**
     * استانداردسازی ساختار شیء JSON به ترتیب الفبایی کلیدها برای امضای قطعی
     * @param {*} obj 
     * @returns {string}
     */
    static canonicalStringify(obj) {
      if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
      }
      if (Array.isArray(obj)) {
        return '[' + obj.map(item => CryptoVault.canonicalStringify(item)).join(',') + ']';
      }
      const keys = Object.keys(obj).sort();
      return '{' + keys.map(k => JSON.stringify(k) + ':' + CryptoVault.canonicalStringify(obj[k])).join(',') + '}';
    }

    /**
     * امضای امن یک آبجکت جاوااسکریپتی
     * @param {object} payload 
     * @param {string} salt 
     * @returns {string} امضای دیجیتال
     */
    static sign(payload, salt) {
      const cleanData = { ...payload };
      delete cleanData.signature;
      delete cleanData.isTampered;
      const canonical = CryptoVault.canonicalStringify(cleanData);
      return CryptoVault.hmacSha256(salt, canonical);
    }

    /**
     * تایید اصالت و اطمینان از عدم دستکاری
     * @param {object} payload - داده شامل فیلد امضا
     * @param {string} signature - امضای ذخیره شده
     * @param {string} salt - کلید محرمانه
     * @returns {boolean}
     */
    static verify(payload, signature, salt) {
      if (!signature || typeof signature !== 'string') return false;
      const expected = CryptoVault.sign(payload, salt);
      return CryptoVault.constantTimeCompare(signature, expected);
    }

    /**
     * مقایسه رشته‌ها با زمان ثابت جهت خنثی‌سازی حملات زمان‌بندی (Timing Attack)
     * @param {string} a 
     * @param {string} b 
     * @returns {boolean}
     */
    static constantTimeCompare(a, b) {
      if (typeof a !== 'string' || typeof b !== 'string') return false;
      if (a.length !== b.length) return false;
      let diff = 0;
      for (let i = 0; i < a.length; i++) {
        diff |= (a.charCodeAt(i) ^ b.charCodeAt(i));
      }
      return diff === 0;
    }

    /**
     * پاکسازی کاراکترهای خطرناک و جلوگیری از تزریق اسکریپت در متادیتا
     * @param {string} input 
     * @param {number} maxLength 
     * @returns {string}
     */
    static sanitize(input, maxLength = 32) {
      if (typeof input !== 'string') return '';
      const sanitized = input
        .replace(/<[^>]*>?/gm, '')
        .replace(/[^\w\s\-\.\u0600-\u06FF]/gi, '')
        .trim();
      return sanitized.slice(0, maxLength);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CryptoVault };
  } else {
    global.CryptoVault = CryptoVault;
  }
})(typeof window !== 'undefined' ? window : globalThis);