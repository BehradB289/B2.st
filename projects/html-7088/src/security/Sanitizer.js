/**
 * @file Sanitizer.js
 * @description سیستم محافظت از حریم ران‌تایم، جلوگیری از نشت پروتوتایپ و اعتبارسنجی مقادیر عددی فیزیک
 * @studio B2.st
 */

export class Sanitizer {
    /**
     * قفل‌کردن پروتوتایپ‌های پایه برای جلوگیری از Prototype Pollution
     */
    static lockPrototypes() {
        Object.freeze(Object.prototype);
        Object.freeze(Array.prototype);
        Object.freeze(Function.prototype);
    }

    /**
     * کلمپ ایمن دلتا تایم جهت جلوگیری از پرش‌های ناگهانی فیزیک در لگ فریم
     * @param {number} dt 
     * @param {number} maxDelta 
     * @returns {number}
     */
    static clampDeltaTime(dt, maxDelta = 0.05) {
        if (typeof dt !== 'number' || Number.isNaN(dt) || !Number.isFinite(dt)) {
            return 0;
        }
        return Math.min(Math.max(dt, 0), maxDelta);
    }

    /**
     * تایید سلامت بردار موقعیت
     * @param {number} val 
     * @param {number} fallback 
     * @returns {number}
     */
    static sanitizeNumber(val, fallback = 0) {
        if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
            return fallback;
        }
        return val;
    }
}