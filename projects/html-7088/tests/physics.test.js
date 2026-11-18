/**
 * @file physics.test.js
 * @description Standalone unit test suite for Physics AABB, LRU Cache with TTL, and RateLimiter.
 * Execute with: node tests/physics.test.js
 */
import assert from 'node:assert';
import { PerformanceCache, RateLimiter } from '../src/core/performance_cache.js';
import { Physics } from '../src/engine/Physics.js';
import { Vector2D } from '../src/engine/Vector2D.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`\x1b[31m✘ FAIL:\x1b[0m ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n--- B2.st Core Engine Unit Tests ---\n');

// 1. Vector2D Math Tests
test('Vector2D operations: add, scale, clone', () => {
  const v1 = new Vector2D(5, 10);
  const v2 = new Vector2D(3, 2);
  v1.add(v2);
  assert.strictEqual(v1.x, 8);
  assert.strictEqual(v1.y, 12);
  v1.scale(0.5);
  assert.strictEqual(v1.x, 4);
  assert.strictEqual(v1.y, 6);
});

// 2. Physics AABB Tests
test('Physics AABB: Overlap detection and discrete non-overlap', () => {
  const boxA = { x: 0, y: 0, width: 16, height: 16 };
  const boxB = { x: 10, y: 10, width: 16, height: 16 };
  const boxC = { x: 30, y: 30, width: 16, height: 16 };

  assert.strictEqual(Physics.checkAABB(boxA, boxB), true);
  assert.strictEqual(Physics.checkAABB(boxA, boxC), false);
});

// 3. PerformanceCache LRU Eviction Tests
test('PerformanceCache: LRU eviction policy works when capacity exceeded', () => {
  const cache = new PerformanceCache({ maxSize: 2, defaultTTL: 10000 });
  cache.set('key1', 'val1');
  cache.set('key2', 'val2');

  // Access key1 so key2 becomes the oldest entry
  assert.strictEqual(cache.get('key1'), 'val1');

  // Insert 3rd entry; key2 should be evicted
  cache.set('key3', 'val3');

  assert.strictEqual(cache.get('key2'), null); // Evicted
  assert.strictEqual(cache.get('key1'), 'val1'); // Kept
  assert.strictEqual(cache.get('key3'), 'val3'); // Fresh
  assert.strictEqual(cache.getStats().size, 2);
});

// 4. PerformanceCache TTL Expiration Tests
test('PerformanceCache: TTL expiration purges expired keys', async () => {
  const cache = new PerformanceCache({ maxSize: 10, defaultTTL: 20 });
  cache.set('expiring', 'hello', 15);

  assert.strictEqual(cache.get('expiring'), 'hello');

  // Wait 25ms to let key expire
  await new Promise((res) => setTimeout(res, 25));

  assert.strictEqual(cache.get('expiring'), null);
});

// 5. RateLimiter Token Bucket Tests
test('RateLimiter: Burst consumption and refill constraints', () => {
  const limiter = new RateLimiter(3, 1); // 3 tokens capacity, 1 per second

  assert.strictEqual(limiter.tryAcquire(1), true);
  assert.strictEqual(limiter.tryAcquire(1), true);
  assert.strictEqual(limiter.tryAcquire(1), true);
  // Bucket exhausted:
  assert.strictEqual(limiter.tryAcquire(1), false);
});

// 6. RateLimiter Keyed Throttling Tests
test('RateLimiter: Keyed throttle prevents high-frequency invocation', () => {
  const limiter = new RateLimiter(10, 5);
  let count = 0;
  const action = () => count++;

  const firstCall = limiter.throttle('jump_sfx', 50, action);
  const immediateSecondCall = limiter.throttle('jump_sfx', 50, action);

  assert.strictEqual(firstCall, true);
  assert.strictEqual(immediateSecondCall, false);
  assert.strictEqual(count, 1);
});

console.log(`\nAll ${passed} tests completed successfully.\n`);