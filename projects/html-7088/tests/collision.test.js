import { TileMap, TILES } from '../src/levels/TileMap.js';
import { PhysicsEngine } from '../src/engine/Physics.js';
import { Mario } from '../src/entities/Mario.js';

export function runCollisionTests(runner) {
  runner.describe('Collision Engine - Tile and Boundary Interactions', () => {
    runner.test('Mario lands on solid ground tile and stops vertical velocity', () => {
      const tileMap = new TileMap(20, 15);
      tileMap.setTile(5, 10, TILES.GROUND);

      const physics = new PhysicsEngine(tileMap);
      const mario = new Mario(5 * 16, 9 * 16);
      mario.velocity.y = 150; // falling down

      physics.updateEntity(mario, 0.05);

      runner.assert(mario.grounded, 'Mario should be flagged as grounded after landing');
      runner.assertEqual(mario.velocity.y, 0, 'Vertical velocity should be zeroed upon ground contact');
    });

    runner.test('Mario hits ceiling question block from below and triggers callback', () => {
      const tileMap = new TileMap(20, 15);
      tileMap.setTile(5, 4, TILES.QUESTION_COIN);

      const physics = new PhysicsEngine(tileMap);
      const mario = new Mario(5 * 16, 5 * 16);
      mario.velocity.y = -200; // jumping upwards

      let hitDetected = false;
      physics.updateEntity(mario, 0.05, (tx, ty, tileId) => {
        if (tx === 5 && ty === 4 && tileId === TILES.QUESTION_COIN) {
          hitDetected = true;
        }
      });

      runner.assert(hitDetected, 'Ceiling collision callback must be fired on block hit');
      runner.assertEqual(mario.velocity.y, 0, 'Upward velocity must be terminated on ceiling collision');
    });
  });
}