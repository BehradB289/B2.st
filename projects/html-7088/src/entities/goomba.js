/**
 * انتیتی دشمن کلاسیک گومبا (Goomba Enemy Entity)
 */
(function (global) {
  'use strict';

  const BBox = typeof BoundingBox !== 'undefined'
    ? BoundingBox
    : (typeof require !== 'undefined' ? require('../engine/physics').BoundingBox : null);

  const Vec = typeof Vector2D !== 'undefined'
    ? Vector2D
    : (typeof require !== 'undefined' ? require('../engine/physics').Vector2D : null);

  class Goomba {
    constructor(id, x, y) {
      this.id = id;
      this.position = new Vec(x, y);
      this.velocity = new Vec(-35, 0);
      this.width = 16;
      this.height = 16;
      this.isGrounded = false;
      this.isSquashed = false;
      this.isDead = false;
      this.squashTimer = 0;
      this.walkTimer = 0;
      this.animFrame = 0;
    }

    getBounds() {
      return new BBox(this.position.x, this.position.y, this.width, this.height);
    }

    squash() {
      this.isSquashed = true;
      this.velocity.set(0, 0);
      this.squashTimer = 0.5; // مدت نمایش له شده قبل از حذف
    }

    update(dt, levelMap) {
      if (this.isDead) return;

      if (this.isSquashed) {
        this.squashTimer -= dt;
        if (this.squashTimer <= 0) {
          this.isDead = true;
        }
        return;
      }

      this.walkTimer += dt;
      if (this.walkTimer > 0.2) {
        this.animFrame = 1 - this.animFrame;
        this.walkTimer = 0;
      }

      // حرکت افقی ساده
      this.position.x += this.velocity.x * dt;

      // بررسی برخورد با دیواره و بازگشت مسیر
      const bounds = this.getBounds();
      const solidTiles = levelMap.getSolidTilesInBox(bounds, 16);
      if (solidTiles.length > 0) {
        this.velocity.x = -this.velocity.x;
      }
    }

    render(ctx, camera) {
      if (this.isDead) return;
      const screenX = Math.round(this.position.x - camera.x);
      const screenY = Math.round(this.position.y - camera.y);

      // رسم شکل رترو 8-بیتی بدون نیاز به بارگذاری فایل سنگین خارجی
      if (this.isSquashed) {
        ctx.fillStyle = '#b84418';
        ctx.fillRect(screenX, screenY + 10, 16, 6);
        ctx.fillStyle = '#fce4a6';
        ctx.fillRect(screenX + 3, screenY + 11, 10, 3);
        return;
      }

      // کلاه قارچ قهوه‌ای
      ctx.fillStyle = '#b84418';
      ctx.fillRect(screenX + 2, screenY, 12, 9);
      ctx.fillRect(screenX + 1, screenY + 3, 14, 5);

      // صورت و چشم‌ها
      ctx.fillStyle = '#fce4a6';
      ctx.fillRect(screenX + 4, screenY + 9, 8, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + (this.animFrame ? 4 : 5), screenY + 6, 2, 4);
      ctx.fillRect(screenX + (this.animFrame ? 10 : 9), screenY + 6, 2, 4);

      // پاهای مشکی متحرک
      ctx.fillStyle = '#000000';
      if (this.animFrame === 0) {
        ctx.fillRect(screenX + 1, screenY + 13, 5, 3);
        ctx.fillRect(screenX + 10, screenY + 13, 5, 3);
      } else {
        ctx.fillRect(screenX + 3, screenY + 13, 10, 3);
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Goomba };
  } else {
    global.Goomba = Goomba;
  }
})(typeof window !== 'undefined' ? window : globalThis);