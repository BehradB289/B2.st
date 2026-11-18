import { Entity } from './Entity.js';

export const MARIO_CONSTANTS = {
  WALK_ACCEL: 380,
  MAX_WALK_SPEED: 140,
  RUN_ACCEL: 520,
  MAX_RUN_SPEED: 210,
  JUMP_IMPULSE: -420,
  STOMP_BOUNCE: -230
};

export class Mario extends Entity {
  constructor(x = 0, y = 0) {
    super(x, y, 16, 16);
    this.type = 'mario';
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.state = 'idle'; // 'idle' | 'running' | 'jumping' | 'falling' | 'dead'
    this.facing = 1; // 1 = right, -1 = left
    this.invulnerableTimer = 0;
  }

  jump() {
    if (this.isGrounded) {
      this.vel.y = MARIO_CONSTANTS.JUMP_IMPULSE;
      this.isGrounded = false;
      this.state = 'jumping';
      return true;
    }
    return false;
  }

  bounce() {
    this.vel.y = MARIO_CONSTANTS.STOMP_BOUNCE;
    this.isGrounded = false;
    this.state = 'jumping';
  }

  moveLeft(dt, running = false) {
    const accel = running ? MARIO_CONSTANTS.RUN_ACCEL : MARIO_CONSTANTS.WALK_ACCEL;
    const maxSpeed = running ? MARIO_CONSTANTS.MAX_RUN_SPEED : MARIO_CONSTANTS.MAX_WALK_SPEED;
    this.vel.x = Math.max(-maxSpeed, this.vel.x - accel * dt);
    this.facing = -1;
  }

  moveRight(dt, running = false) {
    const accel = running ? MARIO_CONSTANTS.RUN_ACCEL : MARIO_CONSTANTS.WALK_ACCEL;
    const maxSpeed = running ? MARIO_CONSTANTS.MAX_RUN_SPEED : MARIO_CONSTANTS.MAX_WALK_SPEED;
    this.vel.x = Math.min(maxSpeed, this.vel.x + accel * dt);
    this.facing = 1;
  }

  addScore(pts) {
    this.score += pts;
  }

  addCoins(amount = 1) {
    this.coins += amount;
    if (this.coins >= 100) {
      this.lives += 1;
      this.coins -= 100;
    }
  }

  takeDamage() {
    if (this.invulnerableTimer > 0) return;
    this.lives -= 1;
    this.invulnerableTimer = 1.5;
    if (this.lives <= 0) {
      this.isAlive = false;
      this.state = 'dead';
    }
  }

  updateState() {
    if (!this.isAlive) {
      this.state = 'dead';
    } else if (!this.isGrounded) {
      this.state = this.vel.y < 0 ? 'jumping' : 'falling';
    } else if (Math.abs(this.vel.x) > 10) {
      this.state = 'running';
    } else {
      this.state = 'idle';
    }
  }
}