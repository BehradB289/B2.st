/**
 * Intelligent In-Memory Cache (LRU + TTL) & Token Bucket Rate Limiter
 * Studio: B2.st
 * Author: Senior Full-Stack Agent
 * 
 * High-performance, zero-dependency caching layer engineered for HTML5 60FPS gaming.
 * Features:
 * - O(1) LRU eviction policy using ES6 Map order semantics
 * - Millisecond-precision TTL expiration with lazy & active purging
 * - Canvas Offscreen Bitmap pre-rendering cache for dynamic sprite compilation
 * - Deterministic Token Bucket Rate Limiter for input actions and sound throttling
 * - Runtime performance telemetry (Hit ratio, miss rate, eviction counters)
 */

export class PerformanceCache {
    /**
     * @param {Object} options
     * @param {number} [options.maxEntries=200] - Max keys per cache namespace
     * @param {number} [options.defaultTTL=30000] - Default TTL in milliseconds
     * @param {string} [options.namespace='default'] - Scope identifier
     */
    constructor(options = {}) {
        this.maxEntries = options.maxEntries || 200;
        this.defaultTTL = options.defaultTTL || 30000;
        this.namespace = options.namespace || 'default';
        
        // Map preserves insertion order, ideal for O(1) LRU operations
        this.store = new Map();
        
        // Performance metrics
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            sets: 0,
            lastPurgeTime: performance.now()
        };
    }

    /**
     * Cache an item with custom or default TTL
     * @param {string} key 
     * @param {*} value 
     * @param {number} [ttl] - TTL in ms (optional)
     * @returns {PerformanceCache}
     */
    set(key, value, ttl = this.defaultTTL) {
        const now = performance.now();

        // If key already exists, refresh LRU position by re-inserting
        if (this.store.has(key)) {
            this.store.delete(key);
        } else if (this.store.size >= this.maxEntries) {
            // Evict least recently used (first item in Map iterator)
            const oldestKey = this.store.keys().next().value;
            this.store.delete(oldestKey);
            this.stats.evictions++;
        }

        this.store.set(key, {
            value,
            expiry: ttl > 0 ? now + ttl : Infinity,
            createdAt: now,
            accessCount: 0
        });

        this.stats.sets++;
        return this;
    }

    /**
     * Retrieve an item. Re-orders entry to most-recently-used position.
     * @param {string} key 
     * @returns {*|null}
     */
    get(key) {
        const record = this.store.get(key);

        if (!record) {
            this.stats.misses++;
            return null;
        }

        const now = performance.now();

        // Lazy TTL Check
        if (now > record.expiry) {
            this.store.delete(key);
            this.stats.misses++;
            return null;
        }

        // Refresh LRU position (delete & set at end)
        record.accessCount++;
        this.store.delete(key);
        this.store.set(key, record);

        this.stats.hits++;
        return record.value;
    }

    /**
     * Check existence without altering LRU order or hit statistics
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        const record = this.store.get(key);
        if (!record) return false;
        if (performance.now() > record.expiry) {
            this.store.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Remove explicit key
     * @param {string} key 
     * @returns {boolean}
     */
    delete(key) {
        return this.store.delete(key);
    }

    /**
     * Clear all cached items in this instance
     */
    clear() {
        this.store.clear();
        this.stats.hits = 0;
        this.stats.misses = 0;
        this.stats.evictions = 0;
        this.stats.sets = 0;
    }

    /**
     * Active purge of expired items to reclaim memory without waiting for access
     */
    purgeExpired() {
        const now = performance.now();
        for (const [key, record] of this.store.entries()) {
            if (now > record.expiry) {
                this.store.delete(key);
            }
        }
        this.stats.lastPurgeTime = now;
    }

    /**
     * Cache-aside helper or offscreen Canvas rendering accelerator.
     * Generates and caches dynamic sprite canvases once.
     * @param {string} key 
     * @param {number} width 
     * @param {number} height 
     * @param {Function} drawFn - (offscreenCtx) => void
     * @param {number} [ttl]
     * @returns {HTMLCanvasElement}
     */
    getOrRenderCanvas(key, width, height, drawFn, ttl = this.defaultTTL) {
        let canvas = this.get(key);
        if (canvas) {
            return canvas;
        }

        // Create detached offscreen canvas
        canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(width));
        canvas.height = Math.max(1, Math.floor(height));
        const ctx = canvas.getContext('2d', { alpha: true });
        
        // Pixel-art optimization
        ctx.imageSmoothingEnabled = false;

        // Render to offscreen canvas
        drawFn(ctx);

        this.set(key, canvas, ttl);
        return canvas;
    }

    /**
     * Memoize pure mathematical computations or collision queries
     * @param {Function} fn 
     * @param {Function} [keyResolver] 
     * @param {number} [ttl]
     * @returns {Function}
     */
    memoize(fn, keyResolver = null, ttl = this.defaultTTL) {
        const cache = this;
        return function (...args) {
            const cacheKey = keyResolver ? keyResolver(...args) : JSON.stringify(args);
            const cachedResult = cache.get(cacheKey);
            if (cachedResult !== null) {
                return cachedResult;
            }
            const computedResult = fn.apply(this, args);
            cache.set(cacheKey, computedResult, ttl);
            return computedResult;
        };
    }

    /**
     * Diagnostics snapshot
     * @returns {Object}
     */
    getTelemetry() {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRatio = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) + '%' : '0.00%';
        return {
            namespace: this.namespace,
            size: this.store.size,
            maxEntries: this.maxEntries,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRatio,
            evictions: this.stats.evictions,
            totalSets: this.stats.sets
        };
    }
}

