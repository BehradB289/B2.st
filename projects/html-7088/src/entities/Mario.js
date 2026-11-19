import { Entity } from './Entity.js';
import { SpriteRenderer } from './SpriteRenderer.js';
import { GameConfig } from '../../config/game.config.js';
import { Vector2 } from '../engine/Vector2.js';

export const MARIO_STATE = Object.freeze({
  IDLE: 'IDLE',
  WALKING: 'WALKING',
  RUNNING: 'RUNNING',
  JUMPING: 'JUMPING',
  FALLING: 'FALLING',
  DYING: 'DYING',
  FLAGPOLE: 'FLAGPOLE',
  VICTORY: 'VICTORY'
});

/**
 * Studio B2.st - Mario Player Entity
 */
export class Mario extends Entity {
  constructor(x, y) {
    super(x, y, GameConfig.MARIO.SMALL_BOUNDS.w, GameConfig.MARIO.SMALL_BOUNDS.h);
    this.hitboxOffset.set(GameConfig.MARIO.SMALL_BOUNDS.x, GameConfig.MARIO.SMALL_BOUNDS.y);

    this.isSuper = false;
    this.isFacingLeft = false;
    this.state = MARIO_STATE.IDLE;
    this.lives = 3;
    this.score = 0;
    this.coins = 0;

    this.jumpTimer = 0;
    this.invulnerableTimer = 0;
    this.dyingTimer = 0;
  }

  growSuper() {
    if (!this.isSuper) {
      this.isSuper = true;
      this.position.y -= 16;
      this.hitboxSize.set(GameConfig.MARIO.SUPER_BOUNDS.w, GameConfig.MARIO.SUPER_BOUNDS.h);
      this.hitboxOffset.set(GameConfig.MARIO.SUPER_BOUNDS.x, GameConfig.MARIO.SUPER_BOUNDS.y);
    }
  }

  shrinkSmall() {
    if (this.isSuper) {
      this.isSuper = false;
      this.hitboxSize.set(GameConfig.MARIO.SMALL_BOUNDS.w, GameConfig.MARIO.SMALL_BOUNDS.h);
      this.hitboxOffset.set(GameConfig.MARIO.SMALL_BOUNDS.x, GameConfig.MARIO.SMALL_BOUNDS.y);
      this.invulnerableTimer = GameConfig.MARIO.INVULNERABLE_DURATION;
    }
  }

  kill(audio) {
    if (this.state === MARIO_STATE.DYING) return;
    this.state = MARIO_STATE.DYING;
    this.velocity.set(0, -310);
    this.dyingTimer = 0;
    this.lives--;
    audio?.playDie();
  }

  handleInput(input, dt, audio) {
    if (this.state === MARIO_STATE.DYING || this.state === MARIO_STATE.FLAGPOLE || this.state === MARIO_STATE.VICTORY) {
      return;
    }

    const accel = input.isRun ? GameConfig.MARIO.RUN_ACCEL : GameConfig.MARIO.WALK_ACCEL;
    const maxSpeed = input.isRun ? GameConfig.MARIO.MAX_RUN_SPEED : GameConfig.MARIO.MAX_WALK_SPEED;

    // Left / Right Movement
    if (input.isLeft) {
      this.velocity.x -= accel * dt;
      this.isFacingLeft = true;
    } else if (input.isRight) {
      this.velocity.x += accel * dt;
      this.isFacingLeft = false;
    } else {
      // Apply ground or air friction
      const friction = this.grounded ? GameConfig.MARIO.FRICTION : GameConfig.MARIO.AIR_FRICTION;
      this.velocity.x *= Math.pow(friction, dt * 60);
      if (Math.abs(this.velocity.x) < 2) {
        this.velocity.x = 0;
      }
    }

    // Clamp speed
    if (this.velocity.x > maxSpeed) this.velocity.x = maxSpeed;
    if (this.velocity.x < -maxSpeed) this.velocity.x = -maxSpeed;

    // Jump logic
    if (input.isJumpJustPressed && this.grounded) {
      this.velocity.y = GameConfig.MARIO.JUMP_IMPULSE;
      this.grounded = false;
      this.jumpTimer = GameConfig.MARIO.MAX_JUMP_HOLD_TIME;
      audio?.playJump();
    } else if (input.isJump && this.jumpTimer > 0) {
      this.velocity.y += GameConfig.MARIO.JUMP_SUSTAIN_ACCEL * dt;
      this.jumpTimer -= dt;
    } else {
      this.jumpTimer = 0;
    }
  }

  update(dt, physics, camera) {
    super.update(dt);

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    if (this.state === MARIO_STATE.DYING) {
      this.dyingTimer += dt;
      this.velocity.y += 980 * dt;
      this.position.y += this.velocity.y * dt;
      return;
    }

    if (this.state === MARIO_STATE.FLAGPOLE) {
      this.velocity.set(0, 80);
      this.position.y += this.velocity.y * dt;
      if (this.position.y >= 12 * 16) {
        this.position.y = 12 * 16;
        this.state = MARIO_STATE.VICTORY;
      }
      return;
    }

    if (this.state === MARIO_STATE.VICTORY) {
      this.velocity.x = 40;
      this.position.x += this.velocity.x * dt;
      return;
    }

    physics.updateEntity(this, dt, (tx, ty, tileId) => {
      // Trigger ceiling hit (brick or question block)
      this.onHitCeilingBlock?.(tx, ty, tileId);
    });

    // Clamp Mario to left screen boundary (camera cannot scroll back)
    if (this.position.x < camera.x) {
      this.position.x = camera.x;
      this.velocity.x = 0;
    }

    // Fall into bottom pit death
    if (this.position.y > GameConfig.CANVAS.INTERNAL_HEIGHT + 24) {
      this.kill(null);
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.position.x, this.position.y);
    SpriteRenderer.drawMario(ctx, screen.x, screen.y, this);
  }
}