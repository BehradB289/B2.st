import { Vector2 } from '../src/engine/Vector2.js';
import { AABB } from '../src/engine/AABB.js';

export function runPhysicsTests(runner) {
  runner.describe('Physics Engine - Vector2 Math', () => {
    runner.test('Vector2 addition and scaling', () => {
      const v = new Vector2(10, 20);
      v.add(new Vector2(5, -5));
      runner.assertEqual(v.x, 15, 'Vector2 X should be 15');
      runner.assertEqual(v.y, 15, 'Vector2 Y should be 15');

      v.scale(2);
      runner.assertEqual(v.x, 30, 'Vector2 X scaled should be 30');
      runner.assertEqual(v.y, 30, 'Vector2 Y scaled should be 30');
    });

    runner.test('Vector2 normalization & length', () => {
      const v = new Vector2(3, 4);
      runner.assertEqual(v.length(), 5, 'Length of (3,4) must equal 5');
      v.normalize();
      runner.assert(Math.abs(v.length() - 1) < 0.0001, 'Normalized vector length must be 1');
    });
  });

  runner.describe('Physics Engine - AABB Bounding Box', () => {
    runner.test('AABB intersection detection', () => {
      const box1 = new AABB(0, 0, 16, 16);
      const box2 = new AABB(10, 10, 16, 16);
      const box3 = new AABB(50, 50, 16, 16);

      runner.assert(box1.intersects(box2), 'Overlapping boxes must return true');
      runner.assert(!box1.intersects(box3), 'Disjoint boxes must return false');
    });

    runner.test('AABB overlap dimensions calculation', () => {
      const box1 = new AABB(0, 0, 16, 16);
      const box2 = new AABB(10, 10, 16, 16);
      const overlap = box1.getOverlap(box2);

      runner.assertEqual(overlap.x, 6, 'Overlap on X must be 6px');
      runner.assertEqual(overlap.y, 6, 'Overlap on Y must be 6px');
    });
  });
}