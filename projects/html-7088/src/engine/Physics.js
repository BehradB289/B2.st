import { GameConfig } from '../../config/game.config.js';
import { AABB } from './AABB.js';

/**
 * Studio B2.st - AABB Physics Engine & Tile/Entity Collision Resolver
 */
export class PhysicsEngine {
  constructor(tileMap) {
    this.tileMap = tileMap;
    this.gravity = GameConfig.WORLD.GRAVITY;
    this.terminalVelocity = GameConfig.WORLD.TERMINAL_VELOCITY;
    this._tempTileBox = new AABB();
  }

  updateEntity(entity, dt, onHitCeiling = null) {
    if (!entity.alive) return;

    // Apply gravity
    if (!entity.grounded) {
      entity.velocity.y += this.gravity * dt;
      if (entity.velocity.y > this.terminalVelocity) {
        entity.velocity.y = this.terminalVelocity;
      }
    }

    // 1) Horizontal movement & resolution
    entity.position.x += entity.velocity.x * dt;
    this._resolveHorizontalTileCollisions(entity);

    // 2) Vertical movement & resolution
    entity.position.y += entity.velocity.y * dt;
    entity.grounded = false;
    this._resolveVerticalTileCollisions(entity, onHitCeiling);
  }

  _resolveHorizontalTileCollisions(entity) {
    const box = entity.getHitbox();
    const startTileX = Math.floor(box.left / GameConfig.WORLD.TILE_SIZE);
    const endTileX = Math.floor(box.right / GameConfig.WORLD.TILE_SIZE);
    const startTileY = Math.floor(box.top / GameConfig.WORLD.TILE_SIZE);
    const endTileY = Math.floor(box.bottom / GameConfig.WORLD.TILE_SIZE);

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileId = this.tileMap.getTile(tx, ty);
        if (this.tileMap.isSolid(tileId)) {
          this._tempTileBox.set(
            tx * GameConfig.WORLD.TILE_SIZE,
            ty * GameConfig.WORLD.TILE_SIZE,
            GameConfig.WORLD.TILE_SIZE,
            GameConfig.WORLD.TILE_SIZE
          );

          if (box.intersects(this._tempTileBox)) {
            if (entity.velocity.x > 0) {
              entity.position.x = this._tempTileBox.left - entity.hitboxOffset.x - entity.hitboxSize.x;
              entity.velocity.x = 0;
              entity.onWallHit?.('right');
            } else if (entity.velocity.x < 0) {
              entity.position.x = this._tempTileBox.right - entity.hitboxOffset.x;
              entity.velocity.x = 0;
              entity.onWallHit?.('left');
            }
          }
        }
      }
    }
  }

  _resolveVerticalTileCollisions(entity, onHitCeiling) {
    const box = entity.getHitbox();
    const startTileX = Math.floor(box.left / GameConfig.WORLD.TILE_SIZE);
    const endTileX = Math.floor(box.right / GameConfig.WORLD.TILE_SIZE);
    const startTileY = Math.floor(box.top / GameConfig.WORLD.TILE_SIZE);
    const endTileY = Math.floor(box.bottom / GameConfig.WORLD.TILE_SIZE);

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileId = this.tileMap.getTile(tx, ty);
        if (this.tileMap.isSolid(tileId)) {
          this._tempTileBox.set(
            tx * GameConfig.WORLD.TILE_SIZE,
            ty * GameConfig.WORLD.TILE_SIZE,
            GameConfig.WORLD.TILE_SIZE,
            GameConfig.WORLD.TILE_SIZE
          );

          if (box.intersects(this._tempTileBox)) {
            if (entity.velocity.y > 0) {
              // Landing on top of tile
              entity.position.y = this._tempTileBox.top - entity.hitboxOffset.y - entity.hitboxSize.y;
              entity.velocity.y = 0;
              entity.grounded = true;
            } else if (entity.velocity.y < 0) {
              // Hitting tile from underneath
              entity.position.y = this._tempTileBox.bottom - entity.hitboxOffset.y;
              entity.velocity.y = 0;
              if (onHitCeiling) {
                onHitCeiling(tx, ty, tileId);
              }
            }
          }
        }
      }
    }
  }
}