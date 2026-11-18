/**
 * @file Level1.js
 * @description Level 1-1 data blueprint and entity factory.
 */
import { TileType, TileMap } from './TileMap.js';
import { Goomba } from '../entities/Goomba.js';

export function createLevel1(cache) {
  const ROWS = 15;
  const COLS = 120;
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(TileType.EMPTY));

  // Build ground floor (rows 13 & 14) with pits
  for (let c = 0; c < COLS; c++) {
    // Holes at 42-44, 70-72
    if ((c >= 42 && c <= 44) || (c >= 70 && c <= 72)) {
      continue;
    }
    grid[13][c] = TileType.GROUND;
    grid[14][c] = TileType.GROUND;
  }

  // Mystery '?' Blocks & Bricks
  grid[9][16] = TileType.QUESTION;
  grid[9][20] = TileType.BRICK;
  grid[9][21] = TileType.QUESTION;
  grid[9][22] = TileType.BRICK;
  grid[9][23] = TileType.QUESTION;
  grid[9][24] = TileType.BRICK;
  grid[5][22] = TileType.QUESTION;

  // Warp Pipes
  // Pipe 1 (height 2) at col 28
  grid[11][28] = TileType.PIPE_TL;
  grid[11][29] = TileType.PIPE_TR;
  grid[12][28] = TileType.PIPE_BL;
  grid[12][29] = TileType.PIPE_BR;

  // Pipe 2 (height 3) at col 38
  grid[10][38] = TileType.PIPE_TL;
  grid[10][39] = TileType.PIPE_TR;
  grid[11][38] = TileType.PIPE_BL;
  grid[11][39] = TileType.PIPE_BR;
  grid[12][38] = TileType.PIPE_BL;
  grid[12][39] = TileType.PIPE_BR;

  // Pyramid blocks near end
  for (let step = 0; step < 4; step++) {
    for (let c = 85 + step; c <= 89; c++) {
      grid[12 - step][c] = TileType.BLOCK;
    }
  }

  const tileMap = new TileMap(16, grid, cache);

  // Spawn initial enemies
  const enemies = [
    new Goomba(22 * 16, 12 * 16, cache),
    new Goomba(34 * 16, 12 * 16, cache),
    new Goomba(52 * 16, 12 * 16, cache),
    new Goomba(54 * 16, 12 * 16, cache),
    new Goomba(80 * 16, 12 * 16, cache),
  ];

  return { tileMap, enemies };
}