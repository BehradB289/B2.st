/**
 * AABB (Axis-Aligned Bounding Box) Physics & Collision Solver
 */
export class Physics {
  /**
   * Checks overlap between two Axis-Aligned Bounding Boxes
   */
  static checkAABB(boxA, boxB) {
    return (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    );
  }

  /**
   * Resolves tilemap collision for an entity moving within a grid
   */
  static resolveTileMapCollisions(entity, tileMap, tileSize = 16) {
    entity.isGrounded = false;

    // Horizontal resolution
    entity.position.x += entity.velocity.x * entity.dt;
    let bounds = entity.getBounds();
    let startCol = Math.floor(bounds.x / tileSize);
    let endCol = Math.floor((bounds.x + bounds.width) / tileSize);
    let startRow = Math.floor(bounds.y / tileSize);
    let endRow = Math.floor((bounds.y + bounds.height - 0.1) / tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (tileMap.isSolid(c, r)) {
          if (entity.velocity.x > 0) {
            entity.position.x = c * tileSize - bounds.width - entity.collisionOffset.x;
            entity.velocity.x = 0;
            entity.onWallCollision?.(1);
          } else if (entity.velocity.x < 0) {
            entity.position.x = (c + 1) * tileSize - entity.collisionOffset.x;
            entity.velocity.x = 0;
            entity.onWallCollision?.(-1);
          }
        }
      }
    }

    // Vertical resolution
    entity.position.y += entity.velocity.y * entity.dt;
    bounds = entity.getBounds();
    startCol = Math.floor(bounds.x / tileSize);
    endCol = Math.floor((bounds.x + bounds.width - 0.1) / tileSize);
    startRow = Math.floor(bounds.y / tileSize);
    endRow = Math.floor((bounds.y + bounds.height) / tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (tileMap.isSolid(c, r)) {
          if (entity.velocity.y > 0) {
            entity.position.y = r * tileSize - bounds.height - entity.collisionOffset.y;
            entity.velocity.y = 0;
            entity.isGrounded = true;
          } else if (entity.velocity.y < 0) {
            entity.position.y = (r + 1) * tileSize - entity.collisionOffset.y;
            entity.velocity.y = 0;
            tileMap.onTileHitFromBelow?.(c, r, entity);
          }
        }
      }
    }
  }

  /**
   * Applies standard gravitational force to dynamic bodies
   */
  static applyGravity(entity, gravity, maxFallSpeed, dt) {
    if (!entity.isGrounded) {
      entity.velocity.y += gravity * dt;
      if (entity.velocity.y > maxFallSpeed) {
        entity.velocity.y = maxFallSpeed;
      }
    }
  }
}