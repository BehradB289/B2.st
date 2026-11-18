import { Entity } from './Entity.js';

export class Goomba extends Entity {
  constructor(x = 0, y = 0) {
    super(x, y, 16, 16);
    this.type = 'goomba';
    this.vel.x = -40; // Patrolling left by default
    this.squashTimer = 0;
  }

  squash() {
    this.isAlive = false;
    this.type = 'goomba_squashed';
    this.height = 8;
    this.pos.y += 8;
    this.vel.set(0, 0);
    this.isDynamic = false;
    this.squashTimer = 0.5; // remains visible for half a second
  }

  onWallCollision() {
    this.vel.x = -this.vel.x;
  }

  update(dt) {
    if (this.squashTimer > 0) {
      this.squashTimer -= dt;
    }
  }
}