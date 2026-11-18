/**
 * High-performance AABB Physics & Tile Collision Solver
 */

import { CONFIG } from '../../config/game.config.js';

export class Physics {
  static checkAABB(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  static resolveEntityVsTilemap(entity, level, dt) {
    const tileSize = CONFIG.TILES.SIZE;

    // --- HORIZONTAL MOVEMENT & COLLISION ---
    entity.x += entity.vx * dt;

    let startX = Math.floor(entity.x / tileSize);
    let endX = Math.floor((entity.x + entity.width - 0.01) / tileSize);
    let startY = Math.floor(entity.y / tileSize);
    let endY = Math.floor((entity.y + entity.height - 0.01) / tileSize);

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        if (level.isSolid(tx, ty)) {
          if (entity.vx > 0) {
            entity.x = tx * tileSize - entity.width;
            entity.onCollideWall?.('right');
          } else if (entity.vx < 0) {
            entity.x = (tx + 1) * tileSize;
            entity.onCollideWall?.('left');
          }
          entity.vx = 0;
        }
      }
    }

    // --- VERTICAL MOVEMENT & COLLISION ---
    entity.vy += (entity.customGravity || CONFIG.PHYSICS.GRAVITY) * dt;
    if (entity.vy > CONFIG.PHYSICS.MAX_FALL_SPEED) {
      entity.vy = CONFIG.PHYSICS.MAX_FALL_SPEED;
    }

    entity.y += entity.vy * dt;

    startX = Math.floor(entity.x / tileSize);
    endX = Math.floor((entity.x + entity.width - 0.01) / tileSize);
    startY = Math.floor(entity.y / tileSize);
    endY = Math.floor((entity.y + entity.height - 0.01) / tileSize);

    entity.onGround = false;

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        if (level.isSolid(tx, ty)) {
          if (entity.vy > 0) {
            // Landing on floor
            entity.y = ty * tileSize - entity.height;
            entity.vy = 0;
            entity.onGround = true;
            entity.onCollideGround?.();
          } else if (entity.vy < 0) {
            // Hitting ceiling / block above
            entity.y = (ty + 1) * tileSize;
            entity.vy = 0;
            entity.onCollideCeiling?.(tx, ty, level);
          }
        }
      }
    }
  }
}