/**
 * Goomba Enemy Entity
 * Studio: B2.st
 */

import { Entity } from './Entity.js';
import { GOOMBA_CONFIG } from '../../config/constants.js';

export class Goomba extends Entity {
  constructor(x = 100, y = 160) {
    super(x, y, GOOMBA_CONFIG.WIDTH, GOOMBA_CONFIG.HEIGHT, 'goomba');
    this.vx = -GOOMBA_CONFIG.PATROL_SPEED;
    this.isSquashed = false;
    this.squashTimer = 0;
    this.animTimer = 0;
    this.animFrame = 0;
  }

  update(dt) {
    if (this.isSquashed) {
      this.squashTimer += dt;
      if (this.squashTimer >= GOOMBA_CONFIG.SQUASH_DURATION) {
        this.markedForRemoval = true;
      }
      return;
    }

    this.animTimer += dt;
    if (this.animTimer >= 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  squash() {
    this.isSquashed = true;
    this.isAlive = false;
    this.isSolid = false;
    this.vx = 0;
    this.vy = 0;
    this.height = 8;
    this.position.y += 8;
  }

  reverseDirection() {
    this.vx = -this.vx;
  }

  render(ctx, camera) {
    if (!ctx) return;
    const sx = camera ? camera.worldToScreenX(this.x) : this.x;
    const sy = camera ? camera.worldToScreenY(this.y) : this.y;

    ctx.save();
    if (this.isSquashed) {
      ctx.fillStyle = '#b84418';
      ctx.fillRect(sx, sy, this.width, this.height);
    } else {
      // Goomba Brown Body
      ctx.fillStyle = '#b84418';
      ctx.fillRect(sx, sy, this.width, this.height - 4);
      // Feet
      ctx.fillStyle = '#000000';
      if (this.animFrame === 0) {
        ctx.fillRect(sx, sy + 12, 6, 4);
        ctx.fillRect(sx + 10, sy + 12, 6, 4);
      } else {
        ctx.fillRect(sx + 2, sy + 12, 6, 4);
        ctx.fillRect(sx + 8, sy + 12, 6, 4);
      }
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 3, sy + 5, 3, 4);
      ctx.fillRect(sx + 10, sy + 5, 3, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 4, sy + 6, 2, 2);
      ctx.fillRect(sx + 10, sy + 6, 2, 2);
    }
    ctx.restore();
  }
}