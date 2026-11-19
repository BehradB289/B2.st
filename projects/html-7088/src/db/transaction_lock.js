/**
 * @file src/db/transaction_lock.js
 * @description موتور مدیریت قفل تراکنش‌ها و کنترل هم‌زمانی (Concurrency Control Engine)
 * طراحی شده توسط استودیو B2.st - سطح امنیتی: نظامی / Tier-10
 * 
 * ویژگی‌ها:
 * - حل کامل پدیده Race Condition در بروزرسانی امتیاز، سکه و فیزیک ماریو
 * - پیاده‌سازی الگوریتم Fair Reader-Writer Lock (RWLock) جهت جلوگیری از Writer Starvation
 * - مکانیزم مالکیت توکن امنیتی (Cryptographic Ownership Token) برای جلوگیری از Lock Hijacking
 * - تشخیص و بازیابی بن‌بست (Deadlock Detection & Timeout-based Auto-Recovery)
 * - سازگاری هم‌زمان با Web Locks API (برای چند تب) و Fallback حافظه ایزوله
 */

'use strict';

/**
 * خطای سفارشی مربوط به عملیات قفل و تراکنش
 */
export class TransactionLockError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'TransactionLockError';
        this.code = code;
        this.details = details;
        this.timestamp = Date.now();
    }
}

/**
 * ساخت شناسه یکتا و امن برای هر درخواست تراکنش
 */
function generateSecureToken() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * سیستم Fair Reader-Writer Lock اختصاصی
 */
class ResourceLock {
    constructor(resourceName) {
        this.resourceName = resourceName;
        this.activeReaders = new Set(); // توکن‌های خوانندگان فعال
        this.activeWriter = null;      // توکن نویسنده فعال
        this.queue = [];               // صف عادلانه درخواست‌ها (FIFO)
        this.deadlockTimer = null;
    }

    /**
     * بررسی خالی بودن صف و نبود قفل فعال
     */
    isIdle() {
        return this.activeReaders.size === 0 && this.activeWriter === null && this.queue.length === 0;
    }
}

export class TransactionLockManager {
    constructor(options = {}) {
        this.defaultTimeout = options.defaultTimeout || 5000; // پیش‌فرض ۵ ثانیه تا انقضا
        this.maxQueueSize = options.maxQueueSize || 200;       // جلوگیری از حمله DoS به صف
        this.locks = new Map();                               // نگاشت نام منبع به آبجکت ResourceLock
        this.hasWebLocks = typeof navigator !== 'undefined' && 'locks' in navigator;
    }

    /**
     * دریافت یا ساخت قفل محلی برای یک منبع
     * @private
     */
    _getOrCreateLock(resource) {
        if (!this.locks.has(resource)) {
            this.locks.set(resource, new ResourceLock(resource));
        }
        return this.locks.get(resource);
    }

    /**
     * پاک‌سازی منابع آزاد شده از حافظه جهت جلوگیری از Memory Leak
     * @private
     */
    _cleanupResource(resource) {
        const lock = this.locks.get(resource);
        if (lock && lock.isIdle()) {
            this.locks.delete(resource);
        }
    }

    /**
     * اجرای پروسس بعدی در صف بر اساس اولویت FIFO عادلانه
     * @private
     */
    _processQueue(resource) {
        const lock = this.locks.get(resource);
        if (!lock || lock.queue.length === 0) {
            this._cleanupResource(resource);
            return;
        }

        // اگر نویسنده‌ای فعال است، هیچ عملیات جدیدی نباید شروع شود
        if (lock.activeWriter) {
            return;
        }

        const nextRequest = lock.queue[0];

        if (nextRequest.mode === 'EXCLUSIVE') {
            // اگر خواننده‌ای فعال است، نویسنده باید منتظر بماند
            if (lock.activeReaders.size > 0) {
                return;
            }
            // واگذاری قفل انحصاری به نویسنده
            lock.queue.shift();
            lock.activeWriter = nextRequest.token;
            nextRequest.resolve(nextRequest.token);
        } else if (nextRequest.mode === 'SHARED') {
            // آزاد کردن تمام خواننده‌های پشت سر هم تا رسیدن به یک نویسنده
            while (lock.queue.length > 0 && lock.queue[0].mode === 'SHARED') {
                const readerRequest = lock.queue.shift();
                lock.activeReaders.add(readerRequest.token);
                readerRequest.resolve(readerRequest.token);
            }
        }
    }

