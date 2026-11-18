/**
 * @file Goomba.js
 * @description Standard walking Goomba enemy with obstacle collision and stomp logic.
 */
import { Entity } from './Entity.js';

export class Goomba extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {PerformanceCache} cache
   */
  constructor(x, y, cache) {
    super(x, y, 16, 16);
    this.type = 'goomba';
    this.cache = cache;
    this.velocity.x = -45; // Slow patrol left
    this.isSquished = false;
    this.squishTimer = 0;
    this.frame = 0;
    this.walkAnimTimer = 0;
  }

  update(dt, physics) {
    if (this.isSquished) {
      this.squishTimer += dt;
      if (this.squishTimer > 0.4) {
        this.isAlive = false;
      }
      return;
    }

    super.update(dt, physics);

    this.walkAnimTimer += dt;
    if (this.walkAnimTimer > 0.18) {
      this.frame = (this.frame + 1) % 2;
      this.walkAnimTimer = 0;
    }
  }

  squish() {
    this.isSquished = true;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.height = 8;
    this.y += 8;
  }

  render(ctx, camera) {
    const screenX = Math.round(this.x - camera.position.x);
    const screenY = Math.round(this.y - camera.position.y);

    const cacheKey = `goomba_${this.isSquished ? 'squished' : this.frame}`;
    let sprite = this.cache.get(cacheKey);

    if (!sprite) {
      sprite = document.createElement('canvas');
      sprite.width = 16;
      sprite.height = 16;
      const sctx = sprite.getContext('2d');
      this._drawProceduralGoomba(sctx);
      this.cache.set(cacheKey, sprite, 120000);
    }

    ctx.drawImage(sprite, screenX, screenY);
  }

  _drawProceduralGoomba(ctx) {
    const BROWN = '#A84000';
    const BLACK = '#000000';
    const CREAM = '#FCE0A8';

    if (this.isSquished) {
      ctx.fillStyle = BROWN;
      ctx.fillRect(1, 8, 14, 8);
      ctx.fillStyle = BLACK;
      ctx.fillRect(3, 11, 3, 2);
      ctx.fillRect(10, 11, 3, 2);
      return;
    }

    // Mushroom Cap
    ctx.fillStyle = BROWN;
    ctx.beginPath();
    ctx.arc(8, 7, 7, Math.PI, 0, false);
    ctx.fill();
    ctx.fillRect(3, 7, 10, 4);

    // Face
    ctx.fillStyle = CREAM;
    ctx.fillRect(4, 9, 8, 3);

    // Eyes
    ctx.fillStyle = BLACK;
    ctx.fillRect(4, 8, 2, 3);
    ctx.fillRect(10, 8, 2, 3);

    // Feet alternating
    ctx.fillStyle = BLACK;
    if (this.frame === 0) {
      ctx.fillRect(1, 13, 5, 3);
      ctx.fillRect(10, 13, 5, 3);
    } else {
      ctx.fillRect(2, 13, 5, 3);
      ctx.fillRect(9, 13, 5, 3);
    }
  }
}