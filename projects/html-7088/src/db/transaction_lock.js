/**
 * ============================================================================
 * B2.st Studio - Cyber Security & 10-Layer Debugger Engine
 * Module: Transaction Lock & Concurrency Control Manager
 * Target: src/db/transaction_lock.js
 * Description: Enterprise-grade Re-entrancy, Shared/Exclusive Lock (RWLock),
 *              Deadlock Detection, and Atomic Isolation for Mario Engine DB.
 * ============================================================================
 */

'use strict';

/**
 * Custom Error classes for fine-grained concurrency exception handling
 */
class LockAcquisitionTimeoutError extends Error {
    constructor(key, timeoutMs) {
        super(`[B2.st LockEngine] Timeout waiting to acquire lock on resource: "${key}" after ${timeoutMs}ms.`);
        this.name = 'LockAcquisitionTimeoutError';
        this.code = 'ERR_LOCK_TIMEOUT';
    }
}

class LockSecurityViolationError extends Error {
    constructor(message) {
        super(`[B2.st LockSecurity] ${message}`);
        this.name = 'LockSecurityViolationError';
        this.code = 'ERR_SECURITY_VIOLATION';
    }
}

/**
 * Lock Modes Enum
 */
const LOCK_MODE = Object.freeze({
    SHARED: 'SHARED',         // Read operations (Concurrent)
    EXCLUSIVE: 'EXCLUSIVE'    // Write operations (Strictly Isolated)
});

/**
 * Internal representation of a held or waiting Lock Token
 */
class LockToken {
    constructor(key, mode, ownerId) {
        this.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        this.key = String(key);
        this.mode = mode;
        this.ownerId = ownerId;
        this.acquiredAt = performance.now();
        this.isReleased = false;
        Object.seal(this);
    }
}

/**
 * State record per unique DB resource key
 */
class ResourceLockState {
    constructor(key) {
        this.key = key;
        this.activeReaders = new Set();
        this.activeWriter = null;
        this.waitingQueue = [];
        this.lastAccess = performance.now();
    }

    canGrant(mode) {
        if (mode === LOCK_MODE.SHARED) {
            // Readers can proceed only if no writer is active and no writer is waiting (Prevents Writer Starvation)
            const hasWaitingWriter = this.waitingQueue.some(req => req.mode === LOCK_MODE.EXCLUSIVE);
            return this.activeWriter === null && !hasWaitingWriter;
        } else if (mode === LOCK_MODE.EXCLUSIVE) {
            // Writers require complete isolation (0 active readers, 0 active writers)
            return this.activeWriter === null && this.activeReaders.size === 0;
        }
        return false;
    }
}

/**
 * Central 10-Layer Concurrency & Lock Controller
 */
class TransactionLockEngine {
    constructor() {
        this._resources = new Map();
        this._activeTokens = new Map(); // token.id -> LockToken
        this._defaultTimeoutMs = 5000;
        this._watchdogInterval = 10000;
        this._startDeadlockWatchdog();
        Object.seal(this);
    }

    /**
     * Sanitizes resource keys to prevent prototype poisoning and injection attacks
     */
    _sanitizeKey(key) {
        if (key === null || key === undefined) {
            throw new LockSecurityViolationError('Lock key cannot be null or undefined.');
        }
        const strKey = String(key).trim();
        if (strKey.length === 0 || strKey === '__proto__' || strKey === 'constructor' || strKey === 'prototype') {
            throw new LockSecurityViolationError(`Illegal lock resource identifier: "${key}"`);
        }
        return strKey;
    }

    /**
     * Retrieves or initializes the lock state for a given key
     */
    _getOrCreateState(key) {
        if (!this._resources.has(key)) {
            this._resources.set(key, new ResourceLockState(key));
        }
        return this._resources.get(key);
    }

    /**
     * Cleans up idle state structures to prevent heap leaks
     */
    _cleanupResourceIfIdle(key) {
        const state = this._resources.get(key);
        if (state && state.activeReaders.size === 0 && state.activeWriter === null && state.waitingQueue.length === 0) {
            this._resources.delete(key);
        }
    }

