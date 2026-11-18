import { Entity } from './Entity.js';

/**
 * Classic Goomba Enemy Entity with Patrol & Stomp mechanics
 */
export class Goomba extends Entity {
  constructor(x, y) {
    super(x, y, 16, 16, 'enemy');
    this.velocity.x = -35;
    this.isSquashed = false;
    this.squashTimer = 0.4;
    this.animTimer = 0;
    this.animFrame = 0;
  }

  update(dt, soundEngine) {
    super.update(dt);

    if (this.isSquashed) {
      this.squashTimer -= dt;
      if (this.squashTimer <= 0) {
        this.markedForRemoval = true;
      }
      return;
    }

    this.animTimer += dt * 6;
    this.animFrame = Math.floor(this.animTimer) % 2;
  }

  onWallCollision(dir) {
    this.velocity.x = -dir * 35;
  }

  stomp(soundEngine) {
    this.isSquashed = true;
    this.velocity.set(0, 0);
    this.size.y = 8;
    this.position.y += 8;
    soundEngine?.playStomp();
  }

  render(ctx, camera) {
    const s = camera.worldToScreen(this.position.x, this.position.y);
    if (s.x < -20 || s.x > camera.width + 20) return;

    if (this.isSquashed) {
      // Flattened Goomba
      ctx.fillStyle = '#a84400';
      ctx.fillRect(s.x, s.y + 4, 16, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(s.x + 2, s.y + 5, 4, 1);
      ctx.fillRect(s.x + 10, s.y + 5, 4, 1);
      return;
    }

    // Goomba Body (Brown Mushroom dome)
    ctx.fillStyle = '#a84400';
    ctx.fillRect(s.x + 2, s.y, 12, 10);
    ctx.fillRect(s.x + 4, s.y - 2, 8, 2);

    // Stem / Face
    ctx.fillStyle = '#fce4a6';
    ctx.fillRect(s.x + 4, s.y + 10, 8, 3);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(s.x + 3, s.y + 4, 3, 5);
    ctx.fillRect(s.x + 10, s.y + 4, 3, 5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(s.x + 4, s.y + 5, 2, 3);
    ctx.fillRect(s.x + 10, s.y + 5, 2, 3);

    // Feet
    ctx.fillStyle = '#000000';
    if (this.animFrame === 0) {
      ctx.fillRect(s.x, s.y + 13, 6, 3);
      ctx.fillRect(s.x + 9, s.y + 14, 6, 2);
    } else {
      ctx.fillRect(s.x + 1, s.y + 14, 6, 2);
      ctx.fillRect(s.x + 10, s.y + 13, 6, 3);
    }
  }
}