/**
 * Goomba Enemy Entity
 * Studio: B2.st
 */
import { Entity } from './entity.js';
import { GAME_CONFIG } from '../../config/game_config.js';

export class Goomba extends Entity {
    constructor(x, y, performanceCache) {
        super(x, y, 16, 16);
        this.cache = performanceCache;
        this.vx = -GAME_CONFIG.ENEMY.GOOMBA_SPEED;
        this.isStomped = false;
        this.stompTimer = 0;
        this.animTimer = 0;
        this.frame = 0;
    }

    update(dt) {
        if (this.isStomped) {
            this.stompTimer += dt;
            if (this.stompTimer >= GAME_CONFIG.ENEMY.STOMP_DURATION) {
                this.markedForRemoval = true;
            }
            return;
        }

        if (this.isDead) return;

        // Walking animation
        this.animTimer += dt * 4;
        this.frame = Math.floor(this.animTimer) % 2;
    }

    onCollideSide(side) {
        if (side === 'left') {
            this.vx = GAME_CONFIG.ENEMY.GOOMBA_SPEED;
        } else if (side === 'right') {
            this.vx = -GAME_CONFIG.ENEMY.GOOMBA_SPEED;
        }
    }

    stomp() {
        this.isStomped = true;
        this.isDynamic = false;
        this.vx = 0;
        this.vy = 0;
        this.height = 8;
        this.y += 8;
    }

    _getRasterizedSprite() {
        const cacheKey = `goomba_${this.isStomped ? 'flat' : this.frame}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const buffer = document.createElement('canvas');
        buffer.width = 16;
        buffer.height = 16;
        const bCtx = buffer.getContext('2d');

        const BROWN = '#a84400';
        const BLACK = '#000000';
        const WHITE = '#fcfcfc';

        if (this.isStomped) {
            bCtx.fillStyle = BROWN;
            bCtx.fillRect(1, 10, 14, 6);
            bCtx.fillStyle = BLACK;
            bCtx.fillRect(4, 12, 3, 2);
            bCtx.fillRect(9, 12, 3, 2);
        } else {
            // Head/Body
            bCtx.fillStyle = BROWN;
            bCtx.fillRect(3, 1, 10, 9);
            bCtx.fillRect(1, 5, 14, 6);
            // Eyes
            bCtx.fillStyle = WHITE;
            bCtx.fillRect(3, 6, 3, 4);
            bCtx.fillRect(10, 6, 3, 4);
            bCtx.fillStyle = BLACK;
            bCtx.fillRect(4, 7, 2, 3);
            bCtx.fillRect(10, 7, 2, 3);
            // Feet
            bCtx.fillStyle = BLACK;
            if (this.frame === 0) {
                bCtx.fillRect(1, 13, 6, 3);
                bCtx.fillRect(10, 13, 5, 3);
            } else {
                bCtx.fillRect(2, 13, 5, 3);
                bCtx.fillRect(9, 13, 6, 3);
            }
        }

        this.cache.set(cacheKey, buffer, GAME_CONFIG.CACHE.SPRITE_CACHE_TTL_MS);
        return buffer;
    }

    render(ctx, camera) {
        if (!camera.isVisible(this.x, this.y, this.width, this.height)) return;

        const renderX = Math.round(this.x - camera.x);
        const renderY = Math.round(this.y - camera.y);
        const sprite = this._getRasterizedSprite();

        ctx.drawImage(sprite, renderX, renderY);
    }
}