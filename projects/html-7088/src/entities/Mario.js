import { Entity } from './Entity.js';

'use strict';

export class Mario extends Entity {
    constructor(x, y) {
        super(x, y, 28, 38);
        this.moveSpeed = 220;
        this.runSpeed = 340;
        this.jumpForce = 520;
        this.gravity = 1450;
        this.facingRight = true;
        this.isJumping = false;
        this.isDead = false;
        this.deathTimer = 0;
    }

    update(dt, input, level, audio) {
        if (this.isDead) {
            this.deathTimer += dt;
            this.vy += this.gravity * 0.8 * dt;
            this.y += this.vy * dt;
            return;
        }

        const speed = input.keys.run ? this.runSpeed : this.moveSpeed;

        // شتاب و حرکت افقی
        if (input.keys.left) {
            this.vx = -speed;
            this.facingRight = false;
        } else if (input.keys.right) {
            this.vx = speed;
            this.facingRight = true;
        } else {
            this.vx = 0;
        }

        // پرش
        if (input.keys.jump && this.isGrounded && !this.isJumping) {
            this.vy = -this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
            if (audio) audio.playJump();
        }

        // قطع پرش در صورت رها کردن دکمه برای کنترل ارتفاع
        if (!input.keys.jump && this.vy < -200) {
            this.vy = -200;
        }

        // اعمال گرانش
        this.vy += this.gravity * dt;
        if (this.vy > 900) this.vy = 900; // محدودیت سرعت سقوط (Terminal Velocity)

        // جابجایی افقی و بررسی برخورد با تایل‌ها
        this.x += this.vx * dt;
        level.resolveHorizontalCollisions(this);

        // جابجایی عمودی و بررسی برخورد با تایل‌ها
        this.y += this.vy * dt;
        this.isGrounded = false;
        level.resolveVerticalCollisions(this, audio);

        if (this.isGrounded) {
            this.isJumping = false;
        }

        // سقوط در دره‌ها (Fall out of bounds)
        if (this.y > 550 && !this.isDead) {
            this.die(audio);
        }
    }

    die(audio) {
        if (this.isDead) return;
        this.isDead = true;
        this.vx = 0;
        this.vy = -450;
        if (audio) audio.playGameOver();
    }

    render(ctx, cameraX) {
        const renderX = Math.round(this.x - cameraX);
        const renderY = Math.round(this.y);

        ctx.save();
        ctx.translate(renderX, renderY);

        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-this.width, 0);
        }

        // رندر برداری پیکسلی ماریو (بدون وابستگی به ایمیج خارجی جهت پایداری ۱۰۰٪)
        // کلاه و پیراهن (قرمز)
        ctx.fillStyle = this.isDead ? '#64748b' : '#ef4444';
        ctx.fillRect(4, 0, 20, 8); // کلاه
        ctx.fillRect(6, 12, 16, 12); // تنه

        // چهره (کرم / پوست)
        ctx.fillStyle = '#fde047';
        ctx.fillRect(8, 6, 14, 8);

        // سبیل و مو (قهوه‌ای)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(16, 8, 6, 4);

        // شلوار سرهمی (آبی)
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(6, 22, 16, 10);
        ctx.fillRect(4, 18, 4, 8);
        ctx.fillRect(20, 18, 4, 8);

        // کفش‌ها (قهوه‌ای تیره)
        ctx.fillStyle = '#451a03';
        ctx.fillRect(4, 32, 8, 6);
        ctx.fillRect(16, 32, 8, 6);

        ctx.restore();
    }
}