/**
 * Classic Enemies: Goomba & Koopa Troopa (with kickable sliding shell mechanics)
 */

import { Entity } from './Entity.js';
import { Physics } from '../engine/Physics.js';
import { sound } from '../engine/Audio.js';

export class Goomba extends Entity {
  constructor(x, y) {
    super(x, y, 16, 16);
    this.vx = -35;
    this.squished = false;
    this.squishTimer = 0;
  }

  update(dt, level) {
    if (this.squished) {
      this.squishTimer += dt;
      if (this.squishTimer > 0.45) {
        this.isDead = true;
      }
      return;
    }

    super.update(dt, level);
    Physics.resolveEntityVsTilemap(this, level, dt);
  }

  onCollideWall(side) {
    if (side === 'left') this.vx = Math.abs(this.vx);
    if (side === 'right') this.vx = -Math.abs(this.vx);
  }

  stomp() {
    this.squished = true;
    this.vx = 0;
    this.vy = 0;
    sound.playStomp();
  }
}

export class Koopa extends Entity {
  constructor(x, y) {
    super(x, y, 16, 24);
    this.vx = -40;
    this.inShell = false;
    this.shellMoving = false;
  }

  update(dt, level) {
    super.update(dt, level);
    Physics.resolveEntityVsTilemap(this, level, dt);
    this.facing = this.vx >= 0 ? 1 : -1;
  }

  onCollideWall(side) {
    if (side === 'left') {
      this.vx = Math.abs(this.vx);
      if (this.shellMoving) sound.playBrickBump();
    }
    if (side === 'right') {
      this.vx = -Math.abs(this.vx);
      if (this.shellMoving) sound.playBrickBump();
    }
  }

  stomp(mario) {
    if (!this.inShell) {
      this.inShell = true;
      this.height = 16;
      this.y += 8;
      this.vx = 0;
      sound.playStomp();
    } else if (!this.shellMoving) {
      this.shellMoving = true;
      const kickDir = mario.x < this.x + this.width / 2 ? 1 : -1;
      this.vx = kickDir * 260;
      sound.playKick();
    } else {
      this.shellMoving = false;
      this.vx = 0;
      sound.playStomp();
    }
  }

  kick(direction) {
    this.shellMoving = true;
    this.vx = direction * 260;
    sound.playKick();
  }
}