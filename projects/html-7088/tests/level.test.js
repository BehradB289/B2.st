import { TileMap, TILES } from '../src/levels/TileMap.js';
import { LevelLoader } from '../src/levels/Level1_1.js';

export function runLevelTests(runner) {
  runner.describe('Level Management - World 1-1 Layout and Boundaries', () => {
    runner.test('World 1-1 level generator creates expected dimensions and elements', () => {
      const tileMap = new TileMap(212, 15);
      const data = LevelLoader.loadWorld1_1(tileMap);

      runner.assertEqual(tileMap.width, 212, 'TileMap width should be 212 tiles');
      runner.assertEqual(tileMap.height, 15, 'TileMap height should be 15 tiles');
      runner.assert(data.enemySpawns.length > 0, 'Enemy spawns list should not be empty');
      runner.assert(data.flagpoleX > 0, 'Flagpole position should be configured');
    });

    runner.test('TileMap boundaries return air on out-of-bounds queries', () => {
      const tileMap = new TileMap(50, 15);
      const tileOut = tileMap.getTile(-10, 999);
      runner.assertEqual(tileOut, TILES.AIR, 'Out of bounds coordinate must return AIR (0)');
    });
  });
}