/**
 * موتور فیزیک AABB و آشکارساز برخورد با سطوح تایل‌مپ
 */
export class Physics {
    /**
     * بررسی تداخل دو جعبه محاطی (Axis-Aligned Bounding Box)
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
     * حل و فصل برخوردهای موجود بین موجودیت و تایل‌های جامد نقشه
     * @param {import('../entities/Entity.js').Entity} entity 
     * @param {import('../levels/TileMap.js').TileMap} tileMap 
     * @param {number} dt 
     */
    static resolveTileCollisions(entity, tileMap, dt) {
        const tileSize = tileMap.tileSize;

        // --- مرحله اول: شبیه‌سازی و تصحیح محور افقی (X) ---
        entity.position.x += entity.velocity.x * dt;

        let startCol = Math.floor(entity.position.x / tileSize);
        let endCol = Math.floor((entity.position.x + entity.size.x - 0.01) / tileSize);
        let startRow = Math.floor(entity.position.y / tileSize);
        let endRow = Math.floor((entity.position.y + entity.size.y - 0.01) / tileSize);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = tileMap.getTile(c, r);
                if (tile && tile.solid) {
                    if (entity.velocity.x > 0) {
                        entity.position.x = c * tileSize - entity.size.x;
                        entity.velocity.x = 0;
                        entity.onCollideHorizontal(1, c, r);
                    } else if (entity.velocity.x < 0) {
                        entity.position.x = (c + 1) * tileSize;
                        entity.velocity.x = 0;
                        entity.onCollideHorizontal(-1, c, r);
                    }
                }
            }
        }

        // --- مرحله دوم: شبیه‌سازی و تصحیح محور عمودی (Y) ---
        entity.position.y += entity.velocity.y * dt;
        entity.isGrounded = false;

        startCol = Math.floor(entity.position.x / tileSize);
        endCol = Math.floor((entity.position.x + entity.size.x - 0.01) / tileSize);
        startRow = Math.floor(entity.position.y / tileSize);
        endRow = Math.floor((entity.position.y + entity.size.y - 0.01) / tileSize);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = tileMap.getTile(c, r);
                if (tile && tile.solid) {
                    if (entity.velocity.y > 0) {
                        // سقوط بر روی زمین
                        entity.position.y = r * tileSize - entity.size.y;
                        entity.velocity.y = 0;
                        entity.isGrounded = true;
                        entity.onCollideVertical(1, c, r);
                    } else if (entity.velocity.y < 0) {
                        // برخورد سر ماریو با بلوک‌های بالاسر
                        entity.position.y = (r + 1) * tileSize;
                        entity.velocity.y = 0;
                        entity.onCollideVertical(-1, c, r);
                    }
                }
            }
        }
    }
}