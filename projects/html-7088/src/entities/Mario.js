/**
 * @file Mario.js
 * @description کاراکتر اصلی (Mario) با سیستم کنترل، اینرسی، پرش و کالیشن محیطی
 */

import { Sanitizer } from '../security/Sanitizer.js';

export class Mario {
    /**
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = Sanitizer.sanitizeNumber(x, 50);
        this.y = Sanitizer.sanitizeNumber(y, 250);
        this.width = 26;
        this.height = 32;

        this.vx = 0;
        this.vy = 0;
        this.speed = 220;
        this.jumpForce = -460;
        this.isOnGround = false;
        this.facing = 1; // 1: راست, -1: چپ
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
    }

    /**
     * @param {number} dt 
     * @param {import('../engine/InputHandler.js').InputHandler} input 
     * @param {import('../world/Level.js').Level} level 
     */
    update(dt, input, level) {
        // ۱. پردازش ورودی‌های چپ و راست
        let moveDir = 0;
        if (input.isPressed('ArrowRight', 'KeyD')) {
            moveDir += 1;
            this.facing = 1;
        }
        if (input.isPressed('ArrowLeft', 'KeyA')) {
            moveDir -= 1;
            this.facing = -1;
        }

        this.vx = moveDir * this.speed;

        // ۲. پرش
        if (this.isOnGround && input.isPressed('Space', 'ArrowUp', 'KeyW')) {
            this.vy = this.jumpForce;
            this.isOnGround = false;
        }

        // ۳. اعمال گرانش
        this.vy += level.gravity * dt;

        // کلمپ برای جلوگیری از سقوط با سرعت فراتر از بافر فریم
        this.vy = Math.min(this.vy, 650);

        // ۴. فیزیک و برخورد در راستای X
        this.x += this.vx * dt;
        this._resolveHorizontalCollisions(level);

        // ۵. فیزیک و برخورد در راستای Y
        this.y += this.vy * dt;
        this.isOnGround = false;
        this._resolveVerticalCollisions(level);

        // ۶. حفظ در محدوده چپ مپ
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }

        // پردازش وضعیت شکست‌ناپذیری بعد از ضربه
        if (this.isInvulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
    }

    _resolveHorizontalCollisions(level) {
        const sideOffset = 2;
        const top = this.y + 4;
        const bottom = this.y + this.height - 4;

        if (this.vx > 0) {
            const checkX = this.x + this.width;
            if (level.getTileAt(checkX, top) !== 0 || level.getTileAt(checkX, bottom) !== 0) {
                const col = Math.floor(checkX / level.tileSize);
                this.x = (col * level.tileSize) - this.width - 0.01;
                this.vx = 0;
            }
        } else if (this.vx < 0) {
            const checkX = this.x;
            if (level.getTileAt(checkX, top) !== 0 || level.getTileAt(checkX, bottom) !== 0) {
                const col = Math.floor(checkX / level.tileSize);
                this.x = ((col + 1) * level.tileSize) + 0.01;
                this.vx = 0;
            }
        }
    }

    _resolveVerticalCollisions(level) {
        const left = this.x + 4;
        const right = this.x + this.width - 4;

        if (this.vy > 0) {
            const footY = this.y + this.height;
            if (level.getTileAt(left, footY) !== 0 || level.getTileAt(right, footY) !== 0) {
                const row = Math.floor(footY / level.tileSize);
                this.y = (row * level.tileSize) - this.height;
                this.vy = 0;
                this.isOnGround = true;
            }
        } else if (this.vy < 0) {
            const headY = this.y;
            if (level.getTileAt(left, headY) !== 0 || level.getTileAt(right, headY) !== 0) {
                const row = Math.floor(headY / level.tileSize);
                this.y = ((row + 1) * level.tileSize) + 0.01;
                this.vy = 0;
            }
        }
    }

    takeHit() {
        if (this.isInvulnerable) return false;
        this.isInvulnerable = true;
        this.invulnerableTimer = 1.5;
        this.vy = -250;
        return true;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} cameraX 
     */
    render(ctx, cameraX) {
        if (this.isInvulnerable && Math.floor(Date.now() / 60) % 2 === 0) {
            // افکت چشمک‌زن هنگام صدمه
            return;
        }

        const drawX = Math.floor(this.x - cameraX);
        const drawY = Math.floor(this.y);

        // کلاه و پیراهن قرمز
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(drawX + 4, drawY, this.width - 8, 8); // کلاه
        ctx.fillRect(drawX + 6, drawY + 8, this.width - 12, 12); // سر و صورت

        // لباس کار آبی
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(drawX + 4, drawY + 16, this.width - 8, 10);

        // کفش‌های قهوه‌ای
        ctx.fillStyle = '#78350f';
        ctx.fillRect(drawX + 2, drawY + 26, 8, 6);
        ctx.fillRect(drawX + this.width - 10, drawY + 26, 8, 6);
    }
}