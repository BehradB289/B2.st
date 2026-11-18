/**
 * @file Physics.js
 * @description AABB Collision Detection and Solid Resolution Physics Engine.
 */
export class Physics {
  constructor() {
    this.gravity = 1800; // px/s^2
    this.terminalVelocityY = 700;
  }

  /**
   * Standard Axis-Aligned Bounding Box (AABB) intersection test.
   */
  static checkAABB(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Resolves entity collisions against a solid obstacle tile with discrete axis separation.
   * @param {Entity} entity
   * @param {Object} obstacle {x, y, width, height, type}
   */
  resolveCollision(entity, obstacle) {
    if (!Physics.checkAABB(entity, obstacle)) {
      return false;
    }

    // Overlap depths
    const overlapLeft = (entity.x + entity.width) - obstacle.x;
    const overlapRight = (obstacle.x + obstacle.width) - entity.x;
    const overlapTop = (entity.y + entity.height) - obstacle.y;
    const overlapBottom = (obstacle.y + obstacle.height) - entity.y;

    // Minimum overlap axis determines penetration direction
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapY < minOverlapX) {
      if (overlapTop < overlapBottom) {
        // Landing on top of an obstacle
        entity.y = obstacle.y - entity.height;
        entity.velocity.y = 0;
        entity.isGrounded = true;
      } else {
        // Hitting head on the ceiling / brick
        entity.y = obstacle.y + obstacle.height;
        entity.velocity.y = Math.max(0, entity.velocity.y);
        if (typeof entity.onHeadBump === 'function') {
          entity.onHeadBump(obstacle);
        }
      }
    } else {
      if (overlapLeft < overlapRight) {
        // Wall on right
        entity.x = obstacle.x - entity.width;
        entity.velocity.x = 0;
      } else {
        // Wall on left
        entity.x = obstacle.x + obstacle.width;
        entity.velocity.x = 0;
      }
    }

    return true;
  }
}