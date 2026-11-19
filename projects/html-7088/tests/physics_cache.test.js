/**
 * Test Suite: Performance Cache, Rate Limiter & AABB Physics
 * Studio: B2.st
 * Run with: node tests/physics_cache.test.js
 */

import { PerformanceCache, RateLimiter } from '../src/core/performance_cache.js';
import { Physics } from '../src/engine/Physics.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`\x1b[32m✔ PASS:\x1b[0m ${message}`);
        passed++;
    } else {
        console.error(`\x1b[31m✘ FAIL:\x1b[0m ${message}`);
        failed++;
    }
}

async function runTests() {
    console.log('\n--- [TEST SUITE 1: In-Memory Performance Cache (LRU + TTL)] ---');

    // 1. LRU Eviction Test
    const cache = new PerformanceCache({ maxEntries: 2, defaultTTL: 1000 });
    cache.set('a', 100);
    cache.set('b', 200);
    assert(cache.get('a') === 100, 'Retrieve key a should refresh LRU order');
    
    // Adding 3rd item must evict least recently used (which is 'b')
    cache.set('c', 300);
    assert(cache.get('b') === null, 'Key b must be evicted by LRU algorithm');
    assert(cache.get('a') === 100, 'Key a must remain in cache');
    assert(cache.get('c') === 300, 'Key c must be present');

    // 2. TTL Expiration Test
    const ttlCache = new PerformanceCache({ maxEntries: 10, defaultTTL: 50 });
    ttlCache.set('temp', 'secret', 40);
    assert(ttlCache.get('temp') === 'secret', 'Immediate fetch before TTL expiration');

    await new Promise(r => setTimeout(r, 60));
    assert(ttlCache.get('temp') === null, 'Fetch after TTL expiration must return null');

    // 3. Telemetry Verification
    const stats = cache.getTelemetry();
    assert(stats.hits > 0 && stats.evictions === 1, 'Telemetry accurate for hits and evictions');

    console.log('\n--- [TEST SUITE 2: Token Bucket Rate Limiter] ---');
    const limiter = new RateLimiter();
    
    // Burst test: Bucket size 2, refill 1/sec
    const req1 = limiter.consume('jump_action', 2, 1);
    const req2 = limiter.consume('jump_action', 2, 1);
    const req3 = limiter.consume('jump_action', 2, 1); // Exceeds burst capacity

    assert(req1 === true, 'Burst request 1 allowed');
    assert(req2 === true, 'Burst request 2 allowed');
    assert(req3 === false, 'Burst request 3 blocked by rate limiter');

    // Sliding Window Throttle
    const t1 = limiter.throttle('audio_sfx', 50);
    const t2 = limiter.throttle('audio_sfx', 50);
    assert(t1 === true, 'First audio trigger accepted');
    assert(t2 === false, 'Immediate second audio trigger rejected');

    console.log('\n--- [TEST SUITE 3: AABB Collision Engine] ---');
    const boxA = { x: 0, y: 0, width: 16, height: 16 };
    const boxB = { x: 10, y: 10, width: 16, height: 16 };
    const boxC = { x: 30, y: 30, width: 16, height: 16 };

    assert(Physics.checkAABB(boxA, boxB) === true, 'Overlapping boxes detected');
    assert(Physics.checkAABB(boxA, boxC) === false, 'Separated boxes correctly identified as non-colliding');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
}

runTests();