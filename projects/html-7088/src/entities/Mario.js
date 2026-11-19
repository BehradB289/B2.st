/**
 * Player Entity (Mario)
 * Studio: B2.st
 * Full physics, state machine, skidding, variable jump height, and cached sprite rendering.
 */

import { Entity } from './Entity.js';
import { GameConfig } from '../../config/game.config.js';
import { globalSpriteCache } from '../core/performance_cache.js';
import { globalAudio } from '../engine/AudioEngine.js';

export const MarioState = {
    IDLE: 'idle',
    WALK: 'walk',
    RUN: 'run',
    SKID: 'skid',
    JUMP: 'jump',
    FALL: 'fall',
    DEAD: 'dead'
};

export class Mario extends Entity {
    constructor(x, y) {
        super(x, y, GameConfig.player.hitbox.small.width, GameConfig.player.hitbox.small.height);
        this.tag = 'player';
        this.state = MarioState.IDLE;
        
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        
        this.invincibleTimer = 0;
        this.deathTimer = 0;
        this.isDead = false;
    }

    /**
     * Update physics, state transitions and inputs
     */
    update(dt, input) {
        if (this.isDead) {
            this.deathTimer += dt;
            this.vel.y += this.gravity * 0.7 * dt;
            this.pos.y += this.vel.y * dt;
            return;
        }

        super.update(dt);

        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
        }

        const runMultiplier = input.keys.run ? 1.45 : 1.0;
        const targetSpeed = GameConfig.player.walkSpeed * runMultiplier;
        const accel = (this.isGrounded ? 480 : 280) * dt;

        // --- HORIZONTAL INPUT HANDLING ---
        if (input.keys.left) {
            this.facing = -1;
            if (this.vel.x > 0) {
                this.vel.x -= accel * 2.2; // Quick skid braking
                this.state = MarioState.SKID;
            } else {
                this.vel.x = Math.max(-targetSpeed, this.vel.x - accel);
                this.state = input.keys.run ? MarioState.RUN : MarioState.WALK;
            }
        } else if (input.keys.right) {
            this.facing = 1;
            if (this.vel.x < 0) {
                this.vel.x += accel * 2.2;
                this.state = MarioState.SKID;
            } else {
                this.vel.x = Math.min(targetSpeed, this.vel.x + accel);
                this.state = input.keys.run ? MarioState.RUN : MarioState.WALK;
            }
        } else {
            // Natural ground or air friction damping
            const friction = this.isGrounded ? GameConfig.physics.friction : GameConfig.physics.airFriction;
            this.vel.x *= Math.pow(friction, dt * 60);
            if (Math.abs(this.vel.x) < 2) this.vel.x = 0;
            if (this.isGrounded) this.state = MarioState.IDLE;
        }

        // --- JUMP ACTION & VARIABLE HEIGHT ---
        if (input.isJumpTriggered() && this.isGrounded) {
            this.vel.y = -GameConfig.player.jumpForce;
            this.isGrounded = false;
            this.state = MarioState.JUMP;
            globalAudio.playJump();
        }

        // Variable Jump: If user releases jump early, scale down gravity for low hop
        if (!this.isGrounded) {
            if (this.vel.y < 0 && !input.isJumpHeld()) {
                this.vel.y += this.gravity * 1.5 * dt;
            }
            this.state = this.vel.y < 0 ? MarioState.JUMP : MarioState.FALL;
        }

        // Pit death check
        if (this.pos.y > 260 && !this.isDead) {
            this.die();
        }
    }

    onGroundLand() {
        this.isGrounded = true;
    }

    onCeilingHit(tile) {
        globalAudio.playBump();
        if (tile.type === 3) { // QUESTION Block
            tile.type = 4; // Turn into empty question block
            this.coins++;
            this.score += 200;
            globalAudio.playCoin();
        }
    }

    onEntityCollision(other, side) {
        if (this.isDead || !other.isAlive) return;

        if (other.tag === 'enemy') {
            if (side === 'top' && this.vel.y > 0) {
                // Stomp enemy
                this.vel.y = -GameConfig.player.bounceForce;
                this.score += 200;
                other.squish();
                globalAudio.playStomp();
            } else if (this.invincibleTimer <= 0) {
                this.die();
            }
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.isAlive = false;
        this.vel.set(0, -320); // Classic death upward bounce
        globalAudio.playDie();
    }

    /**
     * Render Mario using In-Memory Bitmap Sprite Cache
     */
    render(ctx, camera) {
        if (this.invincibleTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
            return; // Invulnerability blinking
        }

        const screenX = Math.floor(this.pos.x - camera.x);
        const screenY = Math.floor(this.pos.y - camera.y);

        // Frame selection
        let frame = 0;
        if (this.state === MarioState.WALK || this.state === MarioState.RUN) {
            frame = Math.floor(this.animTimer * 12) % 3;
        } else if (this.state === MarioState.JUMP || this.state === MarioState.FALL) {
            frame = 4;
        } else if (this.state === MarioState.SKID) {
            frame = 5;
        } else if (this.isDead) {
            frame = 6;
        }

        const cacheKey = `mario_sprite_${frame}_f${this.facing}`;
        const sprite = globalSpriteCache.getOrRenderCanvas(cacheKey, 16, 16, (sCtx) => {
            this._drawMarioProcedural(sCtx, frame, this.facing);
        });

        ctx.drawImage(sprite, screenX - 2, screenY);
    }

    /**
     * Procedural Pixel Art Generator for Mario
     * @private
     */
    _drawMarioProcedural(ctx, frame, facing) {
        ctx.save();
        if (facing === -1) {
            ctx.translate(16, 0);
            ctx.scale(-1, 1);
        }

        const red = '#d82800';
        const brown = '#8c6000';
        const skin = '#fc9838';

        // Cap & Shirt (Red)
        ctx.fillStyle = red;
        ctx.fillRect(5, 1, 6, 2);
        ctx.fillRect(4, 2, 8, 2);
        ctx.fillRect(4, 7, 7, 4);

        // Face & Ear (Skin)
        ctx.fillStyle = skin;
        ctx.fillRect(4, 4, 7, 3);
        ctx.fillRect(3, 5, 2, 2);

        // Mustache & Hair (Brown)
        ctx.fillStyle = brown;
        ctx.fillRect(3, 3, 2, 2);
        ctx.fillRect(8, 5, 4, 2);

        // Overalls (Brown/Blue NES Palette)
        ctx.fillStyle = brown;
        ctx.fillRect(5, 9, 5, 4);

        // Running leg animation
        if (frame === 1) {
            ctx.fillRect(2, 13, 4, 3);
            ctx.fillRect(9, 13, 4, 3);
        } else if (frame === 2) {
            ctx.fillRect(4, 13, 4, 3);
            ctx.fillRect(11, 12, 3, 3);
        } else {
            ctx.fillRect(3, 13, 4, 3);
            ctx.fillRect(8, 13, 4, 3);
        }

        ctx.restore();
    }
}