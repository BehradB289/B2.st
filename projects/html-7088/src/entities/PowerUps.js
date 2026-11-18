/**
 * Power-Up Items & Projectiles: Super Mushroom, Fire Flower, Starman, and Fireball
 */

import { Entity } from './Entity.js';
import { Physics } from '../engine/Physics.js';

export class PowerUp extends Entity {
  constructor(x, y, type) {
    super(x, y, 16, 16);
    this.type = type; // 'MUSHROOM', 'FIRE_FLOWER', 'STAR'
    this.vx = type === 'FIRE_FLOWER' ? 0 : 50;
    this.emerging = true;
    this.emergeDistance = 0;
  }

  update(dt, level) {
    if (this.emerging) {
      this.y -= 24 * dt;
      this.emergeDistance += 24 * dt;
      if (this.emergeDistance >= 16) {
        this.emerging = false;
      }
      return;
    }

    if (this.type === 'MUSHROOM' || this.type === 'STAR') {
      Physics.resolveEntityVsTilemap(this, level, dt);

      if (this.type === 'STAR' && this.onGround) {
        this.vy = -240; // Bouncing Star
      }
    }
  }

  onCollideWall(side) {
    if (side === 'left') this.vx = Math.abs(this.vx);
    if (side === 'right') this.vx = -Math.abs(this.vx);
  }
}

export class Fireball extends Entity {
  constructor(x, y, direction) {
    super(x, y, 8, 8);
    this.vx = direction * 240;
    this.vy = 80;
    this.life = 2.5;
  }

  update(dt, level) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    Physics.resolveEntityVsTilemap(this, level, dt);

    if (this.onGround) {
      this.vy = -180; // Bouncing fireball
    }
  }

  onCollideWall() {
    this.isDead = true;
  }
}