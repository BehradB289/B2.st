/**
 * استودیو B2.st - سیستم تشخیص و حل برخورد AABB
 * Axis-Aligned Bounding Box (AABB) & Gravity Engine
 */
import { Vector2D } from './Vector2D.js';

export const PHYSICS_CONFIG = {
    GRAVITY: 1100,         // شتاب گرانش به پیکسل بر مجذور ثانیه
    MAX_FALL_SPEED: 420,    // حداکثر سرعت سقوط ترمینال
    FRICTION: 600,          // اصطکاک سطح زمین
    AIR_RESISTANCE: 120     // مقاومت هوا در پرش
};

export class Physics {
    /**
     * بررسی برخورد دو جعبه محصورکننده (AABB Intersection)
     */
    static checkAABB(rectA, rectB) {
        return (
            rectA.pos.x < rectB.pos.x + rectB.size.x &&
            rectA.pos.x + rectA.size.x > rectB.pos.x &&
            rectA.pos.y < rectB.pos.y + rectB.size.y &&
            rectA.pos.y + rectA.size.y > rectB.pos.y
        );
    }

    /**
     * اعمال گرانش به انتیتی
     */
    static applyGravity(entity, dt) {
        if (!entity.hasGravity || entity.isDead) return;
        entity.vel.y += PHYSICS_CONFIG.GRAVITY * dt;
        if (entity.vel.y > PHYSICS_CONFIG.MAX_FALL_SPEED) {
            entity.vel.y = PHYSICS_CONFIG.MAX_FALL_SPEED;
        }
    }

    /**
     * حل برخورد موجودیت‌ها با تایل‌مپ در دو محور مستقل
     */
    static resolveTileMapCollisions(entity, tileMap, dt) {
        if (!entity.collidesWithWorld || entity.isDead) {
            entity.pos.x += entity.vel.x * dt;
            entity.pos.y += entity.vel.y * dt;
            return;
        }

        // حرکت و حل برخورد در راستای محور X
        entity.pos.x += entity.vel.x * dt;
        let boundsX = entity.getBounds();
        let tilesX = tileMap.getSolidTilesInRect(boundsX);

        for (const tile of tilesX) {
            if (entity.vel.x > 0) { // حرکت به راست
                entity.pos.x = tile.x - entity.size.x;
                entity.vel.x = 0;
                entity.onCollideHorizontal(1);
            } else if (entity.vel.x < 0) { // حرکت به چپ
                entity.pos.x = tile.x + tile.w;
                entity.vel.x = 0;
                entity.onCollideHorizontal(-1);
            }
        }

        // حرکت و حل برخورد در راستای محور Y
        entity.pos.y += entity.vel.y * dt;
        let boundsY = entity.getBounds();
        let tilesY = tileMap.getSolidTilesInRect(boundsY);
        entity.isGrounded = false;

        for (const tile of tilesY) {
            if (entity.vel.y > 0) { // سقوط به سمت پایین (برخورد به زمین)
                entity.pos.y = tile.y - entity.size.y;
                entity.vel.y = 0;
                entity.isGrounded = true;
                entity.onCollideVertical(1);
            } else if (entity.vel.y < 0) { // پرش به سمت بالا (برخورد به سقف)
                entity.pos.y = tile.y + tile.h;
                entity.vel.y = 0;
                entity.onCollideVertical(-1, tile);
            }
        }
    }
}