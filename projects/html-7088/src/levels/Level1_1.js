import { TILES } from './TileMap.js';

/**
 * Studio B2.st - Level 1-1 Layout Generator
 * Generates an authentic NES World 1-1 terrain, pipes, brick structures, and flagpole.
 */
export class LevelLoader {
  static loadWorld1_1(tileMap) {
    const width = tileMap.width;

    // Ground: rows 13 and 14 across the map, with pit gaps
    const pitGaps = [
      { start: 69, end: 71 },
      { start: 86, end: 89 },
      { start: 153, end: 155 }
    ];

    for (let x = 0; x < width; x++) {
      const isGap = pitGaps.some(gap => x >= gap.start && x <= gap.end);
      if (!isGap) {
        tileMap.setTile(x, 13, TILES.GROUND);
        tileMap.setTile(x, 14, TILES.GROUND);
      }
    }

    // Pipes generator helper
    const addPipe = (startX, height) => {
      const topY = 13 - height;
      tileMap.setTile(startX, topY, TILES.PIPE_TL);
      tileMap.setTile(startX + 1, topY, TILES.PIPE_TR);
      for (let y = topY + 1; y < 13; y++) {
        tileMap.setTile(startX, y, TILES.PIPE_BL);
        tileMap.setTile(startX + 1, y, TILES.PIPE_BR);
      }
    };

    // Four initial pipes
    addPipe(28, 2);
    addPipe(38, 3);
    addPipe(46, 4);
    addPipe(57, 4);

    // Initial question and brick blocks
    tileMap.setTile(16, 9, TILES.QUESTION_COIN);

    tileMap.setTile(20, 9, TILES.BRICK);
    tileMap.setTile(21, 9, TILES.QUESTION_MUSHROOM);
    tileMap.setTile(22, 9, TILES.BRICK);
    tileMap.setTile(23, 9, TILES.QUESTION_COIN);
    tileMap.setTile(24, 9, TILES.BRICK);
    tileMap.setTile(22, 5, TILES.QUESTION_COIN); // Higher block

    // Second brick formation
    tileMap.setTile(77, 9, TILES.BRICK);
    tileMap.setTile(78, 9, TILES.QUESTION_MUSHROOM);
    tileMap.setTile(79, 9, TILES.BRICK);

    for (let x = 80; x <= 87; x++) {
      tileMap.setTile(x, 5, TILES.BRICK);
    }
    for (let x = 91; x <= 93; x++) {
      tileMap.setTile(x, 5, TILES.BRICK);
    }
    tileMap.setTile(94, 5, TILES.QUESTION_COIN);

    // End pyramid stairs before flagpole
    const buildStairs = (startX, height, facingRight) => {
      for (let step = 0; step < height; step++) {
        const y = 12 - step;
        const currentWidth = height - step;
        for (let w = 0; w < currentWidth; w++) {
          const x = facingRight ? startX + step + w : startX + w;
          tileMap.setTile(x, y, TILES.BRICK);
        }
      }
    };

    buildStairs(134, 4, true);
    buildStairs(140, 4, false);
    buildStairs(148, 4, true);
    buildStairs(155, 4, false);

    // Flagpole and Castle
    const flagX = 198;
    tileMap.setTile(flagX, 2, TILES.FLAGPOLE_TOP);
    for (let y = 3; y <= 12; y++) {
      tileMap.setTile(flagX, y, TILES.FLAGPOLE);
    }
    tileMap.setTile(flagX, 12, TILES.BRICK); // Block at bottom of flagpole

    // Castle structure
    for (let cx = 202; cx <= 207; cx++) {
      for (let cy = 9; cy <= 12; cy++) {
        tileMap.setTile(cx, cy, TILES.CASTLE);
      }
    }

    return {
      enemySpawns: [
        { type: 'goomba', x: 22 * 16, y: 12 * 16 },
        { type: 'goomba', x: 40 * 16, y: 12 * 16 },
        { type: 'goomba', x: 51 * 16, y: 12 * 16 },
        { type: 'goomba', x: 53 * 16, y: 12 * 16 },
        { type: 'koopa',  x: 107 * 16, y: 12 * 16 },
        { type: 'goomba', x: 114 * 16, y: 12 * 16 },
        { type: 'goomba', x: 116 * 16, y: 12 * 16 },
        { type: 'koopa',  x: 174 * 16, y: 12 * 16 }
      ],
      marioSpawn: { x: 40, y: 12 * 16 },
      flagpoleX: flagX * 16
    };
  }
}