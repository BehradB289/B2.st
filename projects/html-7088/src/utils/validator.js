/**
 * B2.st Studio - 10-Layer Debugger & Cyber Security Defensive Engine
 * Module: Input Validation & Null/Undefined Shielding Guard
 * Target: Super Mario HTML5 Canvas Engine
 * Standard: OWASP ASVS / Defensive Game Architecture
 */

'use strict';

/**
 * کلیدهای مخرب جهت جلوگیری از آسیب‌پذیری Prototype Pollution در تنظیمات یا مراحل ورودی
 */
const FORBIDDEN_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);

/**
 * ماژول اصلی اعتبارسنجی و محافظت فیزیک/منطق بازی
 */
export const Validator = Object.freeze({
  /**
   * بررسی تهی نبودن (عدم تطابق با null یا undefined)
   * @param {*} val 
   * @returns {boolean}
   */
  isDefined(val) {
    return val !== null && val !== undefined;
  },

  /**
   * اعتبارسنجی قطعی اعداد؛ جلوگیری از نفوذ NaN، Infinity و مقادیر رشته‌ای نامعتبر
   * @param {*} val 
   * @param {Object} [options] { min, max, allowZero }
   * @returns {boolean}
   */
  isNumber(val, options = {}) {
    if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
      return false;
    }
    if (this.isDefined(options.min) && val < options.min) return false;
    if (this.isDefined(options.max) && val > options.max) return false;
    if (options.allowZero === false && val === 0) return false;
    return true;
  },

  /**
   * پاکسازی و محصور کردن مقدار عددی در بازه معین با بازگشت امن در صورت خرابی
   * @param {*} val 
   * @param {number} min 
   * @param {number} max 
   * @param {number} [fallback=0]
   * @returns {number}
   */
  clamp(val, min, max, fallback = 0) {
    const safeMin = this.isNumber(min) ? min : 0;
    const safeMax = this.isNumber(max) ? max : safeMin;
    if (!this.isNumber(val)) return this.isNumber(fallback) ? fallback : safeMin;
    return Math.max(safeMin, Math.min(safeMax, val));
  },

  /**
   * بررسی اصالت شیء (Plain Object) و فاقد ارجاعات مخرب یا ساختار اشتباه
   * @param {*} obj 
   * @returns {boolean}
   */
  isObject(obj) {
    return (
      this.isDefined(obj) &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      !(obj instanceof Function)
    );
  },

  /**
   * اعتبارسنجی بردارهای حرکتی (Vectors) و پیشگیری از سرایت NaN به موقعیت ماریو
   * @param {*} vec 
   * @param {Object} [fallback={x: 0, y: 0}]
   * @returns {{x: number, y: number}}
   */
  sanitizeVector(vec, fallback = { x: 0, y: 0 }) {
    const safeFallbackX = this.isNumber(fallback?.x) ? fallback.x : 0;
    const safeFallbackY = this.isNumber(fallback?.y) ? fallback.y : 0;

    if (!this.isObject(vec)) {
      return { x: safeFallbackX, y: safeFallbackY };
    }

    return {
      x: this.isNumber(vec.x) ? vec.x : safeFallbackX,
      y: this.isNumber(vec.y) ? vec.y : safeFallbackY
    };
  },

  /**
   * گارد محافظ ساختار جعبه برخورد (Bounding Box / AABB)
   * جلوگیری از پدیده Tunneling و سقوط کاراکتر به دلیل عدم وجود اندازه
   * @param {*} box 
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  sanitizeBoundingBox(box) {
    if (!this.isObject(box)) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    return {
      x: this.isNumber(box.x) ? box.x : 0,
      y: this.isNumber(box.y) ? box.y : 0,
      width: this.isNumber(box.width, { min: 0 }) ? box.width : 0,
      height: this.isNumber(box.height, { min: 0 }) ? box.height : 0
    };
  },

  /**
   * گارد لایه هسته برای اعتبارسنجی کلیه Entityهای بازی (Mario, Goomba, Koopa, etc.)
   * @param {*} entity 
   * @returns {boolean}
   */
  isValidEntity(entity) {
    if (!this.isObject(entity)) return false;

    // بررسی وجود الزامی موقعیت و ابعاد
    const hasPosition = this.isObject(entity.pos) && 
                        this.isNumber(entity.pos.x) && 
                        this.isNumber(entity.pos.y);

    const hasVelocity = this.isObject(entity.vel) && 
                        this.isNumber(entity.vel.x) && 
                        this.isNumber(entity.vel.y);

    const hasSize = this.isObject(entity.size) && 
                    this.isNumber(entity.size.x, { min: 0 }) && 
                    this.isNumber(entity.size.y, { min: 0 });

    const hasLifecycle = typeof entity.update === 'function';

    return hasPosition && hasVelocity && hasSize && hasLifecycle;
  },

  /**
   * بررسی اصالت کانتکست Canvas رندرینگ
   * @param {*} ctx 
   * @returns {boolean}
   */
  isValidCanvasContext(ctx) {
    if (!this.isDefined(ctx)) return false;
    return (
      typeof ctx.fillRect === 'function' &&
      typeof ctx.drawImage === 'function' &&
      typeof ctx.clearRect === 'function' &&
      this.isObject(ctx.canvas)
    );
  },

  /**
   * خنثی‌سازی آبجکت ورودی در برابر تزریق کلیدهای غیرمجاز (Prototype Pollution Protection)
   * ویژه اعتبارسنجی دیتا مپ‌ها و ساختار لول‌ها (JSON)
   * @param {Object} rawData 
   * @returns {Object}
   */
  sanitizeData(rawData) {
    if (!this.isObject(rawData)) {
      return {};
    }

    const clean = Object.create(null);
    for (const [key, value] of Object.entries(rawData)) {
      if (FORBIDDEN_KEYS.includes(key)) {
        console.warn(`[B2.st Security Alert] Prohibited key detected and stripped: ${key}`);
        continue;
      }

      if (this.isObject(value)) {
        clean[key] = this.sanitizeData(value);
      } else if (Array.isArray(value)) {
        clean[key] = value.map(item => (this.isObject(item) ? this.sanitizeData(item) : item));
      } else {
        clean[key] = value;
      }
    }
    return clean;
  },

  /**
   * محافظت و اجرای Safe Call توابع در چرخه فیزیک و انیمیشن بدون کرش کردن حلقه بازی
   * @param {Function} fn 
   * @param {*} fallbackReturn 
   * @param {*} context 
   * @param {...*} args 
   * @returns {*}
   */
  safeCall(fn, fallbackReturn = null, context = null, ...args) {
    if (typeof fn !== 'function') {
      return fallbackReturn;
    }
    try {
      return fn.apply(context, args);
    } catch (err) {
      console.error('[B2.st Engine Intercept] Execution trapped gracefully:', err);
      return fallbackReturn;
    }
  }
});

export default Validator;