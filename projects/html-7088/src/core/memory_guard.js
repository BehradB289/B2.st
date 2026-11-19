/**
 * @file memory_guard.js
 * @author B2.st Cybersecurity & Performance Engineering Lab
 * @version 2.4.0-STABLE
 * @description سیستم نگهبان حافظه ۱۰ لایه (10-Layer Memory Guard) جهت تشخیص، مهار
 *              و نابودسازی نشت‌های حافظه (Memory Leaks)، تایمرهای زامبی (Zombie Timers)،
 *              حلقه‌های انیمیشن بدون مهار (Runaway RAF) و تخلیه VRAM/Heap در بازی ماریو.
 */

'use strict';

class MemoryGuard {
    #trackedTimeouts = new Map();
    #trackedIntervals = new Map();
    #trackedRAF = new Set();
    #registeredListeners = [];
    #disposableRegistry = new Set();
    #poolRegistry = new Map();
    #finalizationRegistry = null;
    #isDestroyed = false;
    #maxHeapThresholdMB = 250;
    #alertThresholdMB = 180;
    #metrics = {
        clearedTimersCount: 0,
        clearedIntervalsCount: 0,
        reclaimedEntitiesCount: 0,
        lastHeapSizeMB: 0,
        emergencySweepsTriggered: 0
    };

    constructor(options = {}) {
        this.#maxHeapThresholdMB = options.maxHeapThresholdMB || 250;
        this.#alertThresholdMB = options.alertThresholdMB || 180;
        this.debugMode = options.debugMode || false;

        this.#initFinalizer();
        this.#bindLifecycleSignals();
        Object.seal(this);
    }

    // =========================================================================
    // لایه ۱ و ۲: مدیریت قطعی و ایزوله‌سازی تایمرها (Timeouts & Intervals)
    // =========================================================================

    /**
     * ثبت و اجرای امن setTimeout همراه با مانیتورینگ چرخه حیات
     * @param {Function} handler 
     * @param {number} timeout 
     * @param  {...any} args 
     * @returns {number} Timer ID
     */
    safeTimeout(handler, timeout = 0, ...args) {
        if (this.#isDestroyed) return -1;

        const id = window.setTimeout(() => {
            try {
                handler(...args);
            } finally {
                this.#trackedTimeouts.delete(id);
            }
        }, timeout);

        this.#trackedTimeouts.set(id, {
            spawnTime: performance.now(),
            ttl: timeout,
            stack: this.debugMode ? new Error().stack : null
        });

        return id;
    }

    /**
     * پاک‌سازی مستقیم Timeout مشخص
     * @param {number} id 
     */
    clearTimeout(id) {
        if (this.#trackedTimeouts.has(id)) {
            window.clearTimeout(id);
            this.#trackedTimeouts.delete(id);
            this.#metrics.clearedTimersCount++;
        }
    }

    /**
     * ثبت و اجرای امن setInterval با قابلیت ابطال خودکار در صورت نشت
     * @param {Function} handler 
     * @param {number} interval 
     * @param  {...any} args 
     * @returns {number} Interval ID
     */
    safeInterval(handler, interval = 0, ...args) {
        if (this.#isDestroyed) return -1;

        const id = window.setInterval((...innerArgs) => {
            if (this.#isDestroyed) {
                this.clearInterval(id);
                return;
            }
            handler(...innerArgs);
        }, interval, ...args);

        this.#trackedIntervals.set(id, {
            spawnTime: performance.now(),
            intervalMs: interval,
            stack: this.debugMode ? new Error().stack : null
        });

        return id;
    }

    /**
     * پاک‌سازی امن Interval
     * @param {number} id 
     */
    clearInterval(id) {
        if (this.#trackedIntervals.has(id)) {
            window.clearInterval(id);
            this.#trackedIntervals.delete(id);
            this.#metrics.clearedIntervalsCount++;
        }
    }

    // =========================================================================
    // لایه ۳: مهار حلقه انیمیشن و رندرر (Anti-Runaway RAF Sentinel)
    // =========================================================================

    /**
     * ثبت فریم انیمیشن تحت کنترل امنیتی
     * @param {FrameRequestCallback} callback 
     * @returns {number} RAF ID
     */
    safeRAF(callback) {
        if (this.#isDestroyed) return -1;

        let id;
        id = window.requestAnimationFrame((timestamp) => {
            this.#trackedRAF.delete(id);
            if (!this.#isDestroyed) {
                callback(timestamp);
            }
        });

        this.#trackedRAF.add(id);
        return id;
    }

    /**
     * لغو قطعی RAF
     * @param {number} id 
     */
    cancelRAF(id) {
        if (this.#trackedRAF.has(id)) {
            window.cancelAnimationFrame(id);
            this.#trackedRAF.delete(id);
        }
    }

    /**
     * پاک‌سازی کامل تمام فریم‌های در حال اجرا (مخصوص انتقال سکانس‌ها و Game Over)
     */
    purgeAllRAF() {
        for (const id of this.#trackedRAF) {
            window.cancelAnimationFrame(id);
        }
        this.#trackedRAF.clear();
    }

    // =========================================================================
    // لایه ۴: مدیریت Event Listenerها و جلوگیری از نگه‌داری مراجع زامبی در DOM
    // =========================================================================

    /**
     * افزودن لیسنر قابل ردیابی با تضمین عدم نشت حافظه
     * @param {EventTarget} target 
     * @param {string} type 
     * @param {EventListenerOrEventListenerObject} listener 
     * @param {boolean|AddEventListenerOptions} options 
     */
    safeAddEventListener(target, type, listener, options = false) {
        if (!target || typeof target.addEventListener !== 'function') return;

        target.addEventListener(type, listener, options);
        this.#registeredListeners.push({ target, type, listener, options });
    }

    /**
     * حذف تمامی EventListenerهای ثبت شده
     */
    purgeAllEventListeners() {
        for (let i = 0; i < this.#registeredListeners.length; i++) {
            const { target, type, listener, options } = this.#registeredListeners[i];
            try {
                if (target && typeof target.removeEventListener === 'function') {
                    target.removeEventListener(type, listener, options);
                }
            } catch (_) {
                // خطای مراجع Dom مرده ایگنور می‌شود
            }
        }
        this.#registeredListeners.length = 0;
    }

    // =========================================================================
    // لایه ۵ و ۶: استخر اشیاء (Object Pooling) و ره‌گیری تخریب موجودیت‌ها
    // =========================================================================

    /**
     * رجیستر کردن یک Object Pool برای جلوگیری از Allocation پیوسته در حلقه بازی
     * @param {string} key 
     * @param {Array} poolArray 
     * @param {Function} factoryFn 
     * @param {Function} resetFn 
     */
    registerPool(key, poolArray, factoryFn, resetFn) {
        this.#poolRegistry.set(key, { pool: poolArray, factory: factoryFn, reset: resetFn });
    }

    /**
     * دریافت آبجکت از استخر با تخصیص بهینه
     * @param {string} key 
     * @returns {any}
     */
    obtainFromPool(key) {
        const entry = this.#poolRegistry.get(key);
        if (!entry) return null;

        if (entry.pool.length > 0) {
            const item = entry.pool.pop();
            if (entry.reset) entry.reset(item);
            return item;
        }
        return entry.factory();
    }

    /**
     * بازگردانی موجودیت مصرف شده به استخر به جای ارسال به GC
     * @param {string} key 
     * @param {any} item 
     */
    releaseToPool(key, item) {
        const entry = this.#poolRegistry.get(key);
        if (!entry) return;

        if (entry.reset) entry.reset(item);
        entry.pool.push(item);
        this.#metrics.reclaimedEntitiesCount++;
    }

    /**
     * ثبت اشیایی که نیاز به متد تخریب (dispose) دارند
     * @param {object} disposable 
     */
    registerDisposable(disposable) {
        if (disposable && typeof disposable.dispose === 'function') {
            this.#disposableRegistry.add(disposable);
            if (this.#finalizationRegistry) {
                this.#finalizationRegistry.register(disposable, disposable.constructor.name);
            }
        }
    }

    #initFinalizer() {
        if (typeof FinalizationRegistry !== 'undefined') {
            this.#finalizationRegistry = new FinalizationRegistry((heldValue) => {
                if (this.debugMode) {
                    console.debug(`[MemoryGuard-V8] Garbage Collector reclaimed unmanaged: ${heldValue}`);
                }
            });
        }
    }

    // =========================================================================
    // لایه ۷: مدیریت Context رندرینگ و آزادسازی حافظه بافرهای گرافیکی Canvas
    // =========================================================================

    /**
     * پاک‌سازی ساختاری بافر کانواس جهت آزادسازی فوری VRAM در مرورگر
     * @param {HTMLCanvasElement} canvas 
     */
    flushCanvas(canvas) {
        if (!canvas) return;
        try {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
            }
            // تغییر طول و عرض به ۰ و مجدداً به مقدار قبلی باعث دراپ شدن کش بافر GPU می‌شود
            const w = canvas.width;
            const h = canvas.height;
            canvas.width = 0;
            canvas.height = 0;
            canvas.width = w;
            canvas.height = h;
        } catch (_) {}
    }

    // =========================================================================
    // لایه ۸: دیدبانی هیپ و بازیافت اورژانسی (Emergency GC Sweep)
    // =========================================================================

    /**
     * بررسی وضعیت هیپ حافظه جاوااسکریپت (مخصوص موتورهای V8/Chromium)
     */
    checkMemoryUsage() {
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            const usedMB = (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
            this.#metrics.lastHeapSizeMB = parseFloat(usedMB);

            if (usedMB > this.#alertThresholdMB) {
                console.warn(`[MemoryGuard ALERT] High memory load detected: ${usedMB} MB / Cap: ${this.#maxHeapThresholdMB} MB`);
            }

            if (usedMB > this.#maxHeapThresholdMB) {
                console.error(`[MemoryGuard PANIC] Memory limit breached! Initiating emergency purge.`);
                this.emergencyPurge();
            }
        }
    }

    // =========================================================================
    // لایه ۹: پاک‌سازی کامل در زمان تغییر مرحله (Scene Transition Purge)
    // =========================================================================

    /**
     * نابودی هدفمند حافظه موقت سکانس‌ها بدون از بین بردن هسته گارد
     */
    sceneTransitionPurge() {
        // ۱. توقف تمام تایمرها
        for (const [id] of this.#trackedTimeouts) {
            window.clearTimeout(id);
        }
        this.#trackedTimeouts.clear();

        for (const [id] of this.#trackedIntervals) {
            window.clearInterval(id);
        }
        this.#trackedIntervals.clear();

        // ۲. لغو فریم‌های رندر معلق
        this.purgeAllRAF();

        // ۳. فراخوانی Dispose روی موجودیت‌ها
        for (const item of this.#disposableRegistry) {
            try {
                if (typeof item.dispose === 'function') {
                    item.dispose();
                }
            } catch (err) {
                console.error(`[MemoryGuard] Error disposing entity:`, err);
            }
        }
        this.#disposableRegistry.clear();

        // ۴. تخلیه استخرهای موقت
        for (const [_, entry] of this.#poolRegistry) {
            entry.pool.length = 0;
        }

        if (this.debugMode) {
            console.info('[MemoryGuard] Scene transition cleanup completed flawlessly.');
        }
    }

    // =========================================================================
    // لایه ۱۰: نابودگر سراسری (Hard Destroy & Anti-Tamper)
    // =========================================================================

    #bindLifecycleSignals() {
        this.safeAddEventListener(window, 'beforeunload', () => this.destroy());
        this.safeAddEventListener(window, 'pagehide', () => this.destroy());
    }

    emergencyPurge() {
        this.#metrics.emergencySweepsTriggered++;
        this.sceneTransitionPurge();
    }

    getMetrics() {
        return {
            ...this.#metrics,
            activeTimeouts: this.#trackedTimeouts.size,
            activeIntervals: this.#trackedIntervals.size,
            activeRAF: this.#trackedRAF.size,
            activeListeners: this.#registeredListeners.length,
            managedPools: this.#poolRegistry.size
        };
    }

    /**
     * نابودی کل سیستم و خنثی‌سازی هرگونه مرجع باقی‌مانده
     */
    destroy() {
        if (this.#isDestroyed) return;
        this.#isDestroyed = true;

        this.sceneTransitionPurge();
        this.purgeAllEventListeners();

        this.#poolRegistry.clear();
        this.#finalizationRegistry = null;

        if (this.debugMode) {
            console.warn('[MemoryGuard] MemoryGuard core has terminated all operational loops.');
        }
    }
}

// قفل کردن پروتوتایپ برای جلوگیری از Prototype Pollution و دستکاری مخرب در ران‌تایم
Object.freeze(MemoryGuard.prototype);

// صادرات ماژول
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MemoryGuard };
} else {
    window.MemoryGuard = MemoryGuard;
}