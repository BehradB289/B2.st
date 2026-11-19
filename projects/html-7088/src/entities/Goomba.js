/**
 * Classic Goomba Enemy Entity
 * Studio: B2.st
 */

import { Entity } from './Entity.js';
import { globalSpriteCache } from '../core/performance_cache.js';

export class Goomba extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.tag = 'enemy';
        this.vel.x = -35; // Default patrol velocity to the left
        this.squished = false;
        this.squishTimer = 0;
    }

    update(dt) {
        if (this.squished) {
            this.squishTimer += dt;
            if (this.squishTimer > 0.45) {
                this.isAlive = false;
            }
            return;
        }

        super.update(dt);
    }

    onWallCollide(direction) {
        if (direction === 'left') {
            this.vel.x = Math.abs(this.vel.x);
        } else if (direction === 'right') {
            this.vel.x = -Math.abs(this.vel.x);
        }
    }

    squish() {
        this.squished = true;
        this.hasGravity = false;
        this.vel.set(0, 0);
        this.size.y = 8;
        this.pos.y += 8;
    }

    render(ctx, camera) {
        if (!camera.isInView(this.pos.x, this.pos.y, this.size.x, this.size.y)) return;

        const screenX = Math.floor(this.pos.x - camera.x);
        const screenY = Math.floor(this.pos.y - camera.y);

        const frame = this.squished ? 'squished' : (Math.floor(this.animTimer * 5) % 2);
        const cacheKey = `goomba_sprite_${frame}`;

        const sprite = globalSpriteCache.getOrRenderCanvas(cacheKey, 16, 16, (sCtx) => {
            this._drawGoombaProcedural(sCtx, frame);
        });

        ctx.drawImage(sprite, screenX, screenY);
    }

    _drawGoombaProcedural(ctx, frame) {
        const brown = '#a84400';
        const black = '#000000';
        const foot = '#d8a038';

        if (frame === 'squished') {
            ctx.fillStyle = brown;
            ctx.fillRect(1, 8, 14, 8);
            ctx.fillStyle = black;
            ctx.fillRect(4, 10, 2, 2);
            ctx.fillRect(10, 10, 2, 2);
            return;
        }

        // Mushroom head
        ctx.fillStyle = brown;
        ctx.fillRect(3, 1, 10, 2);
        ctx.fillRect(1, 3, 14, 7);

        // Eyes
        ctx.fillStyle = foot;
        ctx.fillRect(4, 5, 3, 4);
        ctx.fillRect(9, 5, 3, 4);
        ctx.fillStyle = black;
        ctx.fillRect(5, 6, 2, 3);
        ctx.fillRect(9, 6, 2, 3);

        // Animated feet
        ctx.fillStyle = black;
        if (frame === 0) {
            ctx.fillRect(1, 12, 5, 4);
            ctx.fillRect(10, 13, 5, 3);
        } else {
            ctx.fillRect(2, 13, 5, 3);
            ctx.fillRect(10, 12, 5, 4);
        }
    }
}