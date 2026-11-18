/**
 * موتور فیزیک AABB با تفکیک محورها و مدیریت برخورد ماریو با نقشه و بلوک‌ها
 */
export class Physics {
  constructor(gravity = 1100) {
    this.gravity = gravity;
  }

  /**
   * اعمال گرانش به کاراکتر
   */
  applyGravity(entity, dt) {
    if (!entity.isGrounded) {
      entity.vel.y += this.gravity * dt;
      // سقف سرعت سقوط
      if (entity.vel.y > 550) {
        entity.vel.y = 550;
      }
    }
  }

  /**
   * حل برخورد موجودیت با بلوک‌های نقشه تایل با تفکیک X و Y
   */
  resolveEntityTileMap(entity, tileMap, camera, dt) {
    // ۱. حرکت در راستای افقی
    entity.pos.x += entity.vel.x * dt;

    // مهار با دیواره سمت چپ کادر دوربین
    if (camera && entity.pos.x < camera.x) {
      entity.pos.x = camera.x;
      if (entity.vel.x < 0) entity.vel.x = 0;
    }

    this.checkHorizontalCollisions(entity, tileMap);

    // ۲. حرکت در راستای عمودی
    entity.pos.y += entity.vel.y * dt;
    entity.isGrounded = false;

    this.checkVerticalCollisions(entity, tileMap);
  }

  checkHorizontalCollisions(entity, tileMap) {
    const hitbox = entity.getHitbox();
    const startCol = Math.floor(hitbox.x / tileMap.tileSize);
    const endCol = Math.floor((hitbox.x + hitbox.width) / tileMap.tileSize);
    const startRow = Math.floor(hitbox.y / tileMap.tileSize);
    const endRow = Math.floor((hitbox.y + hitbox.height - 0.1) / tileMap.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (tileMap.isSolid(c, r)) {
          if (entity.vel.x > 0) {
            // برخورد به مانع از سمت چپ
            entity.pos.x = c * tileMap.tileSize - hitbox.width - entity.hitboxOffset.x;
            entity.vel.x = 0;
          } else if (entity.vel.x < 0) {
            // برخورد به مانع از سمت راست
            entity.pos.x = (c + 1) * tileMap.tileSize - entity.hitboxOffset.x;
            entity.vel.x = 0;
          }
          return;
        }
      }
    }
  }

  checkVerticalCollisions(entity, tileMap) {
    const hitbox = entity.getHitbox();
    const startCol = Math.floor((hitbox.x + 1) / tileMap.tileSize);
    const endCol = Math.floor((hitbox.x + hitbox.width - 1) / tileMap.tileSize);
    const startRow = Math.floor(hitbox.y / tileMap.tileSize);
    const endRow = Math.floor((hitbox.y + hitbox.height) / tileMap.tileSize);

    for (let c = startCol; c <= endCol; c++) {
      for (let r = startRow; r <= endRow; r++) {
        if (tileMap.isSolid(c, r)) {
          if (entity.vel.y > 0) {
            // فرود روی زمین یا سقف بلوک
            entity.pos.y = r * tileMap.tileSize - hitbox.height - entity.hitboxOffset.y;
            entity.vel.y = 0;
            entity.isGrounded = true;
            return;
          } else if (entity.vel.y < 0) {
            // برخورد سر به کف بلوک (Head-bump)
            entity.pos.y = (r + 1) * tileMap.tileSize - entity.hitboxOffset.y;
            entity.vel.y = 0;

            // ضربه زدن به بلوک تعاملی
            tileMap.bumpTile(c, r, entity);
            return;
          }
        }
      }
    }
  }

  /**
   * تست برخورد همپوشانی دو مستطیل AABB
   */
  static testAABB(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }
}