/**
 * Unit Tests for PerformanceCache & RateLimiter
 * Studio: B2.st
 */
import { TestRunner, assertEqual, assertTrue, assertFalse } from './test_runner.js';
import { PerformanceCache, RateLimiter } from '../src/core/performance_cache.js';

export function registerCacheTests(runner) {
    runner.test('Cache: Store and retrieve value', () => {
        const cache = new PerformanceCache({ maxEntries: 10, defaultTTL: 5000 });
        cache.set('mario_idle', { frame: 0 });
        const val = cache.get('mario_idle');
        assertTrue(val !== null, 'Value should exist in cache');
        assertEqual(val.frame, 0, 'Frame property should match');
    });

    runner.test('Cache: Respects TTL and expires item', async () => {
        const cache = new PerformanceCache({ maxEntries: 10, defaultTTL: 30 }); // 30ms TTL
        cache.set('temp_key', 42);
        assertTrue(cache.has('temp_key'), 'Key should exist initially');

        await new Promise(r => setTimeout(r, 45)); // Wait for expiration
        assertEqual(cache.get('temp_key'), null, 'Expired key should return null');
        assertFalse(cache.has('temp_key'), 'Expired key should report false in has()');
    });

    runner.test('Cache: Evicts oldest item on capacity overflow (LRU)', () => {
        const cache = new PerformanceCache({ maxEntries: 3, defaultTTL: 10000 });
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);

        // Access 'a' so 'b' becomes least recently used
        cache.get('a');

        // Add 'd', which should trigger eviction of 'b'
        cache.set('d', 4);

        assertTrue(cache.has('a'), 'Key "a" should be retained');
        assertFalse(cache.has('b'), 'Key "b" should have been evicted');
        assertTrue(cache.has('c'), 'Key "c" should be retained');
        assertTrue(cache.has('d'), 'Key "d" should be present');
    });

    runner.test('Cache: Accurately records hit/miss telemetry', () => {
        const cache = new PerformanceCache({ maxEntries: 10 });
        cache.set('x', 100);
        cache.get('x'); // Hit
        cache.get('x'); // Hit
        cache.get('y'); // Miss

        const stats = cache.getStats();
        assertEqual(stats.hits, 2, 'Hits count');
        assertEqual(stats.misses, 1, 'Misses count');
        assertEqual(stats.hitRate, '66.7%', 'Hit rate percentage');
    });

    runner.test('Cache: Memoization wrapper avoids redundant function execution', () => {
        const cache = new PerformanceCache();
        let computeCount = 0;
        const expensiveSquare = cache.memoize((n) => {
            computeCount++;
            return n * n;
        });

        const r1 = expensiveSquare(5);
        const r2 = expensiveSquare(5);
        const r3 = expensiveSquare(5);

        assertEqual(r1, 25);
        assertEqual(r2, 25);
        assertEqual(r3, 25);
        assertEqual(computeCount, 1, 'Function must execute only once');
    });

    runner.test('RateLimiter: Allows within capacity and throttles when exhausted', () => {
        const limiter = new RateLimiter(2, 1); // 2 capacity, refills 1 token/sec
        assertTrue(limiter.allow('jump'), 'First jump allowed');
        assertTrue(limiter.allow('jump'), 'Second jump allowed');
        assertFalse(limiter.allow('jump'), 'Third jump within same frame must be throttled');
    });
}