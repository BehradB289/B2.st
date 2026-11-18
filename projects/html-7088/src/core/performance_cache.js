/**
 * ماژول شتاب‌دهنده سرعت و کشینگ درون‌حافظه‌ای هوشمند به همراه Rate Limiter
 * توسعه‌داده‌شده برای موتور بازی استودیو B2.st
 */

export class PerformanceCache {
    /**
     * @param {Object} options تنظیمات کشینگ
     * @param {number} options.defaultTTL مدت زمان اعتبار پیش‌فرض بر حسب میلی‌ثانیه
     * @param {number} options.maxEntries حداکثر تعداد مدخل‌ها در حافظه
     */
    constructor(options = {}) {
        this.defaultTTL = options.defaultTTL || 15000;
        this.maxEntries = options.maxEntries || 500;
        
        /** @type {Map<string, {value: any, expiry: number, hits: number, lastAccessed: number}>} */
        this.store = new Map();

        // تلمتری و آمار عملکرد کش
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            sets: 0
        };

        // شروع زمان‌بند پاکسازی دوره‌ای آیتم‌های منقضی
        this.pruneInterval = setInterval(() => this.prune(), options.pruneIntervalMs || 5000);
    }

    /**
     * ذخیره‌سازی مقدار به همراه زمان انقضا
     * @param {string} key کلید دسترسی
     * @param {any} value مقداری که باید ذخیره شود
     * @param {number} [ttlMs] مدت اعتبار اختصاصی
     */
    set(key, value, ttlMs) {
        const ttl = (typeof ttlMs === 'number' && ttlMs > 0) ? ttlMs : this.defaultTTL;
        const now = performance.now();
        const expiry = now + ttl;

        // اگر ظرفیت پر است، آیتم با کمترین میزان بهره‌وری (LRU) حذف می‌شود
        if (this.store.size >= this.maxEntries && !this.store.has(key)) {
            this._evictLRU();
        }

        this.store.set(key, {
            value,
            expiry,
            hits: 0,
            lastAccessed: now
        });

        this.metrics.sets++;
        return value;
    }

    /**
     * بازیابی مقدار کش شده با اعتبارسنجی TTL
     * @param {string} key 
     * @returns {any|null}
     */
    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            this.metrics.misses++;
            return null;
        }

        const now = performance.now();

        // بررسی انقضای زمانی
        if (now > entry.expiry) {
            this.store.delete(key);
            this.metrics.evictions++;
            this.metrics.misses++;
            return null;
        }

        entry.hits++;
        entry.lastAccessed = now;
        this.metrics.hits++;
        return entry.value;
    }

    /**
     * بررسی وجود داشتن کلید معتبر
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * حذف دستی کلید
     * @param {string} key 
     */
    delete(key) {
        return this.store.delete(key);
    }

    /**
     * پاکسازی تمام مدخل‌های کش
     */
    clear() {
        this.store.clear();
    }

    /**
     * پاکسازی مدخل‌های تاریخ‌گذشته
     */
    prune() {
        const now = performance.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiry) {
                this.store.delete(key);
                this.metrics.evictions++;
            }
        }
    }

    /**
     * سیاست بیرون‌اندازی کم‌استفاده‌ترین داده (Least Recently Used)
     * @private
     */
    _evictLRU() {
        let oldestKey = null;
        let oldestAccess = Infinity;

        for (const [key, entry] of this.store.entries()) {
            if (entry.lastAccessed < oldestAccess) {
                oldestAccess = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.store.delete(oldestKey);
            this.metrics.evictions++;
        }
    }

    /**
     * متد مموایز خودکار برای توابع سنگین ریاضی و فیزیک
     * @param {Function} fn تابع هدف
     * @param {Function} keyResolver تولیدکننده کلید اختصاصی
     * @param {number} [ttlMs] زمان کش
     */
    memoize(fn, keyResolver, ttlMs) {
        return (...args) => {
            const cacheKey = keyResolver ? keyResolver(...args) : JSON.stringify(args);
            const cachedResult = this.get(cacheKey);

            if (cachedResult !== null) {
                return cachedResult;
            }

            const freshResult = fn(...args);
            this.set(cacheKey, freshResult, ttlMs);
            return freshResult;
        };
    }

    /**
     * دریافت نسبت موفقیت کش
     * @returns {number} درصد اصابت کش (۰ تا ۱۰۰)
     */
    getHitRatio() {
        const total = this.metrics.hits + this.metrics.misses;
        if (total === 0) return 0;
        return (this.metrics.hits / total) * 100;
    }

    /**
     * متوقف کردن تایمر پاکسازی در زمان تخریب شیء
     */
    destroy() {
        if (this.pruneInterval) {
            clearInterval(this.pruneInterval);
        }
        this.clear();
    }
}

/**
 * سیستم کنترل نرخ اجرای فراخوانی‌ها (Rate Limiter)
 * بر پایه الگوریتم پنجره لغزان و باکت توکن‌ها جهت جلوگیری از اسپم کلیدها و صداها
 */
export class RateLimiter {
    constructor() {
        /** @type {Map<string, number>} زمان آخرین اجرا به ازای کلید */
        this.lastExecutions = new Map();
        /** @type {Map<string, number>} توکن‌های باقیمانده به ازای هر گروه */
        this.tokenBuckets = new Map();
    }

    /**
     * بررسی اینکه آیا اجرای رویداد مجاز است یا خیر
     * @param {string} actionKey نام یا کلید رویداد
     * @param {number} minIntervalMs حداقل زمان مجاز بین دو فراخوانی به میلی‌ثانیه
     * @returns {boolean}
     */
    canExecute(actionKey, minIntervalMs) {
        const now = performance.now();
        const lastTime = this.lastExecutions.get(actionKey) || 0;

        if (now - lastTime >= minIntervalMs) {
            this.lastExecutions.set(actionKey, now);
            return true;
        }

        return false;
    }

    /**
     * اجرای تابع تنها در صورت عبور از فیلتر ریت‌لیمیت
     * @param {string} actionKey 
     * @param {number} minIntervalMs 
     * @param {Function} callback 
     * @returns {boolean} آیا تابع اجرا شد؟
     */
    throttle(actionKey, minIntervalMs, callback) {
        if (this.canExecute(actionKey, minIntervalMs)) {
            callback();
            return true;
        }
        return false;
    }

    /**
     * پاکسازی سابقه یک اکشن مشخص
     * @param {string} actionKey 
     */
    reset(actionKey) {
        if (actionKey) {
            this.lastExecutions.delete(actionKey);
        } else {
            this.lastExecutions.clear();
        }
    }
}