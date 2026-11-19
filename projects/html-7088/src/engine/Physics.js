/**
 * AABB (Axis-Aligned Bounding Box) Physics Engine
 * Studio: B2.st
 * 
 * Separates axis resolution (Horizontal first, Vertical second)
 * Eliminates tile clipping, diagonal corner snapping, and tunneling.
 */

import { globalPhysicsCache } from '../core/performance_cache.js';

export class Physics {
    /**
     * Check basic intersection between two AABB bounding boxes
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
     * Resolve Entity vs Tilemap collisions with discrete step simulation
     * @param {Entity} entity 
     * @param {TileMap} tileMap 
     * @param {number} dt Delta time in seconds
     */
    static updateEntityTilePhysics(entity, tileMap, dt) {
        if (!entity.isAlive || entity.isStatic) return;

        // Apply Gravity
        if (entity.hasGravity) {
            entity.vel.y += entity.gravity * dt;
            if (entity.vel.y > entity.maxFallSpeed) {
                entity.vel.y = entity.maxFallSpeed;
            }
        }

        // --- STEP 1: HORIZONTAL AXIS MOVEMENT & RESOLUTION ---
        entity.pos.x += entity.vel.x * dt;
        
        let nearbyTiles = tileMap.getCollidableTilesInRegion(
            entity.pos.x - 4,
            entity.pos.y - 4,
            entity.size.x + 8,
            entity.size.y + 8
        );

        for (let i = 0; i < nearbyTiles.length; i++) {
            const tile = nearbyTiles[i];
            if (this.checkAABB(
                { x: entity.pos.x, y: entity.pos.y, width: entity.size.x, height: entity.size.y },
                tile
            )) {
                // Moving Right
                if (entity.vel.x > 0) {
                    entity.pos.x = tile.x - entity.size.x;
                    entity.onWallCollide('right', tile);
                } 
                // Moving Left
                else if (entity.vel.x < 0) {
                    entity.pos.x = tile.x + tile.width;
                    entity.onWallCollide('left', tile);
                }
                entity.vel.x = 0;
            }
        }

        // --- STEP 2: VERTICAL AXIS MOVEMENT & RESOLUTION ---
        entity.pos.y += entity.vel.y * dt;
        entity.isGrounded = false;

        nearbyTiles = tileMap.getCollidableTilesInRegion(
            entity.pos.x - 4,
            entity.pos.y - 4,
            entity.size.x + 8,
            entity.size.y + 8
        );

        for (let i = 0; i < nearbyTiles.length; i++) {
            const tile = nearbyTiles[i];
            if (this.checkAABB(
                { x: entity.pos.x, y: entity.pos.y, width: entity.size.x, height: entity.size.y },
                tile
            )) {
                // Falling Down (Ground contact)
                if (entity.vel.y > 0) {
                    entity.pos.y = tile.y - entity.size.y;
                    entity.vel.y = 0;
                    entity.isGrounded = true;
                    entity.onGroundLand(tile);
                } 
                // Jumping Up (Hitting ceiling/blocks)
                else if (entity.vel.y < 0) {
                    entity.pos.y = tile.y + tile.height;
                    entity.vel.y = 0;
                    entity.onCeilingHit(tile);
                }
            }
        }
    }

    /**
     * Resolve Inter-Entity collisions (Mario vs Goomba, Shell vs Enemy)
     * @param {Entity} a 
     * @param {Entity} b 
     * @returns {boolean}
     */
    static resolveEntityOverlap(a, b) {
        if (!a.isAlive || !b.isAlive) return false;

        const boxA = { x: a.pos.x, y: a.pos.y, width: a.size.x, height: a.size.y };
        const boxB = { x: b.pos.x, y: b.pos.y, width: b.size.x, height: b.size.y };

        if (!this.checkAABB(boxA, boxB)) return false;

        // Determine collision normal direction
        const prevBottomA = (a.pos.y - a.vel.y * 0.016) + a.size.y;
        const stomping = prevBottomA <= boxB.y + 6 && a.vel.y > 0;

        a.onEntityCollision(b, stomping ? 'top' : 'lateral');
        b.onEntityCollision(a, stomping ? 'bottom' : 'lateral');

        return true;
    }
}