/**
 * Token Bucket & Sliding Window Rate Limiter
 * Guards high-frequency game events (Jumps, Fireballs, Collision SFX, Network/Inputs)
 */
export class RateLimiter {
    constructor() {
        this.buckets = new Map();
        this.cooldowns = new Map();
        this.throttledEvents = 0;
    }

    /**
     * Token Bucket rate limiter (allows controlled bursts with steady continuous replenishment)
     * @param {string} actionKey - Distinct action identifier
     * @param {number} maxTokens - Bucket burst capacity
     * @param {number} refillRatePerSec - Tokens replenished per second
     * @returns {boolean} - True if allowed, false if rate limit exceeded
     */
    consume(actionKey, maxTokens = 1.0, refillRatePerSec = 2.0) {
        const now = performance.now();
        let bucket = this.buckets.get(actionKey);

        if (!bucket) {
            bucket = { tokens: maxTokens - 1.0, lastRefill: now };
            this.buckets.set(actionKey, bucket);
            return true;
        }

        // Refill tokens based on elapsed delta
        const deltaSec = (now - bucket.lastRefill) / 1000;
        bucket.tokens = Math.min(maxTokens, bucket.tokens + (deltaSec * refillRatePerSec));
        bucket.lastRefill = now;

        if (bucket.tokens >= 1.0) {
            bucket.tokens -= 1.0;
            return true;
        }

        this.throttledEvents++;
        return false;
    }

    /**
     * Sliding Window Debounce/Throttle
     * Ensures minimum millisecond interval between occurrences
     * @param {string} key 
     * @param {number} intervalMs 
     * @returns {boolean}
     */
    throttle(key, intervalMs) {
        const now = performance.now();
        const lastCall = this.cooldowns.get(key) || 0;

        if (now - lastCall >= intervalMs) {
            this.cooldowns.set(key, now);
            return true;
        }

        this.throttledEvents++;
        return false;
    }

    /**
     * Reset rate limiter registers
     */
    reset() {
        this.buckets.clear();
        this.cooldowns.clear();
        this.throttledEvents = 0;
    }
}

// Global Singleton instances for cross-engine consumption
export const globalSpriteCache = new PerformanceCache({
    namespace: 'sprites_prebaked',
    maxEntries: 128,
    defaultTTL: 0 // In-memory sprite bitmaps live for session duration
});

export const globalPhysicsCache = new PerformanceCache({
    namespace: 'spatial_cache',
    maxEntries: 300,
    defaultTTL: 100 // Short TTL for dynamic spatial calculations
});

export const globalActionLimiter = new RateLimiter();