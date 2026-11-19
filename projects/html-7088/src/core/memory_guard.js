/**
 * B2.st Cybersecurity & Engine Core Division
 * Module: MemoryGuard (v3.4.0 High-Performance RAM Optimizer & Leak Sanitizer)
 * Description: سیستم ۱۰ لایه حفاظت از حافظه، ره‌گیری و ابطال تایمرها، مدیریت Object Pool و مهار زباله‌روب (GC)
 */

'use strict';

export class MemoryGuard {
    // لایه امنیتی ۱: ایزوله‌سازی مخازن تایمرها و Listenerها با Private Fields
    #timers = new Map();
    #intervals = new Map();
    #rafs = new Map();
    #eventListeners = new Set();
    #objectPools = new Map();
    #watchdogTimer = null;
    
    // پارامترهای آستانه بحرانی (امنیت سایبری و پایداری موتور)
    #maxMemoryThresholdMB = 250;
    #maxTrackedTimers = 500;
    #metrics = {
        pooledAllocations: 0,
        reclaimedObjects: 0,
        interceptedLeaks: 0,
        lastHeapSizeMB: 0
    };

    constructor(options = {}) {
        this.#maxMemoryThresholdMB = options.maxMemoryMB || 250;
        this.#initWatchdog();
        Object.seal(this);
    }

    /**
     * لایه ۲: ثبات تایمرهای یک‌باره (SetTimeout Guard)
     * جلوگیری از ماندگاری ارجاعات به توابع بسته (Closure Memory Leaks)
     */
    safeSetTimeout(callback, delay, tag = 'general') {
        if (this.#timers.size >= this.#maxTrackedTimers) {
            this.#forcePurgeTag('temporary');
        }

        let timerId = null;
        const wrappedCallback = () => {
            try {
                callback();
            } finally {
                this.clearTimeout(timerId);
            }
        };

        timerId = setTimeout(wrappedCallback, delay);
        this.#timers.set(timerId, { tag, timestamp: performance.now() });
        return timerId;
    }

    clearTimeout(timerId) {
        if (this.#timers.has(timerId)) {
            clearTimeout(timerId);
            this.#timers.delete(timerId);
        }
    }

    /**
     * لایه ۳: ثبات تایمرهای تناوبی (SetInterval Guard)
     * رصد و مهار حلقه‌های بی‌پایان در پس‌زمینه
     */
    safeSetInterval(callback, interval, tag = 'general') {
        const intervalId = setInterval(() => {
            try {
                callback();
            } catch (error) {
                // پاک‌سازی خودکار در صورت بروز خطای تکرارشونده برای جلوگیری از فریز رندر
                this.clearInterval(intervalId);
                console.error(`[MemoryGuard::SecWatch] Interval [${tag}] purged due to fatal cycle:`, error);
            }
        }, interval);

        this.#intervals.set(intervalId, { tag, timestamp: performance.now() });
        return intervalId;
    }

    clearInterval(intervalId) {
        if (this.#intervals.has(intervalId)) {
            clearInterval(intervalId);
            this.#intervals.delete(intervalId);
        }
    }

    /**
     * لایه ۴: مهار درخواست‌های فریم رندر (rAF Optimizer)
     * باطل‌سازی تمام فریم‌های معلق هنگام تعویض صحنه یا باخت بازیکن
     */
    safeRAF(callback, tag = 'render') {
        let rafId = null;
        const wrappedCallback = (timestamp) => {
            this.#rafs.delete(rafId);
            callback(timestamp);
        };

        rafId = requestAnimationFrame(wrappedCallback);
        this.#rafs.set(rafId, { tag, timestamp: performance.now() });
        return rafId;
    }

    cancelRAF(rafId) {
        if (this.#rafs.has(rafId)) {
            cancelAnimationFrame(rafId);
            this.#rafs.delete(rafId);
        }
    }

    /**
     * لایه ۵: ثبت‌نام متمرکز رویدادها (Event Subscription Guard)
     * جلوگیری از اتصال رویدادهای تکراری روی window یا Canvas که به DOM نشت می‌کنند
     */
    bindEvent(target, eventType, handler, options = {}, tag = 'runtime') {
        const boundItem = {
            target: new WeakRef(target),
            eventType,
            handler,
            options,
            tag
        };

        target.addEventListener(eventType, handler, options);
        this.#eventListeners.add(boundItem);
        return boundItem;
    }

    unbindEvent(boundItem) {
        if (!this.#eventListeners.has(boundItem)) return;
        const target = boundItem.target.deref();
        if (target) {
            target.removeEventListener(boundItem.eventType, boundItem.handler, boundItem.options);
        }
        boundItem.handler = null;
        this.#eventListeners.delete(boundItem);
    }

    /**
     * لایه ۶: استخر اشیاء بهینه (High-Performance Zero-Allocation Object Pool)
     * حذف Allocations درون حلقه‌های ۶۰ فریم (مانند ذرات، تیرها و دشمنان)
     */
    registerPool(poolName, factoryFn, resetFn, initialSize = 32) {
        const pool = {
            free: [],
            busy: new Set(),
            factory: factoryFn,
            reset: resetFn
        };

        for (let i = 0; i < initialSize; i++) {
            pool.free.push(factoryFn());
        }

        this.#objectPools.set(poolName, pool);
    }

    acquire(poolName) {
        const pool = this.#objectPools.get(poolName);
        if (!pool) throw new Error(`[MemoryGuard] Unknown Pool: ${poolName}`);

        let obj;
        if (pool.free.length > 0) {
            obj = pool.free.pop();
        } else {
            // گسترش کنترل‌شده و هوشمند
            obj = pool.factory();
            this.#metrics.pooledAllocations++;
        }

        pool.busy.add(obj);
        return obj;
    }

    release(poolName, obj) {
        const pool = this.#objectPools.get(poolName);
        if (!pool || !pool.busy.has(obj)) return;

        pool.busy.delete(obj);
        pool.reset(obj);
        pool.free.push(obj);
        this.#metrics.reclaimedObjects++;
    }

    /**
     * لایه ۷: الگوریتم O(1) هرس آرایه‌ها (Fast Cull / Swap-and-Pop)
     * جایگزین متد پرهزینه splice() جهت جلوگیری از شیفت اندیس‌ها و شکستن ارجاعات چرخه‌ای
     */
    fastCull(entities, predicateToKeep) {
        let activeCount = entities.length;
        for (let i = 0; i < activeCount; ) {
            const entity = entities[i];
            if (!predicateToKeep(entity)) {
                // ابطال صریح فیلدها جهت تخلیه سریع توسط GC
                if (typeof entity.destroy === 'function') {
                    entity.destroy();
                }
                
                // Swap with the last active element
                const lastIdx = activeCount - 1;
                entities[i] = entities[lastIdx];
                entities[lastIdx] = null; // شکستن ارجاع
                activeCount--;
            } else {
                i++;
            }
        }
        entities.length = activeCount;
    }

    /**
     * لایه ۸: پاک‌سازی دسته‌ای بر اساس برچسب یا پاک‌سازی فراگیر (Scene Flush)
     */
    clearGroup(targetTag) {
        for (const [id, meta] of this.#timers.entries()) {
            if (meta.tag === targetTag) this.clearTimeout(id);
        }
        for (const [id, meta] of this.#intervals.entries()) {
            if (meta.tag === targetTag) this.clearInterval(id);
        }
        for (const [id, meta] of this.#rafs.entries()) {
            if (meta.tag === targetTag) this.cancelRAF(id);
        }
        for (const boundItem of [...this.#eventListeners]) {
            if (boundItem.tag === targetTag) this.unbindEvent(boundItem);
        }
    }

    purgeAll() {
        // ۱. ابطال تمامی تایمرها
        for (const id of this.#timers.keys()) clearTimeout(id);
        this.#timers.clear();

        for (const id of this.#intervals.keys()) clearInterval(id);
        this.#intervals.clear();

        for (const id of this.#rafs.keys()) cancelAnimationFrame(id);
        this.#rafs.clear();

        // ۲. جداسازی تمام Event Listener ها
        for (const boundItem of this.#eventListeners) {
            const target = boundItem.target.deref();
            if (target) {
                target.removeEventListener(boundItem.eventType, boundItem.handler, boundItem.options);
            }
            boundItem.handler = null;
        }
        this.#eventListeners.clear();

        // ۳. ریست استخرهای اشیاء
        for (const pool of this.#objectPools.values()) {
            for (const busyObj of pool.busy) {
                pool.reset(busyObj);
                pool.free.push(busyObj);
            }
            pool.busy.clear();
        }
    }

    /**
     * لایه ۹: مکانیزم Watchdog خودکار و پایش تلمتری Heap
     */
    #initWatchdog() {
        this.#watchdogTimer = setInterval(() => {
            this.#auditMemory();
        }, 5000);

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.dispose());
        }
    }

    #auditMemory() {
        if (typeof performance !== 'undefined' && performance.memory) {
            const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            this.#metrics.lastHeapSizeMB = Number(usedMB.toFixed(2));

            if (usedMB > this.#maxMemoryThresholdMB) {
                console.warn(`[MemoryGuard::ALERT] Heap Spike Detected: ${this.#metrics.lastHeapSizeMB}MB! Triggering emergency cache trim.`);
                this.#forcePurgeTag('cache');
                this.#metrics.interceptedLeaks++;
            }
        }
    }

    #forcePurgeTag(tag) {
        this.clearGroup(tag);
    }

    /**
     * لایه ۱۰: خروج ایمن و تخریب کامل (Zero Trace Teardown)
     */
    dispose() {
        if (this.#watchdogTimer) {
            clearInterval(this.#watchdogTimer);
            this.#watchdogTimer = null;
        }
        this.purgeAll();
        this.#objectPools.clear();
    }

    getStats() {
        return {
            activeTimeouts: this.#timers.size,
            activeIntervals: this.#intervals.size,
            activeRAFs: this.#rafs.size,
            trackedListeners: this.#eventListeners.size,
            metrics: { ...this.#metrics }
        };
    }
}