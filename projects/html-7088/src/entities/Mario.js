/**
 * Master Mario Entity - Complete State Machine, Morphing, Invincibility & Actions
 */

import { Entity } from './Entity.js';
import { CONFIG } from '../../config/game.config.js';
import { Physics } from '../engine/Physics.js';
import { Fireball } from './PowerUps.js';
import { sound } from '../engine/Audio.js';

export class Mario extends Entity {
  constructor(x, y) {
    super(x, y, 16, 16);

    this.powerState = 'SMALL'; // 'SMALL', 'SUPER', 'FIRE'
    this.isCrouching = false;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;

    this.isStarPowered = false;
    this.starTimer = 0;

    this.jumpHoldTimer = 0;
    this.isJumping = false;

    this.fireCooldown = 0;
    this.comboCounter = 0;

    this.wonGame = false;
    this.slidingFlag = false;
  }

  growToSuper() {
    if (this.powerState === 'SMALL') {
      this.powerState = 'SUPER';
      this.height = 32;
      this.y -= 16;
      sound.playPowerUp();
    }
  }

  growToFire() {
    this.growToSuper();
    this.powerState = 'FIRE';
    sound.playPowerUp();
  }

  activateStar() {
    this.isStarPowered = true;
    this.starTimer = CONFIG.MARIO.STAR_POWER_TIME;
    sound.playPowerUp();
  }

  takeDamage() {
    if (this.isInvulnerable || this.isStarPowered) return;

    if (this.powerState === 'FIRE') {
      this.powerState = 'SUPER';
      this._makeInvulnerable();
      sound.playPowerDown();
    } else if (this.powerState === 'SUPER') {
      this.powerState = 'SMALL';
      this.height = 16;
      this.y += 16;
      this._makeInvulnerable();
      sound.playPowerDown();
    } else {
      this.die();
    }
  }

  _makeInvulnerable() {
    this.isInvulnerable = true;
    this.invulnerableTimer = CONFIG.MARIO.INVULNERABLE_TIME;
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.vx = 0;
    this.vy = -340;
    this.customGravity = 700;
    sound.playDie();
  }

  update(dt, input, level, particleSystem, onSpawnFireball) {
    if (this.isDead) {
      this.vy += (this.customGravity || 700) * dt;
      this.y += this.vy * dt;
      return;
    }

    if (this.slidingFlag) {
      this.y += 100 * dt;
      if (this.y >= 13 * CONFIG.TILES.SIZE - this.height) {
        this.y = 13 * CONFIG.TILES.SIZE - this.height;
        this.slidingFlag = false;
        this.wonGame = true;
      }
      return;
    }

    // Timers
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) this.isInvulnerable = false;
    }

    if (this.isStarPowered) {
      this.starTimer -= dt;
      if (this.starTimer <= 0) this.isStarPowered = false;
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    if (this.onGround) this.comboCounter = 0;

    // Crouch handling
    this.isCrouching = this.powerState !== 'SMALL' && input.isDownAction && this.onGround;

    // Horizontal Movement
    const accel = input.isRunOrShoot ? CONFIG.MARIO.RUN_ACCEL : CONFIG.MARIO.WALK_ACCEL;
    const maxSpeed = this.isStarPowered
      ? CONFIG.MARIO.MAX_RUN_SPEED * 1.25
      : input.isRunOrShoot
      ? CONFIG.MARIO.MAX_RUN_SPEED
      : CONFIG.MARIO.MAX_WALK_SPEED;

    if (!this.isCrouching) {
      if (input.isLeft) {
        this.vx -= accel * dt;
        this.facing = -1;
      } else if (input.isRight) {
        this.vx += accel * dt;
        this.facing = 1;
      } else {
        // Apply friction
        this.vx *= this.onGround ? CONFIG.PHYSICS.FRICTION : CONFIG.PHYSICS.AIR_RESISTANCE;
        if (Math.abs(this.vx) < 5) this.vx = 0;
      }
    } else {
      this.vx *= 0.8;
    }

    // Speed clamping
    if (this.vx > maxSpeed) this.vx = maxSpeed;
    if (this.vx < -maxSpeed) this.vx = -maxSpeed;

    // Jump Physics
    if (input.isJumpJustPressed && this.onGround && !this.isCrouching) {
      this.vy = CONFIG.MARIO.JUMP_IMPULSE;
      this.isJumping = true;
      this.jumpHoldTimer = CONFIG.MARIO.HIGH_JUMP_HOLD_TIME;
      sound.playJump(this.powerState !== 'SMALL');
    }

    if (input.isJump && this.isJumping && this.jumpHoldTimer > 0) {
      this.vy -= 400 * dt; // Sustained jump boost
      this.jumpHoldTimer -= dt;
    } else {
      this.isJumping = false;
    }

    // Fireball attack
    if (
      this.powerState === 'FIRE' &&
      input.isShootJustPressed &&
      this.fireCooldown <= 0 &&
      !this.isCrouching
    ) {
      const fbX = this.facing === 1 ? this.x + this.width : this.x - 8;
      const fb = new Fireball(fbX, this.y + 6, this.facing);
      onSpawnFireball(fb);
      this.fireCooldown = 0.22;
      sound.playFireball();
    }

    // Apply standard tilemap physics
    Physics.resolveEntityVsTilemap(this, level, dt);

    // Fall in pit death
    if (this.y > CONFIG.CANVAS.INTERNAL_HEIGHT + 32) {
      this.die();
    }

    // Animation frame progression
    super.update(dt, level);
  }

  bounceOnEnemy() {
    this.vy = CONFIG.MARIO.BOUNCE_IMPULSE;
    this.comboCounter++;
  }

  onCollideCeiling(tx, ty, level) {
    level.bumpBlock(tx, ty, this);
  }
}