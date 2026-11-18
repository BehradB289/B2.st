import { Entity } from './Entity.js';

'use strict';

export class Goomba extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.speed = 50;
        this.vx = -this.speed;
        this.vy = 0;
        this.gravity = 1400;
        this.isSquished = false;
        this.squishTimer = 0;
        this.toRemove = false;
    }

    squish(audio) {
        this.isSquished = true;
        this.isAlive = false;
        this.vx = 0;
        this.vy = 0;
        this.height = 12;
        this.y += 18;
        if (audio) audio.playStomp();
    }

    update(dt, level, cameraX) {
        if (this.toRemove) return;

        if (this.isSquished) {
            this.squishTimer += dt;
            if (this.squishTimer > 0.4) {
                this.toRemove = true;
            }
            return;
        }

        // فعال‌سازی هوش مصنوعی تنها زمانی که دشمن وارد صفحه شود
        if (this.x > cameraX + 850) {
            return;
        }

        this.vy += this.gravity * dt;
        if (this.vy > 800) this.vy = 800;

        // حرکت افقی و وارونگی در صورت برخورد به موانع
        this.x += this.vx * dt;
        const collidedH = level.checkHorizontalWall(this);
        if (collidedH) {
            this.vx = -this.vx;
        }

        // حرکت عمودی
        this.y += this.vy * dt;
        level.resolveVerticalCollisions(this);

        // سقوط
        if (this.y > 550) {
            this.toRemove = true;
        }
    }

    render(ctx, cameraX) {
        if (this.toRemove) return;

        const renderX = Math.round(this.x - cameraX);
        const renderY = Math.round(this.y);

        ctx.save();
        ctx.translate(renderX, renderY);

        if (this.isSquished) {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(0, 0, 30, 12);
            ctx.fillStyle = '#000';
            ctx.fillRect(6, 4, 18, 4);
        } else {
            // سر گومبا (قارچ قهوه‌ای)
            ctx.fillStyle = '#9a3412';
            ctx.beginPath();
            ctx.ellipse(15, 12, 14, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // بدنه زیرین (کرم)
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(8, 16, 14, 8);

            // چشم‌ها
            ctx.fillStyle = '#fff';
            ctx.fillRect(6, 8, 4, 8);
            ctx.fillRect(20, 8, 4, 8);
            ctx.fillStyle = '#000';
            ctx.fillRect(8, 10, 2, 6);
            ctx.fillRect(20, 10, 2, 6);

            // پاها
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(2, 24, 8, 6);
            ctx.fillRect(20, 24, 8, 6);
        }

        ctx.restore();
    }
}