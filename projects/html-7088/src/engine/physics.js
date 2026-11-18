/**
 * موتور فیزیک AABB و بردارها (2D Physics & Collision Engine)
 */
(function (global) {
  'use strict';

  class Vector2D {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }
    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }
    multiply(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      return this;
    }
    clone() {
      return new Vector2D(this.x, this.y);
    }
  }

  class BoundingBox {
    constructor(x = 0, y = 0, width = 16, height = 16) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    get left() { return this.x; }
    get right() { return this.x + this.width; }
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }

    intersects(other) {
      return (
        this.left < other.right &&
        this.right > other.left &&
        this.top < other.bottom &&
        this.bottom > other.top
      );
    }
  }

  class PhysicsEngine {
    constructor(options = {}) {
      this.gravity = options.gravity || 980; // پیکسل بر مجذور ثانیه
      this.terminalVelocity = options.terminalVelocity || 500;
      this.friction = options.friction || 0.88;
    }

    /**
     * اعمال نیروی گرانش و سرعت با گام زمانی معین
     */
    applyGravity(entity, dt) {
      if (!entity.isGrounded) {
        entity.velocity.y += this.gravity * dt;
        if (entity.velocity.y > this.terminalVelocity) {
          entity.velocity.y = this.terminalVelocity;
        }
      }
    }

    /**
     * اعمال اصطکاک افقی به بدنه
     */
    applyFriction(entity) {
      if (entity.isGrounded) {
        entity.velocity.x *= this.friction;
        if (Math.abs(entity.velocity.x) < 2) {
          entity.velocity.x = 0;
        }
      }
    }

    /**
     * حل برخورد جعبه محصورکننده با کاشی‌های سخت نقشه (Tilemap AABB Resolution)
     */
    resolveTileCollision(entity, levelMap, tileSize = 16) {
      const box = entity.getBounds();

      // ۱. بررسی و حل برخورد در محور Y
      entity.position.y += entity.velocity.y * (1 / 60);
      let updatedBox = entity.getBounds();
      let tilesY = levelMap.getSolidTilesInBox(updatedBox, tileSize);

      entity.isGrounded = false;
      for (const tile of tilesY) {
        if (entity.velocity.y > 0) { // سقوط به پایین و برخورد با زمین
          if (updatedBox.bottom > tile.top && updatedBox.top < tile.top) {
            entity.position.y = tile.top - entity.height;
            entity.velocity.y = 0;
            entity.isGrounded = true;
          }
        } else if (entity.velocity.y < 0) { // پرش به بالا و برخورد با زیر بلاک
          if (updatedBox.top < tile.bottom && updatedBox.bottom > tile.bottom) {
            entity.position.y = tile.bottom;
            entity.velocity.y = 0;
            if (tile.onHit) tile.onHit(entity);
          }
        }
      }

      // ۲. بررسی و حل برخورد در محور X
      entity.position.x += entity.velocity.x * (1 / 60);
      updatedBox = entity.getBounds();
      let tilesX = levelMap.getSolidTilesInBox(updatedBox, tileSize);

      for (const tile of tilesX) {
        if (entity.velocity.x > 0) { // حرکت به راست و برخورد با دیواره
          if (updatedBox.right > tile.left && updatedBox.left < tile.left) {
            entity.position.x = tile.left - entity.width;
            entity.velocity.x = 0;
          }
        } else if (entity.velocity.x < 0) { // حرکت به چپ
          if (updatedBox.left < tile.right && updatedBox.right > tile.right) {
            entity.position.x = tile.right;
            entity.velocity.x = 0;
          }
        }
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vector2D, BoundingBox, PhysicsEngine };
  } else {
    global.Vector2D = Vector2D;
    global.BoundingBox = BoundingBox;
    global.PhysicsEngine = PhysicsEngine;
  }
})(typeof window !== 'undefined' ? window : globalThis);