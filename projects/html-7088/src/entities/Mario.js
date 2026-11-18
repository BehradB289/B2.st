import { Entity } from './Entity.js';
import { sound } from '../engine/Audio.js';

/**
 * کاراکتر ماریو با مکانیک‌های فیزیکی دویدن، شتاب، ترمز، پرش متغیر و انیمیشن رترو
 */
export class Mario extends Entity {
  constructor(x = 40, y = 180) {
    super(x, y, 16, 16);

    // هیت‌باکس دقیق‌تر و منصفانه‌تر از کادر ۱۶×۱۶
    this.hitboxOffset = { x: 2, y: 1 };
    this.hitboxSize = { width: 12, height: 15 };

    this.isGrounded = false;
    this.facingRight = true;

    // پارامترهای کنترل حرکت
    this.accelX = 400;
    this.maxWalkSpeed = 130;
    this.maxRunSpeed = 220;
    this.friction = 350;
    this.jumpForce = -390;

    // فریم‌های انیمیشن
    this.animTimer = 0;
    this.runFrame = 0;
    this.isSkidding = false;
  }

  handleInput(input, dt) {
    const maxSpeed = input.keys.run ? this.maxRunSpeed : this.maxWalkSpeed;

    // ۱. حرکت افقی
    if (input.keys.left) {
      this.facingRight = false;
      if (this.vel.x > 0) {
        this.isSkidding = true;
        this.vel.x -= (this.accelX * 2.2) * dt;
      } else {
        this.isSkidding = false;
        this.vel.x -= this.accelX * dt;
      }
    } else if (input.keys.right) {
      this.facingRight = true;
      if (this.vel.x < 0) {
        this.isSkidding = true;
        this.vel.x += (this.accelX * 2.2) * dt;
      } else {
        this.isSkidding = false;
        this.vel.x += this.accelX * dt;
      }
    } else {
      this.isSkidding = false;
      // اعمال اصطکاک هنگام رها شدن کلیدها
      if (this.vel.x > 0) {
        this.vel.x = Math.max(0, this.vel.x - this.friction * dt);
      } else if (this.vel.x < 0) {
        this.vel.x = Math.min(0, this.vel.x + this.friction * dt);
      }
    }

    // مهار سقف سرعت
    if (this.vel.x > maxSpeed) this.vel.x = maxSpeed;
    if (this.vel.x < -maxSpeed) this.vel.x = -maxSpeed;

    // ۲. جهش با ارتفاع متغیر
    if (input.jumpPressed && this.isGrounded) {
      this.vel.y = this.jumpForce;
      this.isGrounded = false;
      sound.playJump();
    }

    // جهش کوتاه در صورت رها کردن زودهنگام کلید
    if (!input.keys.jump && this.vel.y < -160) {
      this.vel.y = -160;
    }
  }

  updateAnimation(dt) {
    if (!this.isGrounded) {
      // وضعیت در حال پرش
      this.animState = 'jump';
    } else if (this.isSkidding) {
      this.animState = 'skid';
    } else if (Math.abs(this.vel.x) > 10) {
      this.animState = 'run';
      const animRate = Math.max(0.04, 0.16 - (Math.abs(this.vel.x) / this.maxRunSpeed) * 0.1);
      this.animTimer += dt;
      if (this.animTimer > animRate) {
        this.runFrame = (this.runFrame + 1) % 3;
        this.animTimer = 0;
      }
    } else {
      this.animState = 'idle';
      this.runFrame = 0;
    }
  }

  render(ctx) {
    const x = Math.floor(this.pos.x);
    const y = Math.floor(this.pos.y);

    ctx.save();

    // قرینه‌سازی در صورت نگاه به چپ
    if (!this.facingRight) {
      ctx.translate(x + 16, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    this.drawProceduralMario(ctx);
    ctx.restore();
  }

  /**
   * رندر مستقیم ماریوی کلاسیک پیکسلی ۱۶×۱۶ با استایل NES
   */
  drawProceduralMario(ctx) {
    const RED = '#b81c00';
    const BROWN = '#8c5800';
    const SKIN = '#fc9838';

    // کلاه و لباس
    ctx.fillStyle = RED;
    ctx.fillRect(3, 0, 8, 2);
    ctx.fillRect(2, 2, 11, 2);

    // سر و صورت
    ctx.fillStyle = SKIN;
    ctx.fillRect(3, 4, 7, 3);
    ctx.fillRect(9, 4, 3, 2);

    // مو و سیبیل
    ctx.fillStyle = BROWN;
    ctx.fillRect(2, 4, 2, 4);
    ctx.fillRect(4, 5, 1, 2);
    ctx.fillRect(8, 6, 4, 2);

    // چشم
    ctx.fillStyle = '#000000';
    ctx.fillRect(7, 4, 1, 2);

    // پیراهن قرمز و سرشانه‌ها
    ctx.fillStyle = RED;
    ctx.fillRect(3, 7, 6, 4);
    ctx.fillRect(1, 8, 2, 3);
    ctx.fillRect(9, 8, 2, 3);

    // دست‌ها
    ctx.fillStyle = SKIN;
    ctx.fillRect(0, 9, 2, 2);
    ctx.fillRect(10, 9, 2, 2);

    // شلوار و اورال قهوه‌ای NES
    ctx.fillStyle = BROWN;
    ctx.fillRect(3, 10, 6, 2);

    // انیمیشن پاها بر اساس وضعیت حرکت
    if (this.animState === 'jump') {
      ctx.fillRect(1, 12, 4, 2);
      ctx.fillRect(7, 11, 4, 3);
      ctx.fillRect(0, 13, 3, 2);
      ctx.fillRect(8, 13, 4, 2);
    } else if (this.animState === 'skid') {
      ctx.fillRect(0, 12, 4, 3);
      ctx.fillRect(8, 12, 4, 3);
    } else if (this.animState === 'run') {
      if (this.runFrame === 0) {
        ctx.fillRect(2, 12, 3, 3);
        ctx.fillRect(7, 12, 3, 2);
        ctx.fillRect(1, 14, 4, 2);
        ctx.fillRect(7, 13, 4, 2);
      } else if (this.runFrame === 1) {
        ctx.fillRect(4, 12, 4, 2);
        ctx.fillRect(3, 14, 5, 2);
      } else {
        ctx.fillRect(1, 12, 3, 2);
        ctx.fillRect(6, 12, 4, 3);
        ctx.fillRect(0, 13, 4, 2);
        ctx.fillRect(6, 14, 4, 2);
      }
    } else {
      // حالت ایستاده (Idle)
      ctx.fillRect(2, 12, 3, 2);
      ctx.fillRect(7, 12, 3, 2);
      ctx.fillRect(1, 14, 4, 2);
      ctx.fillRect(7, 14, 4, 2);
    }
  }
}