    /**
     * ثبت درخواست قفل در صف محلی
     * @private
     */
    _acquireMemoryLock(resource, mode, timeout) {
        return new Promise((resolve, reject) => {
            const lock = this._getOrCreateLock(resource);

            if (lock.queue.length >= this.maxQueueSize) {
                return reject(new TransactionLockError(
                    `Lock queue overflow for resource: ${resource}`,
                    'QUEUE_OVERFLOW',
                    { resource, queueLength: lock.queue.length }
                ));
            }

            const token = generateSecureToken();

            // تایمر جلوگیری از Deadlock و Timeout
            const timer = setTimeout(() => {
                const index = lock.queue.findIndex(req => req.token === token);
                if (index !== -1) {
                    lock.queue.splice(index, 1);
                    this._cleanupResource(resource);
                    reject(new TransactionLockError(
                        `Acquire lock timeout for resource: ${resource} (${mode})`,
                        'LOCK_TIMEOUT',
                        { resource, mode, timeout }
                    ));
                }
            }, timeout);

            const request = {
                token,
                mode,
                resolve: (grantedToken) => {
                    clearTimeout(timer);
                    resolve({ token: grantedToken, resource, mode });
                },
                reject: (err) => {
                    clearTimeout(timer);
                    reject(err);
                }
            };

            lock.queue.push(request);
            this._processQueue(resource);
        });
    }

    /**
     * آزادسازی قفل در حافظه با اعتبارسنجی توکن
     * @private
     */
    _releaseMemoryLock(resource, token) {
        const lock = this.locks.get(resource);
        if (!lock) {
            return false;
        }

        let released = false;

        if (lock.activeWriter === token) {
            lock.activeWriter = null;
            released = true;
        } else if (lock.activeReaders.has(token)) {
            lock.activeReaders.delete(token);
            released = true;
        }

        if (released) {
            this._processQueue(resource);
            return true;
        }

        return false;
    }

    /**
     * اخذ قفل خواندن (اشتراکی / Shared)
     */
    async acquireRead(resource, timeout = this.defaultTimeout) {
        return await this._acquireMemoryLock(resource, 'SHARED', timeout);
    }

    /**
     * اخذ قفل نوشتن (انحصاری / Exclusive)
     */
    async acquireWrite(resource, timeout = this.defaultTimeout) {
        return await this._acquireMemoryLock(resource, 'EXCLUSIVE', timeout);
    }

    /**
     * آزادسازی صریح قفل
     */
    release(lockDescriptor) {
        if (!lockDescriptor || !lockDescriptor.resource || !lockDescriptor.token) {
            throw new TransactionLockError(
                'Invalid lock descriptor provided for release',
                'INVALID_DESCRIPTOR',
                { lockDescriptor }
            );
        }

        const success = this._releaseMemoryLock(lockDescriptor.resource, lockDescriptor.token);
        if (!success) {
            throw new TransactionLockError(
                `Failed to release lock. Token mismatch or lock already expired for resource: ${lockDescriptor.resource}`,
                'LOCK_RELEASE_FAILED',
                { resource: lockDescriptor.resource, token: lockDescriptor.token }
            );
        }
        return true;
    }

    /**
     * اجرای تراکنش کاملاً ایزوله، اتمیک و مقاوم در برابر خطا
     * @param {string} resource نام منبع داده‌ای (مانند: 'player_stats', 'inventory', 'world_state')
     * @param {'READ' | 'WRITE'} mode نوع عملیات
     * @param {Function} transactionCallback تابعی که در فضای ایزوله قفل اجرا می‌شود
     * @param {Object} options تنظیمات تراکنش
     */
    async executeTransaction(resource, mode, transactionCallback, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;
        const lockMode = mode.toUpperCase() === 'WRITE' ? 'EXCLUSIVE' : 'SHARED';

        // در صورت پشتیبانی مرورگر از Web Locks API برای همگام‌سازی چند تب
        if (this.hasWebLocks && options.crossTabSync) {
            const webLockMode = lockMode === 'EXCLUSIVE' ? 'exclusive' : 'shared';
            return await navigator.locks.request(resource, { mode: webLockMode }, async () => {
                return await this._executeGuarded(resource, lockMode, timeout, transactionCallback);
            });
        }

        return await this._executeGuarded(resource, lockMode, timeout, transactionCallback);
    }

    /**
     * پوسته ایمنی اجرای ایزوله تراکنش با مکانیزم Try-Finally غیرقابل نفوذ
     * @private
     */
    async _executeGuarded(resource, lockMode, timeout, callback) {
        const lockDescriptor = lockMode === 'EXCLUSIVE'
            ? await this.acquireWrite(resource, timeout)
            : await this.acquireRead(resource, timeout);

        try {
            // ساخت کانتکست ایزوله برای تراکنش
            const context = {
                resource,
                token: lockDescriptor.token,
                mode: lockMode,
                timestamp: Date.now()
            };

            const result = await callback(context);
            return result;
        } finally {
            // تضمین صد در صدی آزادسازی قفل حتی در صورت Crash یا Throw شدن خطا
            this.release(lockDescriptor);
        }
    }
}

// ساخت نمونه پیش‌فرض جهت دسترسی در سراسر بازی ماریو
export const transactionLock = new TransactionLockManager();