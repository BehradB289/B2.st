import { Vector2D } from '../engine/Vector2D.js';

/**
 * کلاس پایه برای تمام اشیا، کاراکترها و ذرات بازی
 */
export class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(0, 0);
    this.width = width;
    this.height = height;
    this.hitboxOffset = { x: 0, y: 0 };
    this.hitboxSize = { width, height };
    this.isDead = false;
  }

  getHitbox() {
    return {
      x: this.pos.x + this.hitboxOffset.x,
      y: this.pos.y + this.hitboxOffset.y,
      width: this.hitboxSize.width,
      height: this.hitboxSize.height
    };
  }

  update(dt) {
    this.pos.add(this.vel.clone().scale(dt));
  }

  render(ctx) {
    // کلاس‌های فرزند رندر اختصاصی خود را پیاده‌سازی می‌کنند
  }
}