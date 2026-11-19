import { GAME_CONFIG } from '../../config/game.config.js';

/**
 * 2D AABB Physics Engine
 * Separates axis resolution (Horizontal first, Vertical second)
 * to avoid corner tunneling and ghost wall collisions.
 */
export class PhysicsEngine {
  constructor(config = GAME_CONFIG) {
    this.gravity = config.GRAVITY;
    this.terminalVelocity = config.TERMINAL_VELOCITY;
    this.friction = config.FRICTION;
  }

  applyGravity(entity, dt) {
    if (entity.isStatic || !entity.hasGravity) return;

    entity.vel.y += this.gravity * dt;
    if (entity.vel.y > this.terminalVelocity) {
      entity.vel.y = this.terminalVelocity;
    }
  }

  applyFriction(entity, dt) {
    if (entity.isStatic || !entity.isGrounded) return;

    if (entity.accelX === 0) {
      if (entity.vel.x > 0) {
        entity.vel.x = Math.max(0, entity.vel.x - this.friction * dt);
      } else if (entity.vel.x < 0) {
        entity.vel.x = Math.min(0, entity.vel.x + this.friction * dt);
      }
    }
  }

  updateEntityKinematics(entity, dt) {
    this.applyGravity(entity, dt);
    this.applyFriction(entity, dt);
  }

  resolveTileMapCollisions(entity, tileMap, dt) {
    if (entity.isStatic) return;

    // 1. Horizontal Motion & Collision Resolution
    entity.pos.x += entity.vel.x * dt;
    let bounds = entity.getBounds();
    let solidTiles = tileMap.getSolidTilesInAABB(bounds);

    for (const tile of solidTiles) {
      if (entity.vel.x > 0) {
        entity.pos.x = tile.x - entity.size.x;
        entity.vel.x = 0;
        entity.onWallHit?.('RIGHT');
      } else if (entity.vel.x < 0) {
        entity.pos.x = tile.x + tile.width;
        entity.vel.x = 0;
        entity.onWallHit?.('LEFT');
      }
      bounds = entity.getBounds();
    }

    // 2. Vertical Motion & Collision Resolution
    entity.pos.y += entity.vel.y * dt;
    bounds = entity.getBounds();
    solidTiles = tileMap.getSolidTilesInAABB(bounds);

    entity.isGrounded = false;

    for (const tile of solidTiles) {
      if (entity.vel.y > 0) {
        // Landing on floor/tile top
        entity.pos.y = tile.y - entity.size.y;
        entity.vel.y = 0;
        entity.isGrounded = true;
      } else if (entity.vel.y < 0) {
        // Hitting ceiling / block underside
        entity.pos.y = tile.y + tile.height;
        entity.vel.y = GAME_CONFIG.HEAD_BUMP_REBOUND;
        entity.onHeadBump?.(tile);
      }
      bounds = entity.getBounds();
    }
  }

  resolveDynamicPair(entityA, entityB) {
    if (!entityA.active || !entityB.active) return null;

    const boxA = entityA.getBounds();
    const boxB = entityB.getBounds();

    if (!boxA.intersects(boxB)) {
      return null;
    }

    // Check stomping condition:
    // Entity A falling from top onto Entity B
    const aBottom = boxA.bottom;
    const bTop = boxB.top;
    const dy = aBottom - bTop;

    const isStomp = (
      entityA.vel.y > 0 &&
      dy <= 12 &&
      entityA.pos.y < entityB.pos.y
    );

    return {
      type: isStomp ? 'STOMP' : 'HORIZONTAL_CONTACT',
      entityA,
      entityB,
      dy
    };
  }

  step(entities, tileMap, dt) {
    for (const entity of entities) {
      if (!entity.active) continue;
      this.updateEntityKinematics(entity, dt);
      this.resolveTileMapCollisions(entity, tileMap, dt);
      entity.update(dt);
    }
  }
}