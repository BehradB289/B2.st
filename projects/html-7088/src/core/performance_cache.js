/**
 * @file performance_cache.js
 * @description Intelligent In-Memory Caching Engine with TTL, LRU eviction, and Token-Bucket Rate Limiter.
 * Engineered for B2.st High-Performance Gaming Systems.
 */

/**
 * In-Memory LRU Cache with Time-To-Live (TTL) and eviction policies.
 */
export class PerformanceCache {
  /**
   * @param {Object} options
   * @param {number} [options.maxSize=500] Maximum number of items in cache
   * @param {number} [options.defaultTTL=60000] Default TTL in milliseconds (0 = forever)
   */
  constructor(options = {}) {
    this.maxSize = Math.max(1, options.maxSize || 500);
    this.defaultTTL = options.defaultTTL ?? 60000;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Set a key-value pair with optional TTL.
   * Evicts least recently used (LRU) entry when limit is reached.
   * @param {string|number} key
   * @param {*} value
   * @param {number} [ttl=this.defaultTTL]
   */
  set(key, value, ttl = this.defaultTTL) {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      // Evict oldest entry (LRU via Map key iteration order)
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    const expiresAt = ttl > 0 ? Date.now() + ttl : null;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Retrieve an item from cache. Updates access order (LRU).
   * @param {string|number} key
   * @returns {*} Cached value or null if missing/expired
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    // Expiration check
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    // Refresh position for LRU
    this.store.delete(key);
    this.store.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Check if a valid, non-expired key exists without updating LRU or hits counter.
   * @param {string|number} key
   * @returns {boolean}
   */
  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete an entry explicitly.
   * @param {string|number} key
   * @returns {boolean}
   */
  delete(key) {
    return this.store.delete(key);
  }

  /**
   * Clear all cached items and counters.
   */
  clear() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Periodic garbage collection for expired entries.
   * @returns {number} Number of purged items
   */
  pruneExpired() {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        purged++;
      }
    }
    return purged;
  }

  /**
   * Memoize an expensive pure calculation.
   * @param {Function} fn Function to memoize
   * @param {Function} [keyResolver] Custom key generator
   * @param {number} [ttl=this.defaultTTL]
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
   * Get operational diagnostics.
   * @returns {{size: number, hits: number, misses: number, hitRatio: number}}
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total === 0 ? 0 : parseFloat(((this.hits / total) * 100).toFixed(1))
    };
  }
}

/**
 * Token Bucket and Sliding Window Rate Limiter.
 * Prevents input spamming, audio glitching, and event flood in games.
 */
export class RateLimiter {
  /**
   * @param {number} capacity Maximum burst tokens available
   * @param {number} refillRate Tokens restored per second
   */
  constructor(capacity = 10, refillRate = 2) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
    this.keyedWindows = new Map();
  }

  /**
   * Refill token bucket based on elapsed time.
   * @private
   */
  _refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillRate);
    this.lastRefill = now;
  }

  /**
   * Consume tokens if available.
   * @param {number} [cost=1]
   * @returns {boolean} True if allowed, false if limited
   */
  tryAcquire(cost = 1) {
    this._refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  /**
   * Throttle an individual keyed action (e.g. jump, sound effect, weapon fire).
   * @param {string} key Unique identifier for the action
   * @param {number} intervalMs Minimum wait between executions in ms
   * @param {Function} [callback] Function to invoke if allowed
   * @returns {boolean} True if executed/allowed
   */
  throttle(key, intervalMs, callback = null) {
    const now = Date.now();
    const lastExecution = this.keyedWindows.get(key) || 0;

    if (now - lastExecution >= intervalMs) {
      this.keyedWindows.set(key, now);
      if (typeof callback === 'function') {
        callback();
      }
      return true;
    }
    return false;
  }

  /**
   * Reset limiter state.
   */
  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.keyedWindows.clear();
  }
}