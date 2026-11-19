/**
 * Physics & AABB Collision Engine
 * Studio: B2.st
 */
import { GAME_CONFIG } from '../../config/game_config.js';

export class PhysicsEngine {
    constructor() {
        this.gravity = GAME_CONFIG.PHYSICS.GRAVITY;
        this.maxFallSpeed = GAME_CONFIG.PHYSICS.MAX_FALL_SPEED;
    }

    /**
     * Integrates entity velocity and gravity
     * @param {Entity} entity
     * @param {number} dt Delta time
     */
    applyForces(entity, dt) {
        if (!entity.isDynamic) return;

        // Apply Gravity
        entity.vy += this.gravity * dt;
        if (entity.vy > this.maxFallSpeed) {
            entity.vy = this.maxFallSpeed;
        }

        // Apply Ground/Air Friction
        if (entity.onGround) {
            entity.vx *= GAME_CONFIG.PHYSICS.FRICTION;
        } else {
            entity.vx *= GAME_CONFIG.PHYSICS.AIR_RESISTANCE;
        }

        if (Math.abs(entity.vx) < 0.1) entity.vx = 0;
    }

    /**
     * Checks Axis-Aligned Bounding Box (AABB) intersection
     * @param {Object} a {x, y, width, height}
     * @param {Object} b {x, y, width, height}
     * @returns {boolean}
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
     * Resolves movement against static tilemap matrix
     * @param {Entity} entity
     * @param {LevelManager} levelManager
     * @param {number} dt
     */
    resolveTileCollisions(entity, levelManager, dt) {
        if (!entity.isDynamic) return;

        const tileSize = GAME_CONFIG.WORLD.TILE_SIZE;

        // 1. Resolve Horizontal Movement
        entity.x += entity.vx * dt;
        let leftTile = Math.floor(entity.x / tileSize);
        let rightTile = Math.floor((entity.x + entity.width - 0.01) / tileSize);
        let topTile = Math.floor(entity.y / tileSize);
        let bottomTile = Math.floor((entity.y + entity.height - 0.01) / tileSize);

        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (levelManager.isSolidTile(tx, ty)) {
                    if (entity.vx > 0) {
                        entity.x = tx * tileSize - entity.width;
                        entity.onCollideSide('right');
                    } else if (entity.vx < 0) {
                        entity.x = (tx + 1) * tileSize;
                        entity.onCollideSide('left');
                    }
                    entity.vx = 0;
                }
            }
        }

        // 2. Resolve Vertical Movement
        entity.y += entity.vy * dt;
        entity.onGround = false;

        leftTile = Math.floor(entity.x / tileSize);
        rightTile = Math.floor((entity.x + entity.width - 0.01) / tileSize);
        topTile = Math.floor(entity.y / tileSize);
        bottomTile = Math.floor((entity.y + entity.height - 0.01) / tileSize);

        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (levelManager.isSolidTile(tx, ty)) {
                    if (entity.vy > 0) { // Falling onto surface
                        entity.y = ty * tileSize - entity.height;
                        entity.vy = 0;
                        entity.onGround = true;
                        entity.onCollideBottom();
                    } else if (entity.vy < 0) { // Jumping into ceiling
                        entity.y = (ty + 1) * tileSize;
                        entity.vy = 0;
                        entity.onCollideTop(tx, ty);
                    }
                }
            }
        }

        // Level floor kill boundary
        if (entity.y > levelManager.mapHeight * tileSize) {
            entity.kill('fall');
        }
    }

    /**
     * Resolves Dynamic Entity vs Dynamic Entity collision
     * @param {Entity} entityA
     * @param {Entity} entityB
     */
    static resolveEntityCollision(entityA, entityB) {
        if (!PhysicsEngine.checkAABB(entityA, entityB)) return null;

        // Calculate overlap depths
        const overlapX = (entityA.width + entityB.width) / 2 - Math.abs((entityA.x + entityA.width / 2) - (entityB.x + entityB.width / 2));
        const overlapY = (entityA.height + entityB.height) / 2 - Math.abs((entityA.y + entityA.height / 2) - (entityB.y + entityB.height / 2));

        let side = 'unknown';
        if (overlapX < overlapY) {
            side = entityA.x < entityB.x ? 'left' : 'right';
        } else {
            side = entityA.y < entityB.y ? 'top' : 'bottom';
        }

        return { side, overlapX, overlapY };
    }
}