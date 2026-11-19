/**
 * B2.st Studio - Mario Game Engine
 * Level Map & Tile Collision Matrix
 * @module src/levels/Level
 */

export class Level {
  constructor(world = 1, level = 1) {
    this.world = world;
    this.level = level;
    this.width = 2400;
    this.height = 240;
    this.platforms = [];
    this.coins = [];
    this.initMap();
  }

  initMap() {
    this.platforms = [
      // Ground sections with pits
      { x: 0, y: 208, w: 680, h: 32, type: 'ground' },
      { x: 740, y: 208, w: 600, h: 32, type: 'ground' },
      { x: 1400, y: 208, w: 1000, h: 32, type: 'ground' },

      // Floating bricks & question blocks
      { x: 160, y: 144, w: 16, h: 16, type: 'question' },
      { x: 220, y: 144, w: 16, h: 16, type: 'brick' },
      { x: 236, y: 144, w: 16, h: 16, type: 'question' },
      { x: 252, y: 144, w: 16, h: 16, type: 'brick' },

      // Pipes
      { x: 340, y: 176, w: 32, h: 32, type: 'pipe' },
      { x: 500, y: 160, w: 32, h: 48, type: 'pipe' },
      { x: 620, y: 144, w: 32, h: 64, type: 'pipe' },

      // Pyramid stairs
      { x: 1800, y: 192, w: 16, h: 16, type: 'stair' },
      { x: 1816, y: 176, w: 16, h: 32, type: 'stair' },
      { x: 1832, y: 160, w: 16, h: 48, type: 'stair' },
      { x: 1848, y: 144, w: 16, h: 64, type: 'stair' }
    ];

    this.coins = [
      { x: 160, y: 120, collected: false },
      { x: 236, y: 120, collected: false },
      { x: 350, y: 140, collected: false },
      { x: 510, y: 130, collected: false }
    ];
  }
}