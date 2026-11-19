/**
 * B2.st Studio - Mario Game Engine
 * Axis-Aligned Bounding Box (AABB) Physics System
 * @module src/engine/Physics
 */

import { Vector2D } from './Vector2D.js';

export class AABB {
  constructor(x, y, width, height) {
    this.pos = new Vector2D(x, y);
    this.size = new Vector2D(width, height);
  }

  get left() { return this.pos.x; }
  get right() { return this.pos.x + this.size.x; }
  get top() { return this.pos.y; }
  get bottom() { return this.pos.y + this.size.y; }

  intersects(other) {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }
}

export class PhysicsEngine {
  constructor() {
    this.gravity = 980; // px/s^2
    this.maxVelocityY = 600;
  }

  applyGravity(entity, deltaTime) {
    if (!entity.isGrounded) {
      entity.vel.y += this.gravity * deltaTime;
      if (entity.vel.y > this.maxVelocityY) {
        entity.vel.y = this.maxVelocityY;
      }
    }
  }

  resolvePlatformCollision(entity, platforms) {
    entity.isGrounded = false;
    for (const plat of platforms) {
      const box = new AABB(plat.x, plat.y, plat.w, plat.h);
      const entityBox = new AABB(entity.pos.x, entity.pos.y, entity.width, entity.height);

      if (entityBox.intersects(box)) {
        // Vertical collision from top
        const prevY = entity.pos.y - entity.vel.y * 0.016;
        if (prevY + entity.height <= plat.y + 6) {
          entity.pos.y = plat.y - entity.height;
          entity.vel.y = 0;
          entity.isGrounded = true;
        } else if (prevY >= plat.y + plat.h - 6) {
          entity.pos.y = plat.y + plat.h;
          entity.vel.y = 0;
        } else {
          // Horizontal resolution
          if (entity.vel.x > 0) {
            entity.pos.x = plat.x - entity.width;
          } else if (entity.vel.x < 0) {
            entity.pos.x = plat.x + plat.w;
          }
          entity.vel.x = 0;
        }
      }
    }
  }
}