/**
 * B2.st Studio - Security & Anti-Tamper Guardian Module
 * لایه حفاظتی ضد دستکاری، پالایش مقادیر ریاضی و جلوگیری از نشت پروتوتایپ
 */
"use strict";

export class Guardian {
    static init() {
        this.freezePrototypes();
        this.installGlobalErrorTrap();
    }

    /**
     * جلوگیری از تغییرات مخرب در آبجکت‌های بنیادی جاوااسکریپت (Anti-Prototype Pollution)
     */
    static freezePrototypes() {
        Object.freeze(Object.prototype);
        Object.freeze(Array.prototype);
        Object.freeze(Function.prototype);
    }

    /**
     * اطمینان از سلامت محاسبات فیزیک و جلوگیری از انتشار مقادیر مخرب NaN یا Infinity
     */
    static sanitizeNumber(val, fallback = 0) {
        if (typeof val !== "number" || !Number.isFinite(val) || Number.isNaN(val)) {
            return fallback;
        }
        return val;
    }

    /**
     * تله‌گذاری برای مهار خطاهای ثبت‌نشده جهت جلوگیری از توقف کامل حلقه رندر
     */
    static installGlobalErrorTrap() {
        window.addEventListener("error", (event) => {
            console.error("[B2.st Guardian] Runtime anomaly intercepted:", event.message);
        });
        window.addEventListener("unhandledrejection", (event) => {
            console.error("[B2.st Guardian] Unhandled async exception intercepted:", event.reason);
        });
    }

    /**
     * اعتبارسنجی مقادیر موقعیت کاراکتر در محدوده مجاز نقشه
     */
    static clamp(value, min, max) {
        const safeVal = this.sanitizeNumber(value, min);
        return Math.min(Math.max(safeVal, min), max);
    }
}