/**
 * @file Physics.js
 * @description Robust AABB Collision Engine & Clamped Integrator.
 */

"use strict";

import { Guardian } from "../security/Guardian.js";

export class Physics {
    static GRAVITY = 0.65;
    static TERMINAL_VELOCITY = 14;

    static applyGravity(entity) {
        entity.vy = Guardian.sanitizeNumber(
            entity.vy + Physics.GRAVITY,
            -Physics.TERMINAL_VELOCITY,
            Physics.TERMINAL_VELOCITY,
            0
        );
    }

    static checkAABB(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    static resolveMapCollision(entity, map) {
        // Horizontal resolution
        entity.x += entity.vx;
        let tiles = map.getSolidTilesNearby(entity.x, entity.y, entity.width, entity.height);
        for (const tile of tiles) {
            if (Physics.checkAABB(entity, tile)) {
                if (entity.vx > 0) {
                    entity.x = tile.x - entity.width;
                } else if (entity.vx < 0) {
                    entity.x = tile.x + tile.width;
                }
                entity.vx = 0;
            }
        }

        // Vertical resolution
        entity.y += entity.vy;
        entity.onGround = false;
        tiles = map.getSolidTilesNearby(entity.x, entity.y, entity.width, entity.height);
        for (const tile of tiles) {
            if (Physics.checkAABB(entity, tile)) {
                if (entity.vy > 0) {
                    entity.y = tile.y - entity.height;
                    entity.vy = 0;
                    entity.onGround = true;
                } else if (entity.vy < 0) {
                    entity.y = tile.y + tile.height;
                    entity.vy = 0;
                    if (tile.type === "question") {
                        map.hitQuestionBlock(tile.gridX, tile.gridY);
                    }
                }
            }
        }
    }
}