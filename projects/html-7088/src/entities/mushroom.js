/**
 * Super Mushroom Powerup Entity
 * Pops out of mystery blocks and accelerates rightwards.
 * Layer: Entities & Components
 * Studio: B2.st
 */

import { Entity } from './entity.js';

export class Mushroom extends Entity {
  constructor(x, y, spriteGen) {
    super(x, y, 16, 16);
    this.spriteGen = spriteGen;
    this.velocity.x = 55;
    this.velocity.y = -80; // Pop up initial burst
  }

  onWallCollide(direction) {
    if (direction === 'left') {
      this.velocity.x = 55;
    } else if (direction === 'right') {
      this.velocity.x = -55;
    }
  }

  render(ctx, camera) {
    const renderX = Math.round(this.position.x - camera.x);
    const renderY = Math.round(this.position.y - camera.y);
    const sprite = this.spriteGen.getMushroomSprite();

    ctx.drawImage(sprite, renderX, renderY);
  }
}