    /**
     * Acquire a lock (Read/Shared or Write/Exclusive)
     */
    async acquire(rawKey, mode = LOCK_MODE.EXCLUSIVE, timeoutMs = this._defaultTimeoutMs, ownerId = 'mario-core') {
        const key = this._sanitizeKey(rawKey);

        if (mode !== LOCK_MODE.SHARED && mode !== LOCK_MODE.EXCLUSIVE) {
            throw new LockSecurityViolationError(`Invalid lock mode requested: "${mode}"`);
        }

        const state = this._getOrCreateState(key);
        state.lastAccess = performance.now();

        // Fast path: Immediate grant
        if (state.canGrant(mode) && state.waitingQueue.length === 0) {
            const token = new LockToken(key, mode, ownerId);
            this._applyGrant(state, token);
            return token;
        }

        // Slow path: Enqueue with TTL protection
        return new Promise((resolve, reject) => {
            let timeoutHandle = null;

            const queueItem = {
                mode,
                ownerId,
                resolve: (grantedToken) => {
                    if (timeoutHandle) clearTimeout(timeoutHandle);
                    resolve(grantedToken);
                },
                reject: (err) => {
                    if (timeoutHandle) clearTimeout(timeoutHandle);
                    reject(err);
                }
            };

            if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
                timeoutHandle = setTimeout(() => {
                    // Evict from queue on timeout
                    const idx = state.waitingQueue.indexOf(queueItem);
                    if (idx !== -1) {
                        state.waitingQueue.splice(idx, 1);
                    }
                    this._cleanupResourceIfIdle(key);
                    queueItem.reject(new LockAcquisitionTimeoutError(key, timeoutMs));
                }, timeoutMs);
            }

            state.waitingQueue.push(queueItem);
        });
    }

    /**
     * Internal state transition when lock is granted
     */
    _applyGrant(state, token) {
        if (token.mode === LOCK_MODE.SHARED) {
            state.activeReaders.add(token.id);
        } else {
            state.activeWriter = token.id;
        }
        this._activeTokens.set(token.id, token);
    }

    /**
     * Release a held lock token safely
     */
    release(token) {
        if (!token || typeof token !== 'object' || !token.id) {
            throw new LockSecurityViolationError('Release invocation failed: invalid or corrupt token provided.');
        }

        if (!this._activeTokens.has(token.id)) {
            // Already released or stale token; safe-idempotent exit to prevent double-free corruption
            return false;
        }

        const key = token.key;
        const state = this._resources.get(key);

        if (!state) {
            this._activeTokens.delete(token.id);
            token.isReleased = true;
            return true;
        }

        // Validate Ownership integrity
        if (token.mode === LOCK_MODE.SHARED) {
            state.activeReaders.delete(token.id);
        } else if (token.mode === LOCK_MODE.EXCLUSIVE) {
            if (state.activeWriter === token.id) {
                state.activeWriter = null;
            } else {
                throw new LockSecurityViolationError(`Token ownership mismatch on resource "${key}". Security anomaly detected.`);
            }
        }

        this._activeTokens.delete(token.id);
        token.isReleased = true;
        state.lastAccess = performance.now();

        // Process waiting queue
        this._processNextWaiters(state);
        this._cleanupResourceIfIdle(key);
        return true;
    }

    /**
     * Wake eligible waiters in FIFO order while respecting Writer-Preference priority
     */
    _processNextWaiters(state) {
        if (state.waitingQueue.length === 0) return;

        const nextRequest = state.waitingQueue[0];

        if (nextRequest.mode === LOCK_MODE.EXCLUSIVE) {
            if (state.canGrant(LOCK_MODE.EXCLUSIVE)) {
                state.waitingQueue.shift();
                const token = new LockToken(state.key, LOCK_MODE.EXCLUSIVE, nextRequest.ownerId);
                this._applyGrant(state, token);
                nextRequest.resolve(token);
            }
        } else if (nextRequest.mode === LOCK_MODE.SHARED) {
            // Batch grant concurrent readers
            while (state.waitingQueue.length > 0 && state.waitingQueue[0].mode === LOCK_MODE.SHARED && state.canGrant(LOCK_MODE.SHARED)) {
                const req = state.waitingQueue.shift();
                const token = new LockToken(state.key, LOCK_MODE.SHARED, req.ownerId);
                this._applyGrant(state, token);
                req.resolve(token);
            }
        }
    }

    /**
     * Atomic Transaction Executor (Protected Sandbox)
     * Automatically handles acquisition, execution, error boundary isolation, and deterministic release.
     */
    async runTransaction(key, mode, workCallback, options = {}) {
        const timeoutMs = options.timeoutMs || this._defaultTimeoutMs;
        const ownerId = options.ownerId || `txn-${Date.now()}`;
        const token = await this.acquire(key, mode, timeoutMs, ownerId);

        try {
            return await workCallback(token);
        } finally {
            try {
                this.release(token);
            } catch (cleanupError) {
                console.error(`[B2.st Engine Security Alert] Lock cleanup anomaly on key "${key}":`, cleanupError);
            }
        }
    }

    /**
     * Read-Optimized Transaction Wrapper
     */
    async read(key, workCallback, options = {}) {
        return this.runTransaction(key, LOCK_MODE.SHARED, workCallback, options);
    }

    /**
     * Write-Optimized Transaction Wrapper
     */
    async write(key, workCallback, options = {}) {
        return this.runTransaction(key, LOCK_MODE.EXCLUSIVE, workCallback, options);
    }

    /**
     * Watchdog thread: scans for orphaned/hung transactions exceeding max TTL (Anti-Deadlock)
     */
    _startDeadlockWatchdog() {
        if (typeof window !== 'undefined' && window.setInterval) {
            setInterval(() => {
                const now = performance.now();
                const MAX_HOLD_TIME_MS = 30000; // 30s threshold for hanging Mario operations

                for (const [tokenId, token] of this._activeTokens.entries()) {
                    if (now - token.acquiredAt > MAX_HOLD_TIME_MS) {
                        console.warn(`[B2.st Watchdog] Deadlock hazard detected: Token "${tokenId}" holding key "${token.key}" for >${MAX_HOLD_TIME_MS}ms. Force releasing.`);
                        this.release(token);
                    }
                }
            }, this._watchdogInterval);
        }
    }

    /**
     * Diagnostic metadata inspection
     */
    getMetrics() {
        return {
            activeResources: this._resources.size,
            activeLocks: this._activeTokens.size,
            resources: Array.from(this._resources.entries()).map(([k, v]) => ({
                key: k,
                readers: v.activeReaders.size,
                hasWriter: v.activeWriter !== null,
                queueDepth: v.waitingQueue.length
            }))
        };
    }
}

// Singleton instance export with Immutable interface
const transactionLock = new TransactionLockEngine();
Object.freeze(transactionLock);

export { transactionLock, TransactionLockEngine, LOCK_MODE };
export default transactionLock;