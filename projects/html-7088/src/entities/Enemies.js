import { Entity } from './Entity.js';
import { SpriteRenderer } from './SpriteRenderer.js';
import { GameConfig } from '../../config/game.config.js';

export class Goomba extends Entity {
  constructor(x, y) {
    super(x, y, 14, 14);
    this.hitboxOffset.set(1, 2);
    this.velocity.x = -GameConfig.ENEMIES.GOOMBA_SPEED;
    this.isSquished = false;
    this.squishTimer = 0;
  }

  update(dt, physics) {
    super.update(dt);

    if (this.isSquished) {
      this.squishTimer += dt;
      if (this.squishTimer > 0.45) {
        this.shouldRemove = true;
      }
      return;
    }

    physics.updateEntity(this, dt);

    if (this.position.y > GameConfig.CANVAS.INTERNAL_HEIGHT + 32) {
      this.shouldRemove = true;
    }
  }

  stomp() {
    this.isSquished = true;
    this.velocity.set(0, 0);
  }

  onWallHit(side) {
    this.velocity.x = side === 'right' ? -GameConfig.ENEMIES.GOOMBA_SPEED : GameConfig.ENEMIES.GOOMBA_SPEED;
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.position.x, this.position.y);
    SpriteRenderer.drawGoomba(ctx, screen.x, screen.y, this);
  }
}

export class Koopa extends Entity {
  constructor(x, y) {
    super(x, y, 14, 22);
    this.hitboxOffset.set(1, 2);
    this.velocity.x = -GameConfig.ENEMIES.KOOPA_SPEED;
    this.isShell = false;
    this.isMovingShell = false;
  }

  update(dt, physics) {
    super.update(dt);

    if (this.isShell && !this.isMovingShell) {
      this.velocity.x = 0;
    }

    physics.updateEntity(this, dt);

    if (this.position.y > GameConfig.CANVAS.INTERNAL_HEIGHT + 32) {
      this.shouldRemove = true;
    }
  }

  stomp() {
    if (!this.isShell) {
      this.isShell = true;
      this.hitboxSize.set(14, 14);
      this.hitboxOffset.set(1, 2);
      this.velocity.set(0, 0);
    }
  }

  kick(direction) {
    this.isMovingShell = true;
    this.velocity.x = direction * GameConfig.ENEMIES.SHELL_SPEED;
  }

  onWallHit(side) {
    const speed = this.isMovingShell ? GameConfig.ENEMIES.SHELL_SPEED : GameConfig.ENEMIES.KOOPA_SPEED;
    this.velocity.x = side === 'right' ? -speed : speed;
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.position.x, this.position.y);
    SpriteRenderer.drawKoopa(ctx, screen.x, screen.y, this);
  }
}