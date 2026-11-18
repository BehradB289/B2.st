/**
 * Iconic World 1-1 Layout Map & Enemy Placements
 */

import { CONFIG } from '../../config/game.config.js';

export function createWorld1_1() {
  const width = 212;
  const height = 15;
  const tiles = new Array(width * height).fill(CONFIG.TILES.EMPTY);

  const set = (x, y, tile) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      tiles[y * width + x] = tile;
    }
  };

  // 1. Solid Ground everywhere except pits
  const pits = [
    [69, 70],
    [86, 88],
    [153, 154]
  ];

  for (let x = 0; x < width; x++) {
    const inPit = pits.some(([pStart, pEnd]) => x >= pStart && x <= pEnd);
    if (!inPit) {
      set(x, 13, CONFIG.TILES.GROUND);
      set(x, 14, CONFIG.TILES.GROUND);
    }
  }

  // 2. Question Blocks & Bricks
  // First cluster (x: 16 to 24)
  set(16, 9, CONFIG.TILES.QUESTION_COIN);
  set(20, 9, CONFIG.TILES.BRICK);
  set(21, 9, CONFIG.TILES.QUESTION_POWERUP);
  set(22, 9, CONFIG.TILES.BRICK);
  set(23, 9, CONFIG.TILES.QUESTION_COIN);
  set(24, 9, CONFIG.TILES.BRICK);
  set(22, 5, CONFIG.TILES.QUESTION_COIN);

  // Pipes helper
  const addPipe = (x, pipeHeight) => {
    const topY = 13 - pipeHeight;
    set(x, topY, CONFIG.TILES.PIPE_TOP_LEFT);
    set(x + 1, topY, CONFIG.TILES.PIPE_TOP_RIGHT);
    for (let y = topY + 1; y < 13; y++) {
      set(x, y, CONFIG.TILES.PIPE_SHAFT_LEFT);
      set(x + 1, y, CONFIG.TILES.PIPE_SHAFT_RIGHT);
    }
  };

  addPipe(28, 2);
  addPipe(38, 3);
  addPipe(46, 4);
  addPipe(57, 4);

  // Cluster 2: Bricks & Star
  set(64, 9, CONFIG.TILES.BRICK);
  set(65, 9, CONFIG.TILES.QUESTION_POWERUP);
  set(66, 9, CONFIG.TILES.BRICK);

  // Cluster 3: Elevated Brick Platform
  for (let x = 77; x <= 84; x++) set(x, 9, CONFIG.TILES.BRICK);
  for (let x = 80; x <= 83; x++) set(x, 5, CONFIG.TILES.BRICK);

  // Cluster 4: Question Blocks & Brick pyramid
  set(91, 9, CONFIG.TILES.BRICK);
  set(92, 9, CONFIG.TILES.QUESTION_COIN);
  set(93, 9, CONFIG.TILES.BRICK);
  set(94, 9, CONFIG.TILES.QUESTION_COIN);

  // Cluster 5: Stairs / Pyramid before Flag
  const addStair = (startX, steps, dir = 1) => {
    for (let s = 1; s <= steps; s++) {
      const x = dir === 1 ? startX + (s - 1) : startX + (steps - s);
      for (let y = 13 - s; y < 13; y++) {
        set(x, y, CONFIG.TILES.HARD_BLOCK);
      }
    }
  };

  addStair(134, 4, 1);
  addStair(140, 4, -1);
  addStair(148, 5, 1);
  addStair(155, 4, -1);

  // Flagpole Base & Pole
  const flagX = 198;
  set(flagX, 12, CONFIG.TILES.FLAG_BASE);
  for (let y = 3; y <= 11; y++) {
    set(flagX, y, CONFIG.TILES.FLAG_POLE);
  }
  set(flagX, 2, CONFIG.TILES.FLAG_POLE_TOP);

  // Castle
  for (let cx = 202; cx <= 207; cx++) {
    for (let cy = 8; cy <= 12; cy++) {
      set(cx, cy, CONFIG.TILES.BRICK);
    }
  }

  // Enemy Spawn Placements
  const enemies = [
    { type: 'GOOMBA', x: 22 * 16, y: 12 * 16 },
    { type: 'GOOMBA', x: 40 * 16, y: 12 * 16 },
    { type: 'GOOMBA', x: 50 * 16, y: 12 * 16 },
    { type: 'GOOMBA', x: 52 * 16, y: 12 * 16 },
    { type: 'KOOPA', x: 74 * 16, y: 11 * 16 },
    { type: 'GOOMBA', x: 80 * 16, y: 8 * 16 },
    { type: 'GOOMBA', x: 98 * 16, y: 12 * 16 },
    { type: 'KOOPA', x: 106 * 16, y: 12 * 16 },
    { type: 'GOOMBA', x: 120 * 16, y: 12 * 16 },
    { type: 'GOOMBA', x: 124 * 16, y: 12 * 16 }
  ];

  return { width, height, tiles, enemies };
}