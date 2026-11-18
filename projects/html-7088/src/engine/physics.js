/**
 * AABB (Axis-Aligned Bounding Box) Physics Engine
 * Handles gravity, collisions, resolution, and spatial bounds.
 * Layer: Central Engine
 * Studio: B2.st
 */

import { CONFIG } from '../../config/game_config.js';

export class PhysicsEngine {
  constructor(tileMap) {
    this.tileMap = tileMap;
    this.gravity = CONFIG.PHYSICS.GRAVITY;
    this.maxFallSpeed = CONFIG.PHYSICS.MAX_FALL_SPEED;
  }

  /**
   * Check if two rectangular entities intersect
   */
  static checkAABB(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }

  /**
   * Applies gravity to an entity's velocity
   */
  applyGravity(entity, deltaTime) {
    if (!entity.hasGravity || entity.isDead) return;

    entity.velocity.y += this.gravity * deltaTime;
    if (entity.velocity.y > this.maxFallSpeed) {
      entity.velocity.y = this.maxFallSpeed;
    }
  }

  /**
   * Moves entity along X axis and resolves tile collisions
   */
  resolveMapCollisionX(entity, deltaTime) {
    entity.position.x += entity.velocity.x * deltaTime;

    const tileSize = this.tileMap.tileSize;
    const startTileY = Math.floor(entity.position.y / tileSize);
    const endTileY = Math.floor((entity.position.y + entity.height - 0.01) / tileSize);

    if (entity.velocity.x > 0) {
      // Moving Right
      const rightTileX = Math.floor((entity.position.x + entity.width) / tileSize);
      for (let ty = startTileY; ty <= endTileY; ty++) {
        const tile = this.tileMap.getTile(rightTileX, ty);
        if (tile && tile.isSolid) {
          entity.position.x = rightTileX * tileSize - entity.width;
          entity.onWallCollide('right');
          entity.velocity.x = 0;
          break;
        }
      }
    } else if (entity.velocity.x < 0) {
      // Moving Left
      const leftTileX = Math.floor(entity.position.x / tileSize);
      for (let ty = startTileY; ty <= endTileY; ty++) {
        const tile = this.tileMap.getTile(leftTileX, ty);
        if (tile && tile.isSolid) {
          entity.position.x = (leftTileX + 1) * tileSize;
          entity.onWallCollide('left');
          entity.velocity.x = 0;
          break;
        }
      }
    }
  }

  /**
   * Moves entity along Y axis and resolves floor / ceiling collisions
   */
  resolveMapCollisionY(entity, deltaTime) {
    entity.position.y += entity.velocity.y * deltaTime;
    entity.onGround = false;

    const tileSize = this.tileMap.tileSize;
    const startTileX = Math.floor(entity.position.x / tileSize);
    const endTileX = Math.floor((entity.position.x + entity.width - 0.01) / tileSize);

    if (entity.velocity.y > 0) {
      // Falling down
      const bottomTileY = Math.floor((entity.position.y + entity.height) / tileSize);
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tile = this.tileMap.getTile(tx, bottomTileY);
        if (tile && tile.isSolid) {
          entity.position.y = bottomTileY * tileSize - entity.height;
          entity.velocity.y = 0;
          entity.onGround = true;
          break;
        }
      }
    } else if (entity.velocity.y < 0) {
      // Jumping up into ceiling / block
      const topTileY = Math.floor(entity.position.y / tileSize);
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tile = this.tileMap.getTile(tx, topTileY);
        if (tile && tile.isSolid) {
          entity.position.y = (topTileY + 1) * tileSize;
          entity.velocity.y = 0;
          entity.onCeilingHit(tx, topTileY, tile);
          break;
        }
      }
    }
  }

  /**
   * Full movement and collision update for an entity
   */
  updateEntity(entity, deltaTime) {
    this.applyGravity(entity, deltaTime);
    this.resolveMapCollisionX(entity, deltaTime);
    this.resolveMapCollisionY(entity, deltaTime);
  }
}