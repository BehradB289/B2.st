import { Entity } from './Entity.js';

/**
 * Collectible Spinning Coin Entity
 */
export class Coin extends Entity {
  constructor(x, y, isStatic = true) {
    super(x, y, 10, 14, 'coin');
    this.isStatic = isStatic;
    this.animTimer = Math.random() * 2;
    this.floatTimer = isStatic ? 0 : 0.45;
    if (!isStatic) {
      this.velocity.y = -220;
    }
  }

  update(dt, soundEngine) {
    this.animTimer += dt * 8;

    if (!this.isStatic) {
      this.position.y += this.velocity.y * dt;
      this.velocity.y += 650 * dt;
      this.floatTimer -= dt;
      if (this.floatTimer <= 0) {
        this.markedForRemoval = true;
      }
    }
  }

  collect(soundEngine) {
    this.markedForRemoval = true;
    soundEngine?.playCoin();
  }

  render(ctx, camera) {
    const s = camera.worldToScreen(this.position.x, this.position.y);
    const frame = Math.floor(this.animTimer) % 4;

    let width = 10;
    if (frame === 1 || frame === 3) width = 6;
    if (frame === 2) width = 2;

    const offsetX = (10 - width) / 2;

    ctx.fillStyle = '#fcd800'; // Gold
    ctx.fillRect(s.x + offsetX, s.y, width, 14);

    ctx.fillStyle = '#ffffff'; // Shine
    if (width > 4) {
      ctx.fillRect(s.x + offsetX + 1, s.y + 2, 2, 10);
    }
  }
}