/**
 * Mario Player Entity
 * Studio: B2.st
 */

import { Entity } from './Entity.js';
import { MARIO_CONFIG, SCORES } from '../../config/constants.js';

export class Mario extends Entity {
  constructor(x = 32, y = 160) {
    super(x, y, MARIO_CONFIG.WIDTH, MARIO_CONFIG.HEIGHT, 'mario');
    this.lives = MARIO_CONFIG.INITIAL_LIVES;
    this.score = 0;
    this.coins = 0;
    this.isBig = false;
    this.invulnerableTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(dt, input) {
    if (!this.isAlive) {
      this.invulnerableTimer = 0;
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    if (!input) return;

    const currentSpeed = input.keys.run ? MARIO_CONFIG.RUN_SPEED : MARIO_CONFIG.WALK_SPEED;

    if (input.keys.left && !input.keys.right) {
      this.vx = -currentSpeed;
      this.facing = -1;
    } else if (input.keys.right && !input.keys.left) {
      this.vx = currentSpeed;
      this.facing = 1;
    } else {
      this.vx = 0;
    }

    if (input.keys.jump && this.isGrounded) {
      this.vy = MARIO_CONFIG.JUMP_FORCE;
      this.isGrounded = false;
    }

    // Animation frame progression
    if (this.vx !== 0 && this.isGrounded) {
      this.animTimer += dt;
      if (this.animTimer > 0.08) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 3;
      }
    } else {
      this.animFrame = 0;
    }
  }

  stomp() {
    this.vy = MARIO_CONFIG.BOUNCE_FORCE;
    this.isGrounded = false;
    this.score += SCORES.GOOMBA_STOMP;
  }

  collectCoin() {
    this.coins += 1;
    this.score += SCORES.COIN;
    if (this.coins >= 100) {
      this.lives += 1;
      this.coins -= 100;
    }
  }

  takeDamage() {
    if (this.invulnerableTimer > 0) return false;

    if (this.isBig) {
      this.isBig = false;
      this.height = MARIO_CONFIG.HEIGHT;
      this.invulnerableTimer = MARIO_CONFIG.INVULNERABILITY_TIME;
      return true;
    }

    this.lives -= 1;
    if (this.lives <= 0) {
      this.die();
    } else {
      this.invulnerableTimer = MARIO_CONFIG.INVULNERABILITY_TIME;
    }
    return true;
  }

  die() {
    this.isAlive = false;
    this.vx = 0;
    this.vy = MARIO_CONFIG.BOUNCE_FORCE;
  }

  render(ctx, camera) {
    if (!ctx) return;
    const sx = camera ? camera.worldToScreenX(this.x) : this.x;
    const sy = camera ? camera.worldToScreenY(this.y) : this.y;

    // Flickering during invulnerability
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 15) % 2 === 0) {
      return;
    }

    ctx.save();
    // NES Classic Mario Colors: Red (#B81800), Brown (#887000)
    ctx.fillStyle = '#b81800';
    ctx.fillRect(sx, sy, this.width, this.height);

    // Overalls
    ctx.fillStyle = '#0020a0';
    ctx.fillRect(sx + 2, sy + 6, this.width - 4, this.height - 6);

    // Hat visor indication
    ctx.fillStyle = '#b81800';
    if (this.facing === 1) {
      ctx.fillRect(sx + 8, sy + 2, 4, 3);
    } else {
      ctx.fillRect(sx + 2, sy + 2, 4, 3);
    }
    ctx.restore();
  }
}