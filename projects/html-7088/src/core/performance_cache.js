/**
 * Intelligent In-Memory Cache with TTL and LRU Eviction + Rate Limiter
 * Layer: Core Foundation
 * Studio: B2.st
 */

/**
 * Cache Item Node containing value, expiry timestamp, and access metadata
 */
class CacheItem {
  constructor(key, value, ttlMs) {
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.expiresAt = ttlMs > 0 ? this.createdAt + ttlMs : null;
    this.lastAccessed = this.createdAt;
    this.accessCount = 0;
  }

  isExpired() {
    return this.expiresAt !== null && Date.now() > this.expiresAt;
  }

  touch() {
    this.lastAccessed = Date.now();
    this.accessCount++;
  }
}

/**
 * High-performance In-Memory Cache with TTL & LRU Eviction
 */
export class PerformanceCache {
  /**
   * @param {Object} options
   * @param {number} [options.maxSize=256] - Max entries before LRU eviction
   * @param {number} [options.defaultTTL=0] - Default TTL in ms (0 = infinite)
   * @param {number} [options.autoPruneInterval=0] - Interval to auto-purge expired keys
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 256;
    this.defaultTTL = options.defaultTTL || 0;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      expirations: 0
    };

    if (options.autoPruneInterval && options.autoPruneInterval > 0) {
      this.pruneTimer = setInterval(() => this.prune(), options.autoPruneInterval);
    }
  }

  /**
   * Store a value with optional custom TTL
   * @param {string|number} key
   * @param {*} value
   * @param {number} [ttlMs]
   */
  set(key, value, ttlMs = this.defaultTTL) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict Least Recently Used (first item in Map iterator)
      const lruKey = this.cache.keys().next().value;
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
        this.stats.evictions++;
      }
    }

    const item = new CacheItem(key, value, ttlMs);
    this.cache.set(key, item);
    this.stats.sets++;
    return value;
  }

  /**
   * Retrieve an item from the cache
   * @param {string|number} key
   * @returns {*|null}
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.isExpired()) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    // Refresh LRU order (delete & re-insert)
    this.cache.delete(key);
    item.touch();
    this.cache.set(key, item);

    this.stats.hits++;
    return item.value;
  }

  /**
   * Check if a valid, non-expired key exists
   * @param {string|number} key
   * @returns {boolean}
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.isExpired()) {
      this.cache.delete(key);
      this.stats.expirations++;
      return false;
    }
    return true;
  }

  /**
   * Delete an item by key
   * @param {string|number} key
   * @returns {boolean}
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Prune all expired entries immediately
   * @returns {number} count of purged items
   */
  prune() {
    const now = Date.now();
    let purgedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt !== null && now > item.expiresAt) {
        this.cache.delete(key);
        this.stats.expirations++;
        purgedCount++;
      }
    }

    return purgedCount;
  }

  /**
   * Helper: memoize a heavy computation or canvas render
   * @param {string} cacheKey
   * @param {Function} factoryFn
   * @param {number} [ttlMs]
   */
  getOrCompute(cacheKey, factoryFn, ttlMs = this.defaultTTL) {
    const cached = this.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const computed = factoryFn();
    this.set(cacheKey, computed, ttlMs);
    return computed;
  }

  /**
   * Get metrics and hit/miss ratios
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Number(hitRate.toFixed(1)),
      evictions: this.stats.evictions,
      expirations: this.stats.expirations
    };
  }

  destroy() {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    this.cache.clear();
  }
}

/**
 * Token Bucket & Sliding Window Rate Limiter
 * Controls frequency of audio events, spam keys, and intensive recalculations.
 */
export class RateLimiter {
  /**
   * @param {number} capacity - Max bursts tokens available
   * @param {number} refillRatePerSec - Tokens added per second
   */
  constructor(capacity = 10, refillRatePerSec = 10) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRatePerSec;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    if (elapsedSeconds > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillRate);
      this.lastRefill = now;
    }
  }

  /**
   * Try to acquire tokens. Returns true if allowed, false if limited.
   * @param {number} [cost=1]
   * @returns {boolean}
   */
  tryAcquire(cost = 1) {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  /**
   * Creates a sliding-window rate limit checker for named keys
   * @param {number} maxCalls - Allowed hits per window
   * @param {number} windowMs - Time window in milliseconds
   */
  static createSlidingWindow(maxCalls = 5, windowMs = 500) {
    const timestampsMap = new Map();

    return function isAllowed(key = 'default') {
      const now = Date.now();
      let timestamps = timestampsMap.get(key) || [];
      timestamps = timestamps.filter(t => now - t < windowMs);

      if (timestamps.length < maxCalls) {
        timestamps.push(now);
        timestampsMap.set(key, timestamps);
        return true;
      }

      timestampsMap.set(key, timestamps);
      return false;
    };
  }

  /**
   * Throttles a function so it only runs at most once every `limitMs`
   * @param {Function} func
   * @param {number} limitMs
   */
  static throttle(func, limitMs) {
    let lastRan = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastRan >= limitMs) {
        lastRan = now;
        return func.apply(this, args);
      }
    };
  }
}