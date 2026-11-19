import { Entity } from './Entity.js';
import { SpriteRenderer } from './SpriteRenderer.js';
import { GameConfig } from '../../config/game.config.js';

export class SuperMushroomItem extends Entity {
  constructor(x, y) {
    super(x, y, 16, 16);
    this.velocity.x = 45;
    this.isSpawning = true;
    this.spawnTargetY = y - 16;
  }

  update(dt, physics) {
    super.update(dt);

    if (this.isSpawning) {
      this.position.y -= 30 * dt;
      if (this.position.y <= this.spawnTargetY) {
        this.position.y = this.spawnTargetY;
        this.isSpawning = false;
      }
      return;
    }

    physics.updateEntity(this, dt);
  }

  onWallHit(side) {
    this.velocity.x = side === 'right' ? -45 : 45;
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.position.x, this.position.y);
    SpriteRenderer.drawSuperMushroom(ctx, screen.x, screen.y);
  }
}

export class BouncingCoinParticle extends Entity {
  constructor(x, y) {
    super(x, y, 16, 16);
    this.velocity.y = -220;
    this.gravity = 980;
    this.startY = y;
  }

  update(dt) {
    super.update(dt);
    this.velocity.y += this.gravity * dt;
    this.position.y += this.velocity.y * dt;

    if (this.velocity.y > 0 && this.position.y >= this.startY) {
      this.shouldRemove = true;
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.position.x, this.position.y);
    SpriteRenderer.drawCoin(ctx, screen.x, screen.y, this.animTimer);
  }
}

export class BrickDebrisParticle extends Entity {
  constructor(x, y, vx, vy) {
    super(x, y, 8, 8);
    this.velocity.set(vx, vy);
    this.life = 0.8;
  }

  update(dt) {
    this.velocity.y += 980 * dt;
    this.position.addScaled(this.velocity, dt);
    this.life -= dt;
    if (this.life <= 0) {
      this.shouldRemove = true;
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.position.x, this.position.y);
    ctx.fillStyle = GameConfig.PALETTE.BRICK_BROWN;
    ctx.fillRect(screen.x, screen.y, 8, 8);
  }
}

export class FloatingText extends Entity {
  constructor(x, y, text) {
    super(x, y, 0, 0);
    this.text = text;
    this.life = 0.6;
  }

  update(dt) {
    this.position.y -= 25 * dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.shouldRemove = true;
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.position.x, this.position.y);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(this.text, screen.x, screen.y);
  }
}