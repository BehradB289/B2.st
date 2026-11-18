/**
 * Modular TileMap with Performance Caching Layer
 * Renders static and dynamic tiles, clouds, bushes, and manages collisions.
 * Layer: Level & Environment
 * Studio: B2.st
 */

import { CONFIG } from '../../config/game_config.js';
import { PerformanceCache } from '../core/performance_cache.js';

export class TileMap {
  constructor(levelData, spriteGen) {
    this.tileSize = CONFIG.TILE_SIZE;
    this.width = levelData.width;
    this.height = levelData.height;
    this.spriteGen = spriteGen;
    this.tiles = [];
    this.spawnEntities = [];
    this.particles = [];

    // Dedicated cache for pre-rendered chunk blocks
    this.chunkCache = new PerformanceCache({
      maxSize: 64,
      defaultTTL: 60000
    });

    this.parseLevel(levelData);
  }

  parseLevel(data) {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      const rowStr = data.layers[y] || '';
      for (let x = 0; x < this.width; x++) {
        const char = rowStr[x] || ' ';
        this.tiles[y][x] = this.createTileFromChar(char, x, y);
      }
    }
  }

  createTileFromChar(char, x, y) {
    if (char === '#') {
      return { type: 'ground', isSolid: true };
    }
    if (char === 'B') {
      return { type: 'brick', isSolid: true };
    }
    if (char === '?') {
      return { type: 'question', isSolid: true, triggered: false, contents: 'coin' };
    }
    if (char === 'M') {
      return { type: 'question', isSolid: true, triggered: false, contents: 'mushroom' };
    }
    if (char === '[') {
      return { type: 'pipe_top_left', isSolid: true };
    }
    if (char === ']') {
      return { type: 'pipe_top_right', isSolid: true };
    }
    if (char === '{') {
      return { type: 'pipe_body_left', isSolid: true };
    }
    if (char === '}') {
      return { type: 'pipe_body_right', isSolid: true };
    }
    if (char === 'F') {
      return { type: 'flagpole', isSolid: false, isGoal: true };
    }
    return null;
  }

  getTile(tx, ty) {
    if (ty < 0 || ty >= this.height || tx < 0 || tx >= this.width) {
      return null;
    }
    return this.tiles[ty][tx];
  }

  destroyTile(tx, ty) {
    if (this.tiles[ty] && this.tiles[ty][tx]) {
      this.tiles[ty][tx] = null;
      // Invalidate chunk cache near this modification
      this.chunkCache.clear();
    }
  }

  spawnMushroom(tx, ty) {
    if (this.onSpawnMushroom) {
      this.onSpawnMushroom(tx * this.tileSize, ty * this.tileSize);
    }
  }

  render(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / this.tileSize));
    const startRow = 0;
    const endRow = this.height - 1;

    // Draw NES clouds and hill scenery
    this.renderBackgroundScenery(ctx, camera);

    for (let ty = startRow; ty <= endRow; ty++) {
      for (let tx = startCol; tx <= endCol; tx++) {
        const tile = this.tiles[ty][tx];
        if (!tile) continue;

        const screenX = Math.round(tx * this.tileSize - camera.x);
        const screenY = Math.round(ty * this.tileSize - camera.y);

        if (tile.isGoal) {
          // Flagpole
          ctx.fillStyle = '#00a800';
          ctx.fillRect(screenX + 7, screenY, 2, this.tileSize);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(screenX + 8, screenY, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const sprite = this.spriteGen.getTileSprite(tile.type);
          if (sprite) {
            ctx.drawImage(sprite, screenX, screenY);
          }
        }
      }
    }
  }

  renderBackgroundScenery(ctx, camera) {
    // Classic NES Hills and Clouds cached coordinates
    ctx.fillStyle = '#ffffff';
    // Gentle cloud procedural draws
    const cloudPositions = [60, 240, 480, 720, 1100, 1500];
    cloudPositions.forEach(cx => {
      const sx = Math.round(cx - camera.x * 0.4);
      if (sx > -60 && sx < camera.viewportWidth + 60) {
        ctx.beginPath();
        ctx.arc(sx, 40, 14, 0, Math.PI * 2);
        ctx.arc(sx + 16, 36, 18, 0, Math.PI * 2);
        ctx.arc(sx + 34, 40, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Green hill slopes
    ctx.fillStyle = '#00a800';
    const hillPositions = [0, 360, 800, 1300];
    hillPositions.forEach(hx => {
      const sx = Math.round(hx - camera.x * 0.7);
      if (sx > -100 && sx < camera.viewportWidth + 100) {
        ctx.beginPath();
        ctx.arc(sx + 50, 208, 45, Math.PI, 0, false);
        ctx.fill();
      }
    });
  }
}