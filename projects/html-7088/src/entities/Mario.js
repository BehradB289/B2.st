/**
 * B2.st Studio - Mario Game Engine
 * Mario Player Character Entity with Serialization & DB Hydration
 * @module src/entities/Mario
 */

import { Vector2D } from '../engine/Vector2D.js';

export class Mario {
  constructor(x = 40, y = 180) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(0, 0);
    this.width = 16;
    this.height = 16;
    this.powerState = 'SMALL'; // 'SMALL', 'SUPER', 'FIRE', 'INVINCIBLE'
    this.isGrounded = false;
    this.isFacingRight = true;
    this.lives = 3;
    this.coins = 0;
    this.score = 0;
    this.speed = 140;
    this.jumpForce = -360;
  }

  jump() {
    if (this.isGrounded) {
      this.vel.y = this.jumpForce;
      this.isGrounded = false;
    }
  }

  update(deltaTime, input) {
    this.vel.x = 0;
    if (input.left) {
      this.vel.x = -this.speed;
      this.isFacingRight = false;
    }
    if (input.right) {
      this.vel.x = this.speed;
      this.isFacingRight = true;
    }
    if (input.jump) {
      this.jump();
    }

    this.pos.x += this.vel.x * deltaTime;
    this.pos.y += this.vel.y * deltaTime;

    // Fall below ground check
    if (this.pos.y > 260) {
      this.die();
    }
  }

  die() {
    this.lives = Math.max(0, this.lives - 1);
    this.pos.set(40, 180);
    this.vel.set(0, 0);
  }

  /**
   * Serializes Mario state for persistent Database storage.
   */
  serialize() {
    return {
      x: Math.round(this.pos.x),
      y: Math.round(this.pos.y),
      velX: Math.round(this.vel.x),
      velY: Math.round(this.vel.y),
      powerState: this.powerState,
      lives: this.lives,
      coins: this.coins,
      score: this.score,
      isFacingRight: this.isFacingRight
    };
  }

  /**
   * Hydrates Mario entity directly from verified Database record.
   * @param {Object} data 
   */
  hydrate(data) {
    if (!data) return;
    this.pos.set(data.mario.x, data.mario.y);
    this.vel.set(data.mario.velX || 0, data.mario.velY || 0);
    this.powerState = data.mario.powerState || 'SMALL';
    this.isFacingRight = data.mario.isFacingRight ?? true;
    this.lives = data.lives;
    this.coins = data.coins;
    this.score = data.score;
  }
}