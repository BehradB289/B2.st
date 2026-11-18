/**
 * Stand-alone Unit Test Suite for Physics, Collisions, Cache & Rate Limiter
 * Execution: node tests/physics_test.js
 * Layer: Testing Pipeline
 * Studio: B2.st
 */

import { PerformanceCache, RateLimiter } from '../src/core/performance_cache.js';
import { PhysicsEngine } from '../src/engine/physics.js';
import { Vector2D } from '../src/engine/vector.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runTests() {
  console.log('==================================================');
  console.log(' STUDIO B2.st - MARIO ENGINE UNIT TEST PIPELINE  ');
  console.log('==================================================\n');

  // 1. Vector2D Mathematics Test
  console.log('--- 1. Testing Vector2D Logic ---');
  const vecA = new Vector2D(10, 20);
  const vecB = new Vector2D(5, -5);
  vecA.add(vecB);
  assert(vecA.x === 15 && vecA.y === 15, 'Vector addition calculates correct coordinates');
  vecA.multiply(2);
  assert(vecA.x === 30 && vecA.y === 30, 'Vector scalar multiplication functions properly');

  // 2. AABB Collision Logic Test
  console.log('\n--- 2. Testing AABB Physics Collisions ---');
  const box1 = { x: 10, y: 10, width: 20, height: 20 };
  const box2 = { x: 25, y: 25, width: 20, height: 20 };
  const boxFar = { x: 100, y: 100, width: 10, height: 10 };

  assert(PhysicsEngine.checkAABB(box1, box2) === true, 'Overlapping bounding boxes report true collision');
  assert(PhysicsEngine.checkAABB(box1, boxFar) === false, 'Disjoint bounding boxes report false');

  // 3. PerformanceCache TTL & LRU Eviction Test
  console.log('\n--- 3. Testing In-Memory Cache (TTL & LRU) ---');
  const cache = new PerformanceCache({ maxSize: 2, defaultTTL: 100 });
  cache.set('item1', 'value1');
  cache.set('item2', 'value2');

  assert(cache.get('item1') === 'value1', 'Cache retrieval succeeds for active key');

  // Accessing item1 makes item2 the Least Recently Used
  cache.set('item3', 'value3'); // Evicts item2
  assert(cache.get('item2') === null, 'LRU correctly evicted item2 when capacity was exceeded');
  assert(cache.get('item1') === 'value1', 'item1 remained safe due to recent access');

  // Test TTL Expiration
  console.log('  Waiting 120ms to verify TTL eviction...');
  await new Promise(r => setTimeout(r, 120));
  assert(cache.get('item1') === null, 'Expired item with TTL has been purged');

  // 4. RateLimiter Verification
  console.log('\n--- 4. Testing RateLimiter (Token Bucket) ---');
  const limiter = new RateLimiter(2, 2); // 2 capacity, refills 2 per sec
  assert(limiter.tryAcquire(1) === true, 'First immediate token acquire succeeds');
  assert(limiter.tryAcquire(1) === true, 'Second immediate token acquire succeeds');
  assert(limiter.tryAcquire(1) === false, 'Exceeded token acquire is throttled');

  console.log('\n==================================================');
  console.log(' ALL TESTS PASSED SUCCESSFULLY! Ready for deployment. ');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});