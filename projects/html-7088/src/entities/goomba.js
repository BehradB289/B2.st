/**
 * Goomba Patrol Enemy
 * Walks horizontally, turns around on wall hit, squashes when jumped upon.
 * Layer: Entities & Components
 * Studio: B2.st
 */

import { Entity } from './entity.js';

export class Goomba extends Entity {
  constructor(x, y, spriteGen) {
    super(x, y, 16, 16);
    this.spriteGen = spriteGen;
    this.velocity.x = -40; // Walks left by default
    this.squashed = false;
    this.squashTimer = 0;
    this.animTimer = 0;
  }

  onWallCollide(direction) {
    if (direction === 'left') {
      this.velocity.x = 40;
    } else if (direction === 'right') {
      this.velocity.x = -40;
    }
  }

  squash() {
    this.squashed = true;
    this.isDead = true;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.hasGravity = false;
  }

  update(deltaTime) {
    if (this.squashed) {
      this.squashTimer += deltaTime;
      if (this.squashTimer > 0.6) {
        this.markedForRemoval = true;
      }
      return;
    }

    this.animTimer += deltaTime * 5;
  }

  render(ctx, camera) {
    const renderX = Math.round(this.position.x - camera.x);
    const renderY = Math.round(this.position.y - camera.y);

    const frame = Math.floor(this.animTimer) % 2;
    const sprite = this.spriteGen.getGoombaSprite(frame, this.squashed);

    ctx.drawImage(sprite, renderX, renderY);
  }
}