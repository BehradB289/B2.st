/**
 * Unit Tests for Physics Engine and Collisions
 * Studio: B2.st
 */
import { TestRunner, assertEqual, assertTrue, assertFalse } from './test_runner.js';
import { PhysicsEngine } from '../src/engine/physics.js';
import { Entity } from '../src/entities/entity.js';

export function registerPhysicsTests(runner) {
    runner.test('Physics: AABB detects overlapping bounding boxes', () => {
        const boxA = { x: 10, y: 10, width: 16, height: 16 };
        const boxB = { x: 20, y: 15, width: 16, height: 16 };
        const boxC = { x: 100, y: 100, width: 16, height: 16 };

        assertTrue(PhysicsEngine.checkAABB(boxA, boxB), 'Box A and B must overlap');
        assertFalse(PhysicsEngine.checkAABB(boxA, boxC), 'Box A and C must not overlap');
    });

    runner.test('Physics: Gravity acceleration applies correctly over dt', () => {
        const physics = new PhysicsEngine();
        const entity = new Entity(0, 0, 16, 16);
        entity.isDynamic = true;
        entity.vy = 0;

        const dt = 0.1;
        physics.applyForces(entity, dt);

        // vy = 0 + 980 * 0.1 = 98
        assertEqual(Math.round(entity.vy), 98, 'Vertical velocity after gravity integration');
    });

    runner.test('Physics: Collision resolution calculates top collision (stomp)', () => {
        const mario = { x: 20, y: 10, width: 16, height: 16 };
        const goomba = { x: 20, y: 24, width: 16, height: 16 };

        const result = PhysicsEngine.resolveEntityCollision(mario, goomba);
        assertTrue(result !== null, 'Collision occurred');
        assertEqual(result.side, 'top', 'Mario lands on top of Goomba');
    });
}

// Self-executing runner hook when executed in Node environment
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
if (isNode) {
    const runner = new TestRunner();
    import('./performance_cache.test.js').then(cacheTests => {
        cacheTests.registerCacheTests(runner);
        registerPhysicsTests(runner);
        runner.run();
    });
}