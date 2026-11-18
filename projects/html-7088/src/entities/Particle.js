import { Entity } from './Entity.js';

/**
 * خرده‌های ۴ گانه آجر خرد شده
 */
export class BrickPiece extends Entity {
  constructor(x, y, vx, vy) {
    super(x, y, 8, 8);
    this.vel.set(vx, vy);
    this.gravity = 1200;
    this.rotation = 0;
    this.rotSpeed = vx * 2.5;
    this.life = 1.2;
  }

  update(dt) {
    this.vel.y += this.gravity * dt;
    this.rotation += this.rotSpeed * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(Math.floor(this.pos.x + 4), Math.floor(this.pos.y + 4));
    ctx.rotate(this.rotation);
    ctx.fillStyle = '#b84418';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = '#fc9838';
    ctx.fillRect(-3, -3, 6, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-4, 2, 8, 2);
    ctx.restore();
  }
}

/**
 * انیمیشن پرش سکه از داخل بلوک علامت سوال
 */
export class BouncingCoin extends Entity {
  constructor(x, y) {
    super(x, y, 10, 14);
    this.startY = y;
    this.vel.set(0, -320);
    this.gravity = 1400;
    this.frame = 0;
    this.frameTimer = 0;
  }

  update(dt) {
    this.vel.y += this.gravity * dt;
    this.pos.y += this.vel.y * dt;

    this.frameTimer += dt;
    if (this.frameTimer > 0.08) {
      this.frame = (this.frame + 1) % 4;
      this.frameTimer = 0;
    }

    // زمانی که به پایین‌تر از نقطه اولیه برگشت از بین می‌رود
    if (this.vel.y > 0 && this.pos.y >= this.startY - 4) {
      this.isDead = true;
    }
  }

  render(ctx) {
    const x = Math.floor(this.pos.x);
    const y = Math.floor(this.pos.y);

    ctx.save();
    let coinWidth = 10;
    if (this.frame === 1 || this.frame === 3) coinWidth = 6;
    if (this.frame === 2) coinWidth = 2;

    const offsetX = (10 - coinWidth) / 2;
    ctx.fillStyle = '#fcd800';
    ctx.fillRect(x + offsetX, y, coinWidth, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + offsetX + 1, y + 2, Math.max(1, coinWidth - 2), 2);
    ctx.restore();
  }
}

/**
 * نمایشگر امتیاز شناور مانند +200
 */
export class FloatingScore extends Entity {
  constructor(x, y, text = '200') {
    super(x, y, 16, 8);
    this.text = text;
    this.vel.set(0, -45);
    this.life = 0.65;
  }

  update(dt) {
    this.pos.y += this.vel.y * dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.text, Math.floor(this.pos.x), Math.floor(this.pos.y));
    ctx.restore();
  }
}