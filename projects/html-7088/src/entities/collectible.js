/**
 * Collectible Coin & Shatter Particles
 * Studio: B2.st
 */
import { Entity } from './entity.js';

export class CollectibleCoin extends Entity {
    constructor(x, y, performanceCache) {
        super(x, y, 12, 16);
        this.cache = performanceCache;
        this.isDynamic = false;
        this.timer = 0;
        this.frame = 0;
    }

    update(dt) {
        this.timer += dt * 6;
        this.frame = Math.floor(this.timer) % 4;
    }

    render(ctx, camera) {
        if (!camera.isVisible(this.x, this.y, this.width, this.height)) return;

        const renderX = Math.round(this.x - camera.x);
        const renderY = Math.round(this.y - camera.y);

        ctx.save();
        ctx.fillStyle = '#fcb42c';
        const widths = [10, 6, 2, 6];
        const w = widths[this.frame];
        const offsetX = (12 - w) / 2;
        ctx.fillRect(renderX + offsetX, renderY + 2, w, 12);
        ctx.fillStyle = '#fcfcfc';
        ctx.fillRect(renderX + offsetX + 1, renderY + 4, Math.max(1, w - 2), 2);
        ctx.restore();
    }
}

export class Particle extends Entity {
    constructor(x, y, vx, vy, color = '#d82800') {
        super(x, y, 4, 4);
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 0.6;
        this.age = 0;
    }

    update(dt) {
        this.age += dt;
        if (this.age >= this.life) {
            this.markedForRemoval = true;
        }
        this.vy += 600 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    render(ctx, camera) {
        const renderX = Math.round(this.x - camera.x);
        const renderY = Math.round(this.y - camera.y);

        ctx.fillStyle = this.color;
        ctx.fillRect(renderX, renderY, this.width, this.height);
    }
}