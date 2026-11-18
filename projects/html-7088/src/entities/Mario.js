/**
 * @file Mario.js
 * @description Mario player entity with authentic NES physics, states, and procedural pixel art.
 */
import { Entity } from './Entity.js';

export const MarioState = {
  IDLE: 'IDLE',
  WALKING: 'WALKING',
  JUMPING: 'JUMPING',
  DEAD: 'DEAD',
};

export class Mario extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {PerformanceCache} cache
   * @param {RateLimiter} rateLimiter
   */
  constructor(x, y, cache, rateLimiter) {
    super(x, y, 16, 24);
    this.type = 'mario';
    this.cache = cache;
    this.rateLimiter = rateLimiter;

    // Movement speeds & constants
    this.walkSpeed = 160;
    this.runSpeed = 260;
    this.jumpForce = -520;
    this.accelerationRate = 500;
    this.friction = 700;

    this.facing = 1; // 1 = right, -1 = left
    this.state = MarioState.IDLE;
    this.animTimer = 0;
    this.frameIndex = 0;

    this.coins = 0;
    this.score = 0;
  }

  handleInput(input, dt) {
    if (this.state === MarioState.DEAD) return;

    const dir = input.horizontalAxis;
    const maxSpeed = input.isRunning ? this.runSpeed : this.walkSpeed;

    if (dir !== 0) {
      this.facing = dir;
      this.velocity.x += dir * this.accelerationRate * dt;
      if (Math.abs(this.velocity.x) > maxSpeed) {
        this.velocity.x = dir * maxSpeed;
      }
    } else {
      // Natural ground/air deceleration
      if (this.velocity.x > 0) {
        this.velocity.x = Math.max(0, this.velocity.x - this.friction * dt);
      } else if (this.velocity.x < 0) {
        this.velocity.x = Math.min(0, this.velocity.x + this.friction * dt);
      }
    }

    // Jump execution with token-bucket rate limiter to prevent spam
    if (input.isJumping && this.isGrounded) {
      if (this.rateLimiter.tryAcquire(1)) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }
    }
  }

  update(dt, physics) {
    if (this.state === MarioState.DEAD) {
      this.y += this.velocity.y * dt;
      this.velocity.y += physics.gravity * dt;
      return;
    }

    // Super update applies gravity and velocity integration
    super.update(dt, physics);

    // Pit fall death
    if (this.y > 480) {
      this.die();
    }

    // State determination
    if (!this.isGrounded) {
      this.state = MarioState.JUMPING;
    } else if (Math.abs(this.velocity.x) > 10) {
      this.state = MarioState.WALKING;
      this.animTimer += dt * Math.abs(this.velocity.x);
      if (this.animTimer > 25) {
        this.frameIndex = (this.frameIndex + 1) % 3;
        this.animTimer = 0;
      }
    } else {
      this.state = MarioState.IDLE;
      this.frameIndex = 0;
    }
  }

  onHeadBump(tile) {
    if (tile.type === 'question' && !tile.triggered) {
      tile.triggered = true;
      this.coins++;
      this.score += 200;
    } else if (tile.type === 'brick') {
      this.score += 50;
    }
  }

  die() {
    if (this.state === MarioState.DEAD) return;
    this.state = MarioState.DEAD;
    this.velocity.x = 0;
    this.velocity.y = -400;
  }

  /**
   * Procedural NES Mario pixel rendering with Sprite Caching.
   */
  render(ctx, camera) {
    const screenX = Math.round(this.x - camera.position.x);
    const screenY = Math.round(this.y - camera.position.y);

    ctx.save();
    ctx.translate(screenX + (this.facing === -1 ? this.width : 0), screenY);
    ctx.scale(this.facing, 1);

    // Retrieve cached bitmap or render procedurally
    const cacheKey = `mario_${this.state}_${this.frameIndex}_${this.facing}`;
    let sprite = this.cache.get(cacheKey);

    if (!sprite) {
      sprite = document.createElement('canvas');
      sprite.width = 16;
      sprite.height = 24;
      const sctx = sprite.getContext('2d');
      this._drawProceduralMario(sctx);
      this.cache.set(cacheKey, sprite, 120000); // Cache for 2 mins
    }

    ctx.drawImage(sprite, 0, 0);
    ctx.restore();
  }

  _drawProceduralMario(ctx) {
    // NES Authentic Palette: Red (#B81C00), Blue (#0040D8), Skin (#FFA044), Brown (#6B3C00)
    const RED = '#B81C00';
    const BLUE = '#0040D8';
    const SKIN = '#FFA044';
    const BROWN = '#6B3C00';

    ctx.imageSmoothingEnabled = false;

    // Cap
    ctx.fillStyle = RED;
    ctx.fillRect(3, 0, 10, 3);
    ctx.fillRect(5, 3, 10, 2);

    // Face / Ears
    ctx.fillStyle = SKIN;
    ctx.fillRect(3, 3, 3, 5);
    ctx.fillRect(6, 4, 6, 4);

    // Mustache & Hair
    ctx.fillStyle = BROWN;
    ctx.fillRect(2, 4, 2, 4);
    ctx.fillRect(8, 6, 5, 2);

    // Overalls / Shirt
    ctx.fillStyle = RED;
    ctx.fillRect(4, 8, 8, 5);
    ctx.fillStyle = BLUE;
    ctx.fillRect(5, 10, 6, 7);
    ctx.fillRect(4, 13, 8, 4);

    // Legs / Shoes based on state & animation
    ctx.fillStyle = BROWN;
    if (this.state === MarioState.JUMPING) {
      ctx.fillRect(2, 17, 5, 4);
      ctx.fillRect(9, 15, 5, 4);
    } else if (this.frameIndex === 1) {
      ctx.fillRect(1, 18, 5, 5);
      ctx.fillRect(10, 18, 5, 5);
    } else {
      ctx.fillRect(3, 19, 4, 5);
      ctx.fillRect(9, 19, 4, 5);
    }
  }
}