/**
 * @file Goomba.js
 * @description دشمن پایه بازی (Goomba) با پاترولینگ خودکار و فیزیک AABB
 */

import { Sanitizer } from '../security/Sanitizer.js';

export class Goomba {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = Sanitizer.sanitizeNumber(x, 200);
        this.y = Sanitizer.sanitizeNumber(y, 100);
        this.width = 28;
        this.height = 28;
        this.vx = -40;
        this.vy = 0;
        this.isDead = false;
        this.deadTimer = 0;
    }

    /**
     * @param {number} dt 
     * @param {import('../world/Level.js').Level} level 
     */
    update(dt, level) {
        if (this.isDead) {
            this.deadTimer += dt;
            return;
        }

        // اعمال گرانش
        this.vy += level.gravity * dt;
        this.y += this.vy * dt;

        // برخورد عمودی با سطح زمین
        const footY = this.y + this.height;
        const leftTile = level.getTileAt(this.x + 2, footY);
        const rightTile = level.getTileAt(this.x + this.width - 2, footY);

        if (leftTile !== 0 || rightTile !== 0) {
            const row = Math.floor(footY / level.tileSize);
            this.y = (row * level.tileSize) - this.height;
            this.vy = 0;
        }

        // حرکت افقی و بازگشت در برخورد با مانع
        this.x += this.vx * dt;
        const wallCheckX = this.vx > 0 ? this.x + this.width : this.x;
        const wallTile = level.getTileAt(wallCheckX, this.y + (this.height / 2));

        if (wallTile !== 0) {
            this.vx = -this.vx;
        }
    }

    stomp() {
        this.isDead = true;
        this.vx = 0;
        this.vy = 0;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} cameraX 
     */
    render(ctx, cameraX) {
        if (this.deadTimer > 0.4) return;

        const drawX = Math.floor(this.x - cameraX);
        const drawY = Math.floor(this.y);

        if (this.isDead) {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(drawX, drawY + 14, this.width, 14);
            return;
        }

        // بدنه قارچ
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, this.width, this.height - 6, 6);
        ctx.fill();

        // پاهای گومبا
        ctx.fillStyle = '#000000';
        ctx.fillRect(drawX + 2, drawY + this.height - 6, 8, 6);
        ctx.fillRect(drawX + this.width - 10, drawY + this.height - 6, 8, 6);

        // چشم‌ها
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(drawX + 6, drawY + 6, 4, 8);
        ctx.fillRect(drawX + 18, drawY + 6, 4, 8);
    }
}