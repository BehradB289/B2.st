/**
 * استودیو B2.st - سیستم دوربین اسکرول متحرک NES
 */
import { Vector2D } from './Vector2D.js';

export class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.pos = new Vector2D(0, 0);
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.deadzoneX = viewportWidth * 0.35; // نقطه فعال‌سازی اسکرول دوربین
        this.worldBounds = { minX: 0, maxX: 3392, minY: 0, maxY: 240 };
    }

    update(target) {
        if (!target) return;
        
        // در سبک کلاسیک NES دوربین فقط به جلو حرکت می‌کند
        const targetScreenX = target.pos.x - this.pos.x;
        if (targetScreenX > this.deadzoneX) {
            this.pos.x = target.pos.x - this.deadzoneX;
        }

        // محدودسازی موقعیت دوربین در مرزهای دنیا
        if (this.pos.x < this.worldBounds.minX) this.pos.x = this.worldBounds.minX;
        if (this.pos.x > this.worldBounds.maxX - this.viewportWidth) {
            this.pos.x = this.worldBounds.maxX - this.viewportWidth;
        }
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.floor(this.pos.x), -Math.floor(this.pos.y));
    }

    restore(ctx) {
        ctx.restore();
    }
}