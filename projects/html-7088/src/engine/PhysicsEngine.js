/**
 * Core Physics and Collision Resolution Engine (Swept AABB)
 * Studio: B2.st
 */

import { PHYSICS } from '../../config/constants.js';

export class PhysicsEngine {
  constructor(tileMap, gravity = PHYSICS.GRAVITY) {
    this.tileMap = tileMap;
    this.gravity = gravity;
    this.maxFallSpeed = PHYSICS.MAX_FALL_SPEED;
  }

  updateEntity(entity, dt) {
    if (!entity.isAlive && entity.type !== 'mario') return;

    // Apply horizontal motion
    entity.position.x += entity.velocity.x * dt;
    this.resolveTileCollisionX(entity);

    // Apply gravity and vertical motion
    entity.velocity.y = Math.min(entity.velocity.y + this.gravity * dt, this.maxFallSpeed);
    entity.position.y += entity.velocity.y * dt;
    entity.isGrounded = false;
    this.resolveTileCollisionY(entity);
  }

  resolveTileCollisionX(entity) {
    if (!this.tileMap) return;
    const ts = this.tileMap.tileSize;
    const startRow = Math.floor(entity.position.y / ts);
    const endRow = Math.floor((entity.position.y + entity.height - 0.05) / ts);

    if (entity.velocity.x > 0) {
      const col = Math.floor((entity.position.x + entity.width) / ts);
      for (let r = startRow; r <= endRow; r++) {
        if (this.tileMap.isSolid(col, r)) {
          entity.position.x = col * ts - entity.width;
          if (typeof entity.reverseDirection === 'function') {
            entity.reverseDirection();
          } else {
            entity.velocity.x = 0;
          }
          break;
        }
      }
    } else if (entity.velocity.x < 0) {
      const col = Math.floor(entity.position.x / ts);
      for (let r = startRow; r <= endRow; r++) {
        if (this.tileMap.isSolid(col, r)) {
          entity.position.x = (col + 1) * ts;
          if (typeof entity.reverseDirection === 'function') {
            entity.reverseDirection();
          } else {
            entity.velocity.x = 0;
          }
          break;
        }
      }
    }
  }

  resolveTileCollisionY(entity) {
    if (!this.tileMap) return;
    const ts = this.tileMap.tileSize;
    const startCol = Math.floor(entity.position.x / ts);
    const endCol = Math.floor((entity.position.x + entity.width - 0.05) / ts);

    if (entity.velocity.y >= 0) {
      // Falling down: test ground collision
      const row = Math.floor((entity.position.y + entity.height) / ts);
      for (let c = startCol; c <= endCol; c++) {
        if (this.tileMap.isSolid(c, row)) {
          entity.position.y = row * ts - entity.height;
          entity.velocity.y = 0;
          entity.isGrounded = true;
          break;
        }
      }
    } else if (entity.velocity.y < 0) {
      // Jumping up: test ceiling collision
      const row = Math.floor(entity.position.y / ts);
      for (let c = startCol; c <= endCol; c++) {
        if (this.tileMap.isSolid(c, row)) {
          entity.position.y = (row + 1) * ts;
          entity.velocity.y = 0;
          this.tileMap.interactTile(c, row, entity);
          break;
        }
      }
    }
  }

  resolveEntityToEntity(player, entities) {
    if (!player.isAlive) return;
    const playerBox = player.getBounds();

    for (const entity of entities) {
      if (entity === player || !entity.isAlive || entity.markedForRemoval) continue;

      const entityBox = entity.getBounds();
      if (!playerBox.intersects(entityBox)) continue;

      if (entity.type === 'goomba') {
        // Stomp condition: player is descending and player's bottom is near top of goomba
        const isDescending = player.velocity.y > 0;
        const playerBottom = player.position.y + player.height;
        const goombaTop = entity.position.y;

        if (isDescending && playerBottom - player.velocity.y * 0.05 <= goombaTop + 10) {
          entity.squash();
          player.stomp();
        } else {
          player.takeDamage();
        }
      }
    }
  }
}