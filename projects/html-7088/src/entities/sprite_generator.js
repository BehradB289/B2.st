/**
 * Procedural NES Pixel Sprite Generator
 * Generates classic Mario, Goomba, Tile and Item textures into offscreen canvases
 * and accelerates rendering via the In-Memory PerformanceCache.
 * Layer: Entities & Assets
 * Studio: B2.st
 */

import { PerformanceCache } from '../core/performance_cache.js';

export class SpriteGenerator {
  constructor() {
    this.cache = new PerformanceCache({
      maxSize: 100,
      defaultTTL: 0 // Texture sprites persist in memory
    });
  }

  /**
   * Helper to draw pixel array onto an Offscreen Canvas
   */
  createPixelCanvas(width, height, pixelMatrix, colorMap) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < height; y++) {
      const row = pixelMatrix[y];
      if (!row) continue;
      for (let x = 0; x < width; x++) {
        const char = row[x];
        if (char && char !== ' ' && colorMap[char]) {
          ctx.fillStyle = colorMap[char];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return canvas;
  }

  /**
   * Mario Small Idle / Run Sprites
   */
  getMarioSprite(frame = 'stand', isSuper = false) {
    const key = `mario_${isSuper ? 'super' : 'small'}_${frame}`;

    return this.cache.getOrCompute(key, () => {
      const height = isSuper ? 32 : 16;
      const width = 16;
      const red = '#b81c00';
      const brown = '#8c5200';
      const yellow = '#ffbc00';
      const blue = '#0040e0';

      const colorMap = {
        'R': red,
        'B': isSuper ? blue : red,
        'Y': yellow,
        'W': '#ffffff',
        'S': '#fcd8a8' // Skin
      };

      let matrix;

      if (!isSuper) {
        if (frame === 'stand') {
          matrix = [
            "    RRRRR       ",
            "   RRRRRRRRR    ",
            "   BBBSSBS      ",
            "  BSBSSSBSSS    ",
            "  BSBBSSSBSSS   ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "   RRBRRR       ",
            "  RRRBRRBRRR    ",
            " RRRRBBBBBRRR   ",
            " SSRBBYBBRSS    ",
            " SSSBBBBBBSSS   ",
            " SS BBBBBBBBSS  ",
            "    BBB  BBB    ",
            "   BBB    BBB   ",
            "  BBBB    BBBB  "
          ];
        } else if (frame === 'run1') {
          matrix = [
            "    RRRRR       ",
            "   RRRRRRRRR    ",
            "   BBBSSBS      ",
            "  BSBSSSBSSS    ",
            "  BSBBSSSBSSS   ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "   RRBRRR       ",
            "  RRRBRRBRRR    ",
            " RRRRBBBBBRRR   ",
            " SSRBBYBBRSS    ",
            " SSSBBBBBBSSS   ",
            " SS BBBBBBBBSS  ",
            "   BBBB         ",
            "  BBBBBB        ",
            "  BBB           "
          ];
        } else {
          // Jump
          matrix = [
            "  SS RRRRR      ",
            "  SSR RRRRRRR   ",
            "   BBBSSBS      ",
            "  BSBSSSBSSS    ",
            "  BSBBSSSBSSS   ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "  SSRRBRRR      ",
            "  SSRRBRRBRRR   ",
            "   RRRBBBBBRRR  ",
            "    RBBYBBRSS   ",
            "   BBBBBBBBSSS  ",
            "  BBBBBBBBBBSS  ",
            " BBB        BBB ",
            " BBBB           ",
            "                "
          ];
        }
      } else {
        // Super Mario 32px height
        matrix = [];
        // Generate procedural 32 rows for Super Mario
        for (let i = 0; i < 32; i++) {
          if (i < 8) matrix.push("    RRRRRRRR    ");
          else if (i < 14) matrix.push("   SSSSBBSSSS   ");
          else if (i < 24) matrix.push("   BBBRRRBBBB   ");
          else matrix.push("  BBBB    BBBB  ");
        }
      }

      return this.createPixelCanvas(width, height, matrix, colorMap);
    });
  }

  /**
   * Goomba (Brown Mushroom enemy)
   */
  getGoombaSprite(frame = 0, squashed = false) {
    const key = `goomba_${squashed ? 'flat' : frame}`;

    return this.cache.getOrCompute(key, () => {
      const colorMap = {
        'B': '#a84400', // Brown
        'Y': '#fce4a0', // Face beige
        'K': '#000000', // Black
        'W': '#ffffff'
      };

      if (squashed) {
        const matrix = [
          "                ",
          "                ",
          "                ",
          "                ",
          "                ",
          "                ",
          "                ",
          "                ",
          "   BBBBBBBB     ",
          "  BBBBBBBBBB    ",
          " BBBKWWKKWWKB   ",
          " BBBKWWKKWWKB   ",
          "YYYYYYYYYYYYYYYY",
          "YYYYYYYYYYYYYYYY",
          "  KKKK    KKKK  ",
          " KKKKKK  KKKKKK "
        ];
        return this.createPixelCanvas(16, 16, matrix, colorMap);
      }

      const footLeft = frame === 0 ? "KKKKK" : " KKK ";
      const footRight = frame === 0 ? " KKK " : "KKKKK";

      const matrix = [
        "     BBBB       ",
        "    BBBBBB      ",
        "   BBBBBBBB     ",
        "  BBBBBBBBBB    ",
        " BBBBBBBBBBBB   ",
        "BBBBBKWWKKWWKB  ",
        "BBBBBKWWKKWWKB  ",
        "BBBBBKWWKKWWKB  ",
        " BBBBBKKKKBBBB  ",
        "  YYYYYYYYYYYY  ",
        "   YYYYYYYYYY   ",
        "    YYYYYYYY    ",
        "     YYYYYY     ",
        "      YYYY      ",
        `  ${footLeft}   ${footRight}  `,
        `  ${footLeft}   ${footRight}  `
      ];

      return this.createPixelCanvas(16, 16, matrix, colorMap);
    });
  }

  /**
   * Super Mushroom
   */
  getMushroomSprite() {
    return this.cache.getOrCompute('mushroom', () => {
      const colorMap = {
        'R': '#e40058',
        'W': '#ffffff',
        'Y': '#fcbc74',
        'K': '#000000'
      };
      const matrix = [
        "     RRRRRR     ",
        "   RRRRRRRRRR   ",
        "  RRWWWRRRWWWR  ",
        " RWWWWWWRWWWWWWR",
        " RWWWWWWRWWWWWWR",
        "RRWWWWWWRWWWWWWR",
        "RRRWWWWRRRWWWWRR",
        "RRRRRRRRRRRRRRRR",
        "  KKYYYYYYYYKK  ",
        "  KKYYYYYYYYKK  ",
        "  KKYYYYYYYYKK  ",
        "  KKKKKKKKKKKK  ",
        "   YYYYYYYYYY   ",
        "   YYYYYYYYYY   ",
        "    YYYYYYYY    ",
        "                "
      ];
      return this.createPixelCanvas(16, 16, matrix, colorMap);
    });
  }

  /**
   * Classic Map Tiles (Ground, Brick, Question Block, Pipe)
   */
  getTileSprite(type) {
    return this.cache.getOrCompute(`tile_${type}`, () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      if (type === 'ground') {
        // NES Brown patterned ground
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 16, 1);
        ctx.fillRect(0, 0, 1, 16);
        ctx.fillStyle = '#fcbc74';
        ctx.fillRect(1, 1, 14, 2);
        ctx.fillRect(1, 1, 2, 14);
      } else if (type === 'brick') {
        ctx.fillStyle = '#b84418';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#000000';
        // Mortar lines
        ctx.fillRect(0, 7, 16, 1);
        ctx.fillRect(0, 15, 16, 1);
        ctx.fillRect(7, 0, 1, 7);
        ctx.fillRect(15, 0, 1, 7);
        ctx.fillRect(3, 8, 1, 7);
        ctx.fillRect(11, 8, 1, 7);
        ctx.fillStyle = '#fce4a0';
        ctx.fillRect(0, 0, 7, 1);
        ctx.fillRect(8, 0, 7, 1);
      } else if (type === 'question') {
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#000000';
        ctx.strokeRect(0.5, 0.5, 15, 15);
        // Question mark
        ctx.fillStyle = '#803000';
        ctx.fillRect(5, 3, 6, 2);
        ctx.fillRect(9, 5, 2, 3);
        ctx.fillRect(7, 7, 3, 2);
        ctx.fillRect(7, 11, 2, 2);
      } else if (type === 'empty_block') {
        ctx.fillStyle = '#8c5200';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#442000';
        ctx.strokeRect(0.5, 0.5, 15, 15);
      } else if (type === 'pipe_top_left') {
        ctx.fillStyle = '#00a800';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#80d010';
        ctx.fillRect(2, 0, 4, 16);
        ctx.fillStyle = '#005000';
        ctx.fillRect(0, 0, 2, 16);
        ctx.fillRect(0, 0, 16, 2);
      } else if (type === 'pipe_top_right') {
        ctx.fillStyle = '#00a800';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#005000';
        ctx.fillRect(14, 0, 2, 16);
        ctx.fillRect(0, 0, 16, 2);
      } else if (type === 'pipe_body_left') {
        ctx.fillStyle = '#00a800';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#80d010';
        ctx.fillRect(3, 0, 4, 16);
        ctx.fillStyle = '#005000';
        ctx.fillRect(1, 0, 2, 16);
      } else if (type === 'pipe_body_right') {
        ctx.fillStyle = '#00a800';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#005000';
        ctx.fillRect(13, 0, 2, 16);
      }

      return canvas;
    });
  }
}