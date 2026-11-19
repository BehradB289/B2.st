/**
 * Mario Player Entity with Cached Procedural Sprite Rendering
 * Studio: B2.st
 */
import { Entity } from './entity.js';
import { GAME_CONFIG } from '../../config/game_config.js';

export class Mario extends Entity {
    constructor(x, y, performanceCache) {
        super(x, y, 14, 16);
        this.cache = performanceCache;

        // States
        this.isSmall = true;
        this.state = 'idle'; // idle, running, jumping, skidding, dead
        this.runFrame = 0;
        this.animTimer = 0;
        this.invulnerableTimer = 0;
        this.deathTimer = 0;
    }

    update(dt, input, audio) {
        if (this.isDead) {
            this.deathTimer += dt;
            this.vy += GAME_CONFIG.PHYSICS.GRAVITY * dt * 0.7;
            this.y += this.vy * dt;
            return;
        }

        // Horizontal Movement Logic
        const accel = input.keys.sprint ? GAME_CONFIG.MARIO.RUN_ACCEL : GAME_CONFIG.MARIO.WALK_ACCEL;
        const maxSpeed = input.keys.sprint ? GAME_CONFIG.MARIO.MAX_RUN_SPEED : GAME_CONFIG.MARIO.MAX_WALK_SPEED;

        if (input.keys.left) {
            this.vx -= accel * dt;
            this.facing = -1;
        } else if (input.keys.right) {
            this.vx += accel * dt;
            this.facing = 1;
        }

        // Clamp speed
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;

        // Jump Execution
        if (input.justPressed.jump && this.onGround) {
            this.vy = GAME_CONFIG.MARIO.JUMP_IMPULSE;
            this.onGround = false;
            if (audio) audio.playJump();
        }

        // Variable Jump Height (releasing button early cancels vertical velocity)
        if (!input.keys.jump && this.vy < -100) {
            this.vy *= 0.88;
        }

        // Determine Animation State
        if (!this.onGround) {
            this.state = 'jumping';
        } else if (Math.abs(this.vx) > 5) {
            // Skidding check
            if ((this.vx > 0 && input.keys.left) || (this.vx < 0 && input.keys.right)) {
                this.state = 'skidding';
            } else {
                this.state = 'running';
                this.animTimer += dt * (Math.abs(this.vx) / 15);
                this.runFrame = Math.floor(this.animTimer) % 3;
            }
        } else {
            this.state = 'idle';
            this.animTimer = 0;
        }
    }

    bounce() {
        this.vy = GAME_CONFIG.MARIO.BOUNCE_IMPULSE;
        this.onGround = false;
    }

    kill(reason = 'hit') {
        if (this.isDead) return;
        super.kill(reason);
        this.isDynamic = false;
        this.vy = -280;
        this.state = 'dead';
    }

    /**
     * High-speed sprite rasterizer utilizing PerformanceCache
     */
    _getRasterizedSprite(state, facing, frame) {
        const cacheKey = `mario_${state}_${facing}_${frame}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Render Mario onto Offscreen Buffer
        const buffer = document.createElement('canvas');
        buffer.width = 16;
        buffer.height = 16;
        const bCtx = buffer.getContext('2d');

        bCtx.save();
        if (facing === -1) {
            bCtx.translate(16, 0);
            bCtx.scale(-1, 1);
        }

        const RED = '#d82800';
        const BROWN = '#8c5000';
        const SKIN = '#fc9838';

        if (state === 'dead') {
            bCtx.fillStyle = RED;
            bCtx.fillRect(3, 4, 10, 8);
            bCtx.fillStyle = SKIN;
            bCtx.fillRect(4, 2, 8, 4);
        } else if (state === 'jumping') {
            // Hat & Hair
            bCtx.fillStyle = RED;
            bCtx.fillRect(4, 1, 8, 3);
            bCtx.fillRect(3, 3, 3, 3);
            // Face
            bCtx.fillStyle = SKIN;
            bCtx.fillRect(6, 3, 6, 4);
            // Overalls
            bCtx.fillStyle = RED;
            bCtx.fillRect(2, 7, 10, 5);
            bCtx.fillStyle = BROWN;
            bCtx.fillRect(4, 9, 6, 4);
            bCtx.fillRect(1, 10, 4, 5);
            bCtx.fillRect(11, 7, 4, 5);
        } else {
            // Idle / Run frames
            bCtx.fillStyle = RED;
            bCtx.fillRect(5, 1, 7, 3); // Hat
            bCtx.fillStyle = SKIN;
            bCtx.fillRect(5, 4, 7, 4); // Face
            bCtx.fillStyle = BROWN;
            bCtx.fillRect(3, 4, 2, 3); // Hair

            // Overalls
            bCtx.fillStyle = RED;
            bCtx.fillRect(4, 8, 8, 4);
            bCtx.fillStyle = BROWN;

            if (state === 'running' && frame === 1) {
                bCtx.fillRect(2, 12, 5, 4);
                bCtx.fillRect(9, 11, 5, 5);
            } else if (state === 'running' && frame === 2) {
                bCtx.fillRect(1, 11, 5, 5);
                bCtx.fillRect(10, 12, 5, 4);
            } else {
                bCtx.fillRect(3, 12, 4, 4);
                bCtx.fillRect(9, 12, 4, 4);
            }
        }
        bCtx.restore();

        // Cache for 60 seconds
        this.cache.set(cacheKey, buffer, GAME_CONFIG.CACHE.SPRITE_CACHE_TTL_MS);
        return buffer;
    }

    render(ctx, camera) {
        const renderX = Math.round(this.x - camera.x);
        const renderY = Math.round(this.y - camera.y);

        const sprite = this._getRasterizedSprite(this.state, this.facing, this.runFrame);
        ctx.drawImage(sprite, renderX - 1, renderY);
    }
}