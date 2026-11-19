/**
 * Koopa Troopa Entity (Patrol & Shell Mechanic)
 * Studio: B2.st
 */

import { Entity } from './Entity.js';
import { globalSpriteCache } from '../core/performance_cache.js';
import { globalAudio } from '../engine/AudioEngine.js';

export class Koopa extends Entity {
    constructor(x, y) {
        super(x, y, 16, 24);
        this.tag = 'enemy';
        this.vel.x = -40;
        this.isShell = false;
        this.shellSpeed = 220;
    }

    update(dt) {
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
        if (!this.isShell) {
            this.isShell = true;
            this.size.set(16, 16);
            this.pos.y += 8;
            this.vel.x = 0;
        } else {
            // Kick shell
            this.vel.x = this.vel.x === 0 ? this.shellSpeed : 0;
            globalAudio.playBump();
        }
    }

    render(ctx, camera) {
        if (!camera.isInView(this.pos.x, this.pos.y, this.size.x, this.size.y)) return;

        const screenX = Math.floor(this.pos.x - camera.x);
        const screenY = Math.floor(this.pos.y - camera.y);

        const frame = this.isShell ? 'shell' : (Math.floor(this.animTimer * 5) % 2);
        const cacheKey = `koopa_sprite_${frame}_${this.vel.x > 0 ? 1 : -1}`;

        const sprite = globalSpriteCache.getOrRenderCanvas(cacheKey, 16, 24, (sCtx) => {
            this._drawKoopaProcedural(sCtx, frame, this.vel.x > 0 ? 1 : -1);
        });

        ctx.drawImage(sprite, screenX, screenY);
    }

    _drawKoopaProcedural(ctx, frame, facing) {
        ctx.save();
        if (facing === 1) {
            ctx.translate(16, 0);
            ctx.scale(-1, 1);
        }

        const green = '#00a800';
        const yellow = '#fcb42c';
        const white = '#fcfcfc';

        if (frame === 'shell') {
            ctx.fillStyle = green;
            ctx.fillRect(2, 8, 12, 14);
            ctx.fillStyle = yellow;
            ctx.fillRect(4, 10, 8, 10);
            ctx.restore();
            return;
        }

        // Head
        ctx.fillStyle = yellow;
        ctx.fillRect(1, 2, 7, 6);
        ctx.fillStyle = white;
        ctx.fillRect(2, 3, 3, 3);

        // Shell
        ctx.fillStyle = green;
        ctx.fillRect(4, 8, 11, 12);
        ctx.fillStyle = yellow;
        ctx.fillRect(5, 10, 8, 8);

        // Feet
        ctx.fillStyle = yellow;
        if (frame === 0) {
            ctx.fillRect(3, 20, 5, 4);
            ctx.fillRect(10, 20, 5, 4);
        } else {
            ctx.fillRect(5, 20, 5, 4);
            ctx.fillRect(8, 20, 5, 4);
        }

        ctx.restore();
    }
}