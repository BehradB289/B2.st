import { Entity } from './Entity.js';

/**
 * Goomba Patrol Enemy Entity
 */
export class Goomba extends Entity {
  constructor(x = 120, y = 100) {
    super(x, y, 16, 16, 'GOOMBA');

    this.walkSpeed = 40;
    this.vel.x = -this.walkSpeed; // walks left by default
    this.state = 'ALIVE'; // 'ALIVE' | 'SQUASHED' | 'DEAD'
    this.squashTimer = 0;
  }

  onWallHit(side) {
    if (side === 'LEFT') {
      this.vel.x = this.walkSpeed;
    } else if (side === 'RIGHT') {
      this.vel.x = -this.walkSpeed;
    }
  }

  squash() {
    this.state = 'SQUASHED';
    this.vel.set(0, 0);
    this.hasGravity = false;
    this.isStatic = true;
    this.squashTimer = 0.5; // Stays squashed for 0.5s before disappearing
  }

  update(dt) {
    if (this.state === 'SQUASHED') {
      this.squashTimer -= dt;
      if (this.squashTimer <= 0) {
        this.state = 'DEAD';
        this.active = false;
      }
    }
  }
}