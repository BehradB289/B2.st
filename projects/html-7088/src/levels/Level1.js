/**
 * World 1-1 Map Generator
 * Studio: B2.st
 */

import { TileMap } from './TileMap.js';
import { TILES } from '../../config/constants.js';
import { Goomba } from '../entities/Goomba.js';

export function createWorld1_1() {
  const map = new TileMap(TILES.SIZE, 220, 15);
  const entities = [];

  // 1. Build bottom continuous ground (Rows 13 and 14)
  for (let c = 0; c < 220; c++) {
    // Classic pit holes at col 69-71 and 86-89
    const isPit1 = c >= 69 && c <= 71;
    const isPit2 = c >= 86 && c <= 89;
    if (!isPit1 && !isPit2) {
      map.setTile(c, 13, TILES.GROUND);
      map.setTile(c, 14, TILES.GROUND);
    }
  }

  // 2. Question block and brick formations
  map.setTile(16, 9, TILES.QUESTION_BLOCK);
  map.setTile(20, 9, TILES.BRICK);
  map.setTile(21, 9, TILES.QUESTION_BLOCK);
  map.setTile(22, 9, TILES.BRICK);
  map.setTile(23, 9, TILES.QUESTION_BLOCK);
  map.setTile(24, 9, TILES.BRICK);
  map.setTile(22, 5, TILES.QUESTION_BLOCK);

  // 3. Green Pipes
  // Pipe 1 (col 28, height 2)
  map.setTile(28, 11, TILES.PIPE_TOP_LEFT);
  map.setTile(29, 11, TILES.PIPE_TOP_RIGHT);
  map.setTile(28, 12, TILES.PIPE_BODY_LEFT);
  map.setTile(29, 12, TILES.PIPE_BODY_RIGHT);

  // Pipe 2 (col 38, height 3)
  map.setTile(38, 10, TILES.PIPE_TOP_LEFT);
  map.setTile(39, 10, TILES.PIPE_TOP_RIGHT);
  map.setTile(38, 11, TILES.PIPE_BODY_LEFT);
  map.setTile(39, 11, TILES.PIPE_BODY_RIGHT);
  map.setTile(38, 12, TILES.PIPE_BODY_LEFT);
  map.setTile(39, 12, TILES.PIPE_BODY_RIGHT);

  // 4. Populate Goombas
  entities.push(new Goomba(22 * 16, 12 * 16));
  entities.push(new Goomba(34 * 16, 12 * 16));
  entities.push(new Goomba(45 * 16, 12 * 16));
  entities.push(new Goomba(52 * 16, 12 * 16));

  return { map, entities };
}