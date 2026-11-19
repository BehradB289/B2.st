/**
 * B2.st Studio - Mario Entity System
 * کنترل کامل رفتارهای فیزیکی، تشخیص برخورد پیشرفته و رفع خطاهای نحوی متغیرها
 */
"use strict";

import { Guardian } from "../security/Guardian.js";

export class Mario {
    constructor(x = 64, y = 300) {
        this.x = Guardian.sanitizeNumber(x, 64);
        this.y = Guardian.sanitizeNumber(y, 300);
        this.width = 24;
        this.height = 30;

        this.vx = 0;
        this.vy = 0;

        // پارامترهای کنترل حرکت و گرانش
        this.speed = 220;
        this.jumpForce = -450;
        this.gravity = 980;

        this.isGrounded = false;
        this.facingLeft = false;
        this.score = 0;
    }

    update(dt, input, level) {
        const safeDt = Guardian.clamp(dt, 0.0, 0.05);

        // 1. محاسبات بردار افقی
        if (input.isLeft()) {
            this.vx = -this.speed;
            this.facingLeft = true;
        } else if (input.isRight()) {
            this.vx = this.speed;
            this.facingLeft = false;
        } else {
            this.vx = 0;
        }

        // 2. جهش
        if (input.isJump() && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
        }

        // اعمال گرانش به بردار عمودی
        this.vy += this.gravity * safeDt;

        // 3. اعمال فیزیک حرکت افقی و مهار برخورد
        this.x += this.vx * safeDt;
        this.x = Guardian.sanitizeNumber(this.x, 0);
        this.checkHorizontalCollisions(level);

        // 4. اعمال فیزیک حرکت عمودی و مهار برخورد
        this.y += this.vy * safeDt;
        this.y = Guardian.sanitizeNumber(this.y, 0);
        this.checkVerticalCollisions(level);

        // 5. بررسی افتادن در گودال و ریست وضعیت
        if (this.y > 600) {
            this.respawn();
        }
    }

    checkHorizontalCollisions(level) {
        const ts = level.tileSize;
        const leftTile = Math.floor(this.x / ts);
        const rightTile = Math.floor((this.x + this.width) / ts);
        const topTile = Math.floor(this.y / ts);
        const bottomTile = Math.floor((this.y + this.height - 1) / ts);

        for (let r = topTile; r <= bottomTile; r++) {
            if (this.vx > 0 && level.isSolid(rightTile, r)) {
                this.x = rightTile * ts - this.width;
                this.vx = 0;
                break;
            } else if (this.vx < 0 && level.isSolid(leftTile, r)) {
                this.x = (leftTile + 1) * ts;
                this.vx = 0;
                break;
            }
        }
    }

    checkVerticalCollisions(level) {
        const ts = level.tileSize;
        const leftTile = Math.floor((this.x + 2) / ts);
        const rightTile = Math.floor((this.x + this.width - 2) / ts);
        const topTile = Math.floor(this.y / ts);
        const bottomTile = Math.floor((this.y + this.height) / ts);

        this.isGrounded = false;

        for (let c = leftTile; c <= rightTile; c++) {
            if (this.vy > 0 && level.isSolid(c, bottomTile)) {
                this.y = bottomTile * ts - this.height;
                this.vy = 0;
                this.isGrounded = true;
                break;
            } else if (this.vy < 0 && level.isSolid(c, topTile)) {
                this.y = (topTile + 1) * ts;
                this.vy = 0;
                break;
            }
        }
    }

    respawn() {
        this.x = 64;
        this.y = 300;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
    }

    render(ctx, cameraX) {
        const drawX = Math.floor(this.x - cameraX);
        const drawY = Math.floor(this.y);

        ctx.save();

        // بدنه اصلی ماریو (کلاه و لباس قرمز، لباس کار آبی)
        ctx.fillStyle = "#FF0000"; // قرمز نمادین ماریو
        ctx.fillRect(drawX, drawY, this.width, this.height * 0.4);

        ctx.fillStyle = "#0000FF"; // آبی لباس
        ctx.fillRect(drawX, drawY + this.height * 0.4, this.width, this.height * 0.6);

        // صورت و چشم‌ها
        ctx.fillStyle = "#FCC082"; // رنگ پوست
        const faceX = this.facingLeft ? drawX : drawX + 8;
        ctx.fillRect(faceX, drawY + 4, 10, 8);

        ctx.restore();
    }
}