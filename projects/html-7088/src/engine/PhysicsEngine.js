import { Vector2D } from './Vector2D.js';

export const PHYSICS_CONSTANTS = {
  GRAVITY: 980,             // px/s^2
  TERMINAL_VELOCITY: 600,   // px/s max downward speed
  FRICTION: 0.88,           // Horizontal ground damping factor
  AIR_RESISTANCE: 0.98      // Horizontal air damping factor
};

/**
 * Core 2D AABB Physics Engine handling integration, tile map collision,
 * and entity-to-entity interactions.
 */
export class PhysicsEngine {
  constructor(options = {}) {
    this.gravity = options.gravity ?? PHYSICS_CONSTANTS.GRAVITY;
    this.terminalVelocity = options.terminalVelocity ?? PHYSICS_CONSTANTS.TERMINAL_VELOCITY;
    this.friction = options.friction ?? PHYSICS_CONSTANTS.FRICTION;
    this.airResistance = options.airResistance ?? PHYSICS_CONSTANTS.AIR_RESISTANCE;
  }

  /**
   * Integrates an entity's velocity and position for one delta-time step.
   * @param {import('../entities/Entity.js').Entity} entity
   * @param {number} dt Delta time in seconds
   */
  integrate(entity, dt) {
    if (!entity.isDynamic || !entity.isAlive) return;

    // Apply gravity to vertical velocity
    entity.vel.y += this.gravity * dt;
    if (entity.vel.y > this.terminalVelocity) {
      entity.vel.y = this.terminalVelocity;
    }

    // Apply damping
    const damping = entity.isGrounded ? this.friction : this.airResistance;
    entity.vel.x *= Math.pow(damping, dt * 60);

    // Apply linear motion
    entity.pos.x += entity.vel.x * dt;
    entity.pos.y += entity.vel.y * dt;
  }

  /**
   * Resolves collision between an entity and solid tiles in the level.
   * @param {import('../entities/Entity.js').Entity} entity
   * @param {import('../levels/TileMap.js').TileMap} tileMap
   */
  resolveTileMapCollisions(entity, tileMap) {
    if (!entity.isDynamic || !tileMap) return;

    // Assume airborne until verified by ground collision
    entity.isGrounded = false;

    const nearbyTiles = tileMap.getSolidTilesInAABB(entity.getAABB());

    for (const tile of nearbyTiles) {
      const entityBox = entity.getAABB();
      const overlap = entityBox.getOverlap(tile.aabb);

      if (!overlap) continue;

      // Resolve along minimum penetration axis
      if (overlap.ox < overlap.oy) {
        // Horizontal resolution
        if (overlap.dx > 0) {
          // Entity is to the right of tile
          entity.pos.x += overlap.ox;
          entity.vel.x = Math.max(0, entity.vel.x);
        } else {
          // Entity is to the left of tile
          entity.pos.x -= overlap.ox;
          entity.vel.x = Math.min(0, entity.vel.x);
        }
        entity.onWallCollision(tile);
      } else {
        // Vertical resolution
        if (overlap.dy > 0) {
          // Entity hit ceiling
          entity.pos.y += overlap.oy;
          entity.vel.y = Math.max(0, entity.vel.y);
          entity.onCeilingCollision(tile);
        } else {
          // Entity landed on solid surface
          entity.pos.y -= overlap.oy;
          entity.vel.y = 0;
          entity.isGrounded = true;
          entity.onGroundCollision(tile);
        }
      }
    }
  }

  /**
   * Resolves interaction between Mario and another entity (Goomba, Coin, etc.).
   * @param {import('../entities/Mario.js').Mario} mario
   * @param {import('../entities/Entity.js').Entity} other
   * @returns {string|null} Event name or null
   */
  resolveEntityInteraction(mario, other) {
    if (!mario.isAlive || !other.isAlive) return null;
    if (!mario.getAABB().intersects(other.getAABB())) return null;

    if (other.type === 'coin') {
      other.collect();
      mario.addCoins(1);
      mario.addScore(200);
      return 'coin_collected';
    }

    if (other.type === 'goomba') {
      // Mario stomps Goomba if falling and his feet strike the upper torso of the Goomba
      const isFalling = mario.vel.y > 0;
      const marioBottom = mario.pos.y + mario.height;
      const goombaTop = other.pos.y;
      const stompThreshold = goombaTop + (other.height * 0.55);

      if (isFalling && marioBottom <= stompThreshold) {
        other.squash();
        mario.bounce();
        mario.addScore(100);
        return 'goomba_stomped';
      } else {
        mario.takeDamage();
        return 'mario_damaged';
      }
    }

    return null;
  }
}