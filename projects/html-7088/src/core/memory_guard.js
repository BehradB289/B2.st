/**
 * B2.st Studio - Cyber Security & Performance Optimization Engine
 * Module: MemoryGuard (Zero-Leak Lifecycle & Runtime Sanitizer)
 * Target: Mario HTML5 Game Engine
 * Layer: L3 (Resource Tracking) & L7 (Runtime Heap Hardening)
 */

class MemoryGuard {
    #activeTimeouts = new Set();
    #activeIntervals = new Set();
    #activeAnimationFrames = new Set();
    #registeredEvents = new Map();
    #watchdogIntervalId = null;
    #maxHeapThresholdMB = 250; // سقف هشدار مصرف حافظه

    constructor() {
        this.#initWatchdog();
        Object.seal(this);
    }

    /**
     * ثبت و مدیریت امن setTimeout با قابلیت پاک‌سازی تضمینی
     * @param {Function} handler 
     * @param {number} timeout 
     * @param {...any} args 
     * @returns {number} Timer ID
     */
    safeSetTimeout(handler, timeout, ...args) {
        let timerId;
        const wrappedHandler = () => {
            this.#activeTimeouts.delete(timerId);
            try {
                handler(...args);
            } catch (err) {
                console.error(`[MemoryGuard] خطای زمان اجرا در تایمر ${timerId}:`, err);
            }
        };

        timerId = window.setTimeout(wrappedHandler, timeout);
        this.#activeTimeouts.add(timerId);
        return timerId;
    }

    /**
     * ثبت و ردیابی مستمر setInterval
     * @param {Function} handler 
     * @param {number} timeout 
     * @param {...any} args 
     * @returns {number} Interval ID
     */
    safeSetInterval(handler, timeout, ...args) {
        const intervalId = window.setInterval((...params) => {
            try {
                handler(...params);
            } catch (err) {
                this.safeClearInterval(intervalId);
                console.error(`[MemoryGuard] وقفه بحرانی؛ اینتروال ${intervalId} لغو شد:`, err);
            }
        }, timeout, ...args);

        this.#activeIntervals.add(intervalId);
        return intervalId;
    }

    /**
     * درخواست فریم رندر ایمن با جلوگیری از پدیده rAF Cascading
     * @param {FrameRequestCallback} callback 
     * @returns {number} Frame ID
     */
    safeRequestAnimationFrame(callback) {
        let frameId;
        const wrappedCallback = (timestamp) => {
            this.#activeAnimationFrames.delete(frameId);
            callback(timestamp);
        };
        frameId = window.requestAnimationFrame(wrappedCallback);
        this.#activeAnimationFrames.add(frameId);
        return frameId;
    }

    /**
     * پاک‌سازی دستی تایمر انفرادی
     */
    safeClearTimeout(id) {
        if (id && this.#activeTimeouts.has(id)) {
            window.clearTimeout(id);
            this.#activeTimeouts.delete(id);
        }
    }

    /**
     * پاک‌سازی دستی اینتروال انفرادی
     */
    safeClearInterval(id) {
        if (id && this.#activeIntervals.has(id)) {
            window.clearInterval(id);
            this.#activeIntervals.delete(id);
        }
    }

    /**
     * پاک‌سازی انفرادی انیمیشن فریم
     */
    safeCancelAnimationFrame(id) {
        if (id && this.#activeAnimationFrames.has(id)) {
            window.cancelAnimationFrame(id);
            this.#activeAnimationFrames.delete(id);
        }
    }

    /**
     * مدیریت ثبت و ردیابی EventListenerها برای حذف Zombie Listeners در تغییر مراحل
     */
    addTrackedEventListener(target, eventType, listener, options = false) {
        if (!target || typeof target.addEventListener !== 'function') return;

        target.addEventListener(eventType, listener, options);

        if (!this.#registeredEvents.has(target)) {
            this.#registeredEvents.set(target, []);
        }
        this.#registeredEvents.get(target).push({ eventType, listener, options });
    }

    /**
     * پاک‌سازی کلیدهای گوش‌به‌زنگ مربوط به یک عنصر یا کل بازی
     */
    purgeEventListeners(specificTarget = null) {
        const removeGroup = (target, events) => {
            for (let i = 0; i < events.length; i++) {
                const { eventType, listener, options } = events[i];
                target.removeEventListener(eventType, listener, options);
            }
        };

        if (specificTarget) {
            const events = this.#registeredEvents.get(specificTarget);
            if (events) {
                removeGroup(specificTarget, events);
                this.#registeredEvents.delete(specificTarget);
            }
        } else {
            for (const [target, events] of this.#registeredEvents.entries()) {
                removeGroup(target, events);
            }
            this.#registeredEvents.clear();
        }
    }

    /**
     * بهینه‌ساز حلقه‌های رندرینگ با پرهیز کامل از GC Thrashing و نشت حافظه ناشی از Closure
     * @param {Array} collection آرایه ورودی (ماریو، دشمنان، آبجکت‌های پویا)
     * @param {Function} processor متد پردازش برای هر انتیتی
     */
    fastEntitySweep(collection, processor) {
        if (!Array.isArray(collection)) return;
        
        let cursor = 0;
        const total = collection.length;

        // حلقه پیش‌رانده بدون بازتخصیص متغیر در رم
        while (cursor < total) {
            const entity = collection[cursor];
            if (entity && entity.isActive !== false) {
                processor(entity, cursor);
            }
            cursor = (cursor + 1) | 0; // بهینه‌سازی محاسباتی 32 بیتی بیتی وایز
        }
    }

    /**
     * فرآیند پاک‌سازی فشرده (Hard Purge) حین Game Over یا سوئیچ Scene
     */
    purgeAll() {
        // ۱. ابطال تمامی تایمرها
        for (const timerId of this.#activeTimeouts) {
            window.clearTimeout(timerId);
        }
        this.#activeTimeouts.clear();

        // ۲. ابطال تمامی اینتروال‌ها
        for (const intervalId of this.#activeIntervals) {
            window.clearInterval(intervalId);
        }
        this.#activeIntervals.clear();

        // ۳. توقف فریم‌های رندر معلق
        for (const frameId of this.#activeAnimationFrames) {
            window.cancelAnimationFrame(frameId);
        }
        this.#activeAnimationFrames.clear();

        // ۴. پاک‌سازی کامل لیسنرها
        this.purgeEventListeners();

        console.info('[MemoryGuard] چرخه حیات با موفقیت پاک‌سازی شد. رم در حالت ایزوله.');
    }

    /**
     * واچ‌داگ نظارت بر هدررفت رم (Memory Watchdog)
     */
    #initWatchdog() {
        if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
            this.#watchdogIntervalId = window.setInterval(() => {
                const usedHeapMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
                if (usedHeapMB > this.#maxHeapThresholdMB) {
                    console.warn(`[MemoryGuard ALERT] مصرف غیرعادی رم: ${usedHeapMB}MB. آغاز ریکاوری اضطراری...`);
                    this.purgeEventListeners(window);
                }
            }, 10000);
        }
    }

    /**
     * خروج امن و آزادسازی کلیه ناظران سیستم
     */
    destroy() {
        this.purgeAll();
        if (this.#watchdogIntervalId) {
            window.clearInterval(this.#watchdogIntervalId);
            this.#watchdogIntervalId = null;
        }
    }
}

// صدور نمونه یگانه (Singleton) جهت یکپارچه‌سازی در هسته بازی
export const memoryGuard = new MemoryGuard();
export default MemoryGuard;