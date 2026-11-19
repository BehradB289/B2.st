import { Entity } from './Entity.js';
import { GAME_CONFIG } from '../../config/game.config.js';

/**
 * Mario Player Entity
 * Handles input kinematics, state degradation, stomping and jumping.
 */
export class Mario extends Entity {
  constructor(x = 40, y = 100) {
    super(x, y, 16, 16, 'MARIO');

    this.state = GAME_CONFIG.MARIO_STATE.SMALL;
    this.score = 0;
    this.coins = 0;
    this.lives = 3;

    this.jumpImpulse = GAME_CONFIG.JUMP_IMPULSE;
    this.walkSpeed = GAME_CONFIG.MAX_WALK_SPEED;

    this.invulnerableTimer = 0;
    this.isFacingRight = true;
  }

  setPowerState(state) {
    this.state = state;
    if (state === GAME_CONFIG.MARIO_STATE.SUPER) {
      this.size.y = 32;
    } else {
      this.size.y = 16;
    }
  }

  moveLeft() {
    this.accelX = -1;
    this.vel.x = -this.walkSpeed;
    this.isFacingRight = false;
  }

  moveRight() {
    this.accelX = 1;
    this.vel.x = this.walkSpeed;
    this.isFacingRight = true;
  }

  stopHorizontal() {
    this.accelX = 0;
  }

  jump() {
    if (this.isGrounded) {
      this.vel.y = this.jumpImpulse;
      this.isGrounded = false;
      return true;
    }
    return false;
  }

  bounceAfterStomp() {
    this.vel.y = GAME_CONFIG.BOUNCE_IMPULSE;
    this.score += GAME_CONFIG.SCORES.STOMP_GOOMBA;
  }

  collectCoin() {
    this.coins += 1;
    this.score += GAME_CONFIG.SCORES.COIN;
    if (this.coins >= 100) {
      this.coins = 0;
      this.lives += 1;
    }
  }

  takeDamage() {
    if (this.invulnerableTimer > 0) return false;

    if (this.state === GAME_CONFIG.MARIO_STATE.SUPER) {
      this.setPowerState(GAME_CONFIG.MARIO_STATE.SMALL);
      this.invulnerableTimer = 2.0; // 2 seconds iframes
      return true;
    } else if (this.state === GAME_CONFIG.MARIO_STATE.SMALL) {
      this.state = GAME_CONFIG.MARIO_STATE.DEAD;
      this.vel.set(0, -250);
      this.hasGravity = true;
      this.isStatic = false;
      this.lives = Math.max(0, this.lives - 1);
      return true;
    }
    return false;
  }

  update(dt) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
  }
}