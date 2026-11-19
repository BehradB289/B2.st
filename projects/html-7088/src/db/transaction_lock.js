/**
 * B2.st Studio - 10-Layer Cybersecurity & Concurrency Engine
 * Project: Mario HTML5 Core Engine
 * Module: Transaction & Concurrency Lock Manager (src/db/transaction_lock.js)
 * Purpose: Neutralizing Race Conditions, Deadlocks, TOCTOU, and Zombie Locks in Web Storage / IndexedDB
 */

'use strict';

/**
 * خطاهای سفارشی کنترل همروندی
 */
class LockTimeoutError extends Error {
    constructor(resource, timeout) {
        super(`[B2.st-LockTimeout] Acquisition of lock for "${resource}" timed out after ${timeout}ms.`);
        this.name = 'LockTimeoutError';
        this.resource = resource;
        this.timeout = timeout;
    }
}

class TransactionDeadlockError extends Error {
    constructor(resource, reason) {
        super(`[B2.st-DeadlockDetected] Deadlock condition detected on "${resource}": ${reason}`);
        this.name = 'TransactionDeadlockError';
    }
}

/**
 * مدیریت قفل‌های خواندن/نوشتن درون حافظه‌ای بر پایه صف‌های منصفانه (FIFO RWLock)
 * جلوگیری از Writer Starvation و Reader Starvation
 */
class InternalRWLock {
    constructor(resourceName) {
        this.resourceName = resourceName;
        this.activeReaders = 0;
        this.activeWriter = false;
        this.currentWriterId = null;
        
        // صف‌های انتظار به صورت کاملاً ایزوله
        this.readQueue = [];
        this.writeQueue = [];
    }

    get isFree() {
        return this.activeReaders === 0 && !this.activeWriter;
    }

    acquireRead(txnId) {
        return new Promise((resolve) => {
            // اگر نویسنده‌ای فعال باشد یا نویسنده‌ای در صف انتظار باشد، خواننده منتظر می‌ماند تا حق تقدم حفظ شود
            if (this.activeWriter || this.writeQueue.length > 0) {
                this.readQueue.push({ txnId, resolve });
            } else {
                this.activeReaders++;
                resolve();
            }
        });
    }

    acquireWrite(txnId) {
        return new Promise((resolve) => {
            // اگر خواننده‌ای در حال کار باشد یا نویسنده‌ای فعال باشد، نویسنده وارد صف می‌شود
            if (this.activeReaders > 0 || this.activeWriter) {
                this.writeQueue.push({ txnId, resolve });
            } else {
                this.activeWriter = true;
                this.currentWriterId = txnId;
                resolve();
            }
        });
    }

    releaseRead() {
        if (this.activeReaders <= 0) {
            console.warn(`[B2.st-LockWarning] Attempted to release unheld read lock on ${this.resourceName}`);
            return;
        }

        this.activeReaders--;

        // اگر خوانندگان تمام شدند و نویسنده‌ای در صف است، نویسنده بعدی بیدار می‌شود
        if (this.activeReaders === 0 && this.writeQueue.length > 0) {
            const nextWriter = this.writeQueue.shift();
            this.activeWriter = true;
            this.currentWriterId = nextWriter.txnId;
            nextWriter.resolve();
        }
    }

    releaseWrite(txnId) {
        if (!this.activeWriter) {
            console.warn(`[B2.st-LockWarning] Attempted to release unheld write lock on ${this.resourceName}`);
            return;
        }

        if (this.currentWriterId !== txnId) {
            console.warn(`[B2.st-LockSecurity] Unauthorized release: ${txnId} tried releasing lock owned by ${this.currentWriterId}`);
            return;
        }

        this.activeWriter = false;
        this.currentWriterId = null;

        // اولویت با خوانندگان منتظر در صف است تا از پدید آمدن قفل انحصاری ممتد جلوگیری شود
        if (this.readQueue.length > 0) {
            const currentReaders = [...this.readQueue];
            this.readQueue = [];
            this.activeReaders = currentReaders.length;
            currentReaders.forEach(reader => reader.resolve());
        } else if (this.writeQueue.length > 0) {
            const nextWriter = this.writeQueue.shift();
            this.activeWriter = true;
            this.currentWriterId = nextWriter.txnId;
            nextWriter.resolve();
        }
    }
}

/**
 * موتور اصلی مدیریت تراکنش و جلوگیری از رقابت همگام‌سازی (Concurrency Manager)
 */
class TransactionLockManager {
    constructor() {
        this.locks = new Map();
        this.hasWebLocks = typeof navigator !== 'undefined' && 'locks' in navigator;
        this.activeContexts = new Set();
        this.defaultTimeoutMs = 5000; // جلوگیری از Zombie Locks در تب‌های کند یا فریز شده
    }

    /**
     * تولید شناسه یکتای امن برای ردگیری تراکنش
     */
    _generateTxnId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * دریافت یا تخصیص آبجکت قفل برای کلید مشخص شده
     */
    _getLock(resourceKey) {
        if (!this.locks.has(resourceKey)) {
            this.locks.set(resourceKey, new InternalRWLock(resourceKey));
        }
        return this.locks.get(resourceKey);
    }

