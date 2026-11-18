/**
 * @file validator.js
 * @description ماژول جامع اعتبارسنجی ساختار داده و گارد دفاعی در برابر خطاهای Null/Undefined و تخریب تایپ‌ها در موتور بازی ماریو.
 * @author B2.st Studio - 10-Layer Cybersecurity & Debugging Division
 */

// مقادیر پیش‌فرض ایزوله‌شده و غیرقابل تغییر (Immutable Fallbacks) جهت جلوگیری از Prototype Pollution
const SAFE_FALLBACKS = Object.freeze({
    VECTOR: Object.freeze({ x: 0, y: 0 }),
    BOUNDING_BOX: Object.freeze({ x: 0, y: 0, width: 0, height: 0 }),
    INPUT_STATE: Object.freeze({ left: false, right: false, up: false, down: false, jump: false, run: false }),
    DEFAULT_DT: 1 / 60,
    MAX_DT: 0.1
});

// کلیدهای مسدود شده جهت جلوگیری از تزریق به آبجکت و آلودگی پروتوتایپ (Security Hardening)
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const Validator = {
    /**
     * بررسی تعریف شدن متغیر و عدم برابری با null یا undefined
     * @param {*} value
     * @returns {boolean}
     */
    isDefined(value) {
        return value !== null && value !== undefined;
    },

    /**
     * بررسی امنیت عددی (جلوگیری از رخنه NaN، Infinity و مقادیر غیرعددی)
     * @param {*} value
     * @param {boolean} allowNegative
     * @returns {boolean}
     */
    isSafeNumber(value, allowNegative = true) {
        if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
            return false;
        }
        return allowNegative ? true : value >= 0;
    },

    /**
     * بررسی نوع آبجکت معتبر (مستقل از آرایه و null)
     * @param {*} obj
     * @returns {boolean}
     */
    isPlainObject(obj) {
        return this.isDefined(obj) && typeof obj === 'object' && !Array.isArray(obj);
    },

    /**
     * پالایش و گارد اعتبارسنجی بردار دو بعدی فیزیک (موقعیت، سرعت، شتاب)
     * @param {*} vec
     * @param {Object} fallback
     * @returns {{x: number, y: number}}
     */
    sanitizeVector2D(vec, fallback = SAFE_FALLBACKS.VECTOR) {
        if (!this.isPlainObject(vec)) {
            console.warn('[B2.st-Guard] بردار فیزیکی نامعتبر یا Null شناسایی شد. اعمال Fallback امن.', vec);
            return { ...fallback };
        }

        return {
            x: this.isSafeNumber(vec.x) ? vec.x : fallback.x,
            y: this.isSafeNumber(vec.y) ? vec.y : fallback.y
        };
    },

    /**
     * اعتبارسنجی کادر برخورد (Bounding Box / Hitbox) برای محاسبات برخورد
     * @param {*} box
     * @param {Object} fallback
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    sanitizeBoundingBox(box, fallback = SAFE_FALLBACKS.BOUNDING_BOX) {
        if (!this.isPlainObject(box)) {
            console.error('[B2.st-Guard] کادر برخورد (Hitbox) تعریف‌نشده است. ایزوله‌سازی موقعیت.', box);
            return { ...fallback };
        }

        return {
            x: this.isSafeNumber(box.x) ? box.x : fallback.x,
            y: this.isSafeNumber(box.y) ? box.y : fallback.y,
            width: this.isSafeNumber(box.width, false) ? box.width : fallback.width,
            height: this.isSafeNumber(box.height, false) ? box.height : fallback.height
        };
    },

    /**
     * اعتبارسنجی Delta Time جهت جلوگیری از پرش‌های فیزیکی ناشی از لگ یا فریز تب مرورگر (Spiral of Death)
     * @param {*} dt
     * @returns {number}
     */
    sanitizeDeltaTime(dt) {
        if (!this.isSafeNumber(dt, false) || dt === 0) {
            return SAFE_FALLBACKS.DEFAULT_DT;
        }
        // اگر کلاینت لگ شدیدی داشت، حداکثر گام زمانی کلمپ می‌شود
        return Math.min(dt, SAFE_FALLBACKS.MAX_DT);
    },

    /**
     * اعتبارسنجی ساختار موجودیت‌ها (Mario, Enemies, Collectibles)
     * @param {*} entity
     * @returns {boolean}
     */
    validateEntityStructure(entity) {
        if (!this.isPlainObject(entity)) return false;

        // بررسی صریح فیلدهای الزامی موجودیت برای جلوگیری از اجرای لاجیک روی رفرنس خالی
        const hasId = typeof entity.id === 'string' || typeof entity.id === 'number';
        const hasPos = this.isPlainObject(entity.pos) && this.isSafeNumber(entity.pos.x) && this.isSafeNumber(entity.pos.y);
        const hasVel = this.isPlainObject(entity.vel) && this.isSafeNumber(entity.vel.x) && this.isSafeNumber(entity.vel.y);
        const hasSize = this.isSafeNumber(entity.width, false) && this.isSafeNumber(entity.height, false);

        if (!hasId || !hasPos || !hasVel || !hasSize) {
            console.error('[B2.st-Guard] موجودیت فاقد ساختار استاندارد فیزیک است:', entity);
            return false;
        }

        return true;
    },

    /**
     * گارد اعتبارسنجی ورودی‌های کنترلر صفحه کلید
     * @param {*} inputState
     * @returns {Object}
     */
    sanitizeInputState(inputState) {
        if (!this.isPlainObject(inputState)) {
            return { ...SAFE_FALLBACKS.INPUT_STATE };
        }

        const sanitized = {};
        for (const key of Object.keys(SAFE_FALLBACKS.INPUT_STATE)) {
            sanitized[key] = typeof inputState[key] === 'boolean' ? inputState[key] : false;
        }
        return sanitized;
    },

    /**
     * اسکن ساختارهای داینامیک یا داده‌های ورودی سرور/JSON برای مقابله با Prototype Pollution
     * @param {Object} target
     * @returns {Object}
     */
    sanitizePayload(target) {
        if (!this.isPlainObject(target)) return {};

        const cleanObject = {};
        for (const [key, value] of Object.entries(target)) {
            if (BLOCKED_KEYS.has(key)) {
                console.warn(`[B2.st-Security] کلید غیرمجاز امنیتی مسدود شد: ${key}`);
                continue;
            }

            if (this.isPlainObject(value)) {
                cleanObject[key] = this.sanitizePayload(value);
            } else {
                cleanObject[key] = value;
            }
        }
        return cleanObject;
    }
};