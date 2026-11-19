/**
 * Intelligent In-Memory Performance Cache & Rate Limiter Engine
 * Studio: B2.st
 * 
 * Provides:
 * 1. High-speed LRU + TTL In-Memory Key-Value Caching
 * 2. Token-Bucket Algorithm Rate Limiter for game actions, physics bursts, and audio
 * 3. Memoization wrapper for high-frequency mathematical or rendering operations
 * 4. Cache telemetry & hit/miss metrics
 */

export class PerformanceCache {
    /**
     * @param {Object} options
     * @param {number} [options.maxEntries=512] Maximum cache capacity before LRU eviction
     * @param {number} [options.defaultTTL=15000] Time-to-live in milliseconds
     * @param {boolean} [options.enableTelemetry=true] Track hits, misses, and evictions
     */
    constructor(options = {}) {
        this.maxEntries = options.maxEntries || 512;
        this.defaultTTL = options.defaultTTL || 15000;
        this.enableTelemetry = options.enableTelemetry !== false;

        // Map maintains insertion/access order for LRU implementation
        this.store = new Map();

        // Metrics
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
        this.createdTimestamp = Date.now();
    }

    /**
     * Store item in cache with optional custom TTL
     * @param {string} key
     * @param {*} value
     * @param {number} [ttl] Custom TTL in ms (0 = permanent until LRU eviction)
     */
    set(key, value, ttl = this.defaultTTL) {
        if (this.store.has(key)) {
            this.store.delete(key);
        } else if (this.store.size >= this.maxEntries) {
            // Evict oldest item (First key in iterator)
            const oldestKey = this.store.keys().next().value;
            this.store.delete(oldestKey);
            if (this.enableTelemetry) this.evictions++;
        }

        const expiresAt = ttl > 0 ? Date.now() + ttl : Infinity;
        this.store.set(key, { value, expiresAt });
        return value;
    }

    /**
     * Retrieve item from cache with TTL validation & LRU reordering
     * @param {string} key
     * @returns {*|null}
     */
    get(key) {
        if (!this.store.has(key)) {
            if (this.enableTelemetry) this.misses++;
            return null;
        }

        const entry = this.store.get(key);
        const now = Date.now();

        if (entry.expiresAt <= now) {
            // Expired entry
            this.store.delete(key);
            if (this.enableTelemetry) this.misses++;
            return null;
        }

        // Re-insert to refresh LRU status
        this.store.delete(key);
        this.store.set(key, entry);

        if (this.enableTelemetry) this.hits++;
        return entry.value;
    }

    /**
     * Checks existence without updating LRU or metrics
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        if (!this.store.has(key)) return false;
        const entry = this.store.get(key);
        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Delete explicit key
     * @param {string} key
     * @returns {boolean}
     */
    delete(key) {
        return this.store.delete(key);
    }

    /**
     * Clear all cached items
     */
    clear() {
        this.store.clear();
    }

    /**
     * Periodic house-keeping to remove stale keys
     * @returns {number} Number of cleaned items
     */
    purgeExpired() {
        const now = Date.now();
        let purged = 0;
        for (const [key, entry] of this.store.entries()) {
            if (entry.expiresAt <= now) {
                this.store.delete(key);
                purged++;
            }
        }
        return purged;
    }

    /**
     * Memoizes an expensive function computation with TTL caching
     * @param {Function} fn
     * @param {Function} [keyResolver] Function to derive cache key from arguments
     * @param {number} [ttl]
     * @returns {Function}
     */
    memoize(fn, keyResolver = (...args) => JSON.stringify(args), ttl = this.defaultTTL) {
        return (...args) => {
            const cacheKey = keyResolver(...args);
            const cached = this.get(cacheKey);
            if (cached !== null) {
                return cached;
            }
            const result = fn(...args);
            this.set(cacheKey, result, ttl);
            return result;
        };
    }

    /**
     * Get performance telemetry data
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(1) : '0.0';
        return {
            size: this.store.size,
            maxEntries: this.maxEntries,
            hits: this.hits,
            misses: this.misses,
            evictions: this.evictions,
            hitRate: `${hitRate}%`
        };
    }
}

/**
 * Token-Bucket Rate Limiter
 * Ensures critical game actions (sound triggers, heavy particle emitters, jump inputs)
 * do not overload execution threads or browser frame budgets.
 */
export class RateLimiter {
    /**
     * @param {number} capacity Max tokens in the bucket
     * @param {number} refillRate Tokens added per second
     */
    constructor(capacity = 10, refillRate = 5) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.buckets = new Map();
    }

    /**
     * Consume token for a given action key
     * @param {string} actionKey
     * @param {number} [cost=1]
     * @returns {boolean} True if action allowed, False if throttled
     */
    allow(actionKey, cost = 1) {
        const now = Date.now();
        let bucket = this.buckets.get(actionKey);

        if (!bucket) {
            bucket = { tokens: this.capacity, lastRefill: now };
            this.buckets.set(actionKey, bucket);
        }

        // Refill tokens according to elapsed time
        const elapsedSec = (now - bucket.lastRefill) / 1000;
        bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSec * this.refillRate);
        bucket.lastRefill = now;

        if (bucket.tokens >= cost) {
            bucket.tokens -= cost;
            return true;
        }

        return false;
    }

    /**
     * Reset specific bucket
     * @param {string} actionKey
     */
    reset(actionKey) {
        this.buckets.delete(actionKey);
    }
}