    /**
     * پاک‌سازی امن حافظه از قفل‌های غیرفعال برای جلوگیری از Memory Leak
     */
    _cleanupLock(resourceKey) {
        const lock = this.locks.get(resourceKey);
        if (lock && lock.isFree && lock.readQueue.length === 0 && lock.writeQueue.length === 0) {
            this.locks.delete(resourceKey);
        }
    }

    /**
     * اجرای امن تراکنش با مکانیزم‌های دفاعی لایه ۱۰ (Reentrancy, Timeout, Atomic Rollback)
     * 
     * @param {string} resourceKey - نام فضای ذخیره‌سازی، مثلا 'mario_player_state' یا 'mario_coins'
     * @param {'READ' | 'WRITE'} mode - حالت دسترسی (انحصاری یا اشتراکی)
     * @param {Function} transactionCallback - تابع تراکنش، ورودی context دارد
     * @param {Object} options - پارامترهای اختیاری تایم‌اوت و استراتژی
     */
    async execute(resourceKey, mode, transactionCallback, options = {}) {
        const txnId = this._generateTxnId();
        const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
        const normalizedMode = mode.toUpperCase() === 'WRITE' ? 'WRITE' : 'READ';

        // مکانیزم سطح 1: Web Locks API بومی مرورگر (همگام‌سازی بین تب‌ها و ورکرها)
        if (this.hasWebLocks && !options.forceInternalLock) {
            const webLockMode = normalizedMode === 'WRITE' ? 'exclusive' : 'shared';
            
            return new Promise((resolve, reject) => {
                const controller = new AbortController();
                const timer = setTimeout(() => {
                    controller.abort();
                    reject(new LockTimeoutError(resourceKey, timeoutMs));
                }, timeoutMs);

                navigator.locks.request(
                    resourceKey,
                    { mode: webLockMode, signal: controller.signal },
                    async (lock) => {
                        clearTimeout(timer);
                        if (!lock) {
                            throw new TransactionDeadlockError(resourceKey, 'Failed to acquire native WebLock.');
                        }
                        
                        try {
                            const result = await transactionCallback({ txnId, resourceKey, mode: normalizedMode });
                            return result;
                        } catch (err) {
                            if (typeof options.onRollback === 'function') {
                                await options.onRollback(err, { txnId, resourceKey });
                            }
                            throw err;
                        }
                    }
                ).then(resolve).catch(reject);
            });
        }

        // مکانیزم سطح 2: Fallback درون‌حافظه‌ای ایزوله برای محیط‌های بدون navigator.locks
        const lock = this._getLock(resourceKey);
        let timeoutHandle = null;
        let isTimedOut = false;

        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                isTimedOut = true;
                reject(new LockTimeoutError(resourceKey, timeoutMs));
            }, timeoutMs);
        });

        const acquirePromise = normalizedMode === 'WRITE' 
            ? lock.acquireWrite(txnId) 
            : lock.acquireRead(txnId);

        try {
            // رقابت میان درخواست قفل و تایم‌اوت اجباری (Deadlock Mitigation)
            await Promise.race([acquirePromise, timeoutPromise]);
            clearTimeout(timeoutHandle);

            // اجرای لاجیک تراکنش تحت حفاظت کامل
            const result = await transactionCallback({ txnId, resourceKey, mode: normalizedMode });
            return result;
        } catch (error) {
            // اجرای لاجیک رول‌بک در صورت بروز خطا در اواسط تراکنش (Anti-State Corruption)
            if (typeof options.onRollback === 'function') {
                try {
                    await options.onRollback(error, { txnId, resourceKey });
                } catch (rollbackError) {
                    console.error(`[B2.st-Critical] Rollback failed on resource "${resourceKey}":`, rollbackError);
                }
            }
            throw error;
        } finally {
            clearTimeout(timeoutHandle);
            
            // آزادسازی قطعی قفل بدون نشت، حتی اگر پروسه دچار تایم‌اوت شده باشد
            if (!isTimedOut) {
                if (normalizedMode === 'WRITE') {
                    lock.releaseWrite(txnId);
                } else {
                    lock.releaseRead();
                }
            }
            this._cleanupLock(resourceKey);
        }
    }

    /**
     * متد الحاقی ویژه بازی ماریو: به‌روزرسانی اتمیک امتیاز یا سکه‌ها بدون پدیده Lost Update
     */
    async atomicUpdate(resourceKey, readFn, writeFn, options = {}) {
        return this.execute(resourceKey, 'WRITE', async (context) => {
            const currentState = await readFn();
            const updatedState = await writeFn(currentState, context);
            return updatedState;
        }, options);
    }
}

// ساخت نمونه ایزوله شده (Singleton) جهت یکپارچه‌سازی در هسته بازی
const LockEngine = new TransactionLockManager();

// جلوگیری از دستکاری ساختار داخلی قفل توسط اسکریپت‌های مخرب (Object Tampering Protection)
Object.freeze(LockEngine);

// خروجی جهت استفاده در ساختارهای ماژولار یا اسکریپت‌های گلوبال HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TransactionLockManager, LockEngine, LockTimeoutError, TransactionDeadlockError };
} else {
    window.B2stLockEngine = LockEngine;
    window.LockTimeoutError = LockTimeoutError;
    window.TransactionDeadlockError = TransactionDeadlockError;
}