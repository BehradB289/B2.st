/**
 * Mario Player Entity
 * Handles acceleration, jumps, states (Small/Super), animation and interactions.
 * Layer: Entities & Components
 * Studio: B2.st
 */

import { Entity } from './entity.js';
import { CONFIG } from '../../config/game_config.js';

export class Mario extends Entity {
  constructor(x, y, spriteGen, soundEngine) {
    super(x, y, 14, 16);
    this.spriteGen = spriteGen;
    this.sound = soundEngine;

    this.facing = 'right';
    this.isSuper = false;
    this.invulnerableTime = 0;
    this.animTimer = 0;
    this.runFrame = 'run1';

    this.isDying = false;
    this.deathTimer = 0;
    this.score = 0;
    this.coins = 0;
  }

  grow() {
    if (!this.isSuper) {
      this.isSuper = true;
      this.height = 30;
      this.position.y -= 14;
      this.sound.playPowerup();
      this.invulnerableTime = 1.0;
    }
  }

  shrink() {
    if (this.invulnerableTime > 0) return;

    if (this.isSuper) {
      this.isSuper = false;
      this.height = 16;
      this.invulnerableTime = 2.0;
      this.sound.playStomp();
    } else {
      this.die();
    }
  }

  die() {
    if (this.isDying) return;
    this.isDying = true;
    this.hasGravity = false;
    this.velocity.set(0, -320);
    this.sound.playDeath();
  }

  jump() {
    if (this.onGround && !this.isDying) {
      this.velocity.y = -CONFIG.PHYSICS.JUMP_FORCE;
      this.onGround = false;
      this.sound.playJump();
    }
  }

  bounce() {
    this.velocity.y = -CONFIG.PHYSICS.BOUNCE_FORCE;
    this.onGround = false;
  }

  onCeilingHit(tileX, tileY, tile) {
    if (tile.type === 'question' && !tile.triggered) {
      tile.triggered = true;
      tile.type = 'empty_block';
      if (tile.contents === 'mushroom') {
        this.tileMap.spawnMushroom(tileX, tileY - 1);
      } else {
        this.coins++;
        this.score += 200;
        this.sound.playCoin();
      }
    } else if (tile.type === 'brick') {
      if (this.isSuper) {
        this.tileMap.destroyTile(tileX, tileY);
        this.sound.playStomp();
        this.score += 50;
      } else {
        this.sound.playStomp();
      }
    }
  }

  updateControls(input, deltaTime) {
    if (this.isDying) return;

    const maxSpeed = input.keys.run ? CONFIG.PHYSICS.MAX_RUN_SPEED : CONFIG.PHYSICS.MAX_WALK_SPEED;
    const accel = input.keys.run ? CONFIG.PHYSICS.RUN_ACCEL : CONFIG.PHYSICS.WALK_ACCEL;

    if (input.keys.right) {
      this.facing = 'right';
      if (this.velocity.x < maxSpeed) {
        this.velocity.x += accel * deltaTime;
      }
    } else if (input.keys.left) {
      this.facing = 'left';
      if (this.velocity.x > -maxSpeed) {
        this.velocity.x -= accel * deltaTime;
      }
    } else {
      // Natural Friction
      if (this.velocity.x > 0) {
        this.velocity.x = Math.max(0, this.velocity.x - CONFIG.PHYSICS.DECELERATION * deltaTime);
      } else if (this.velocity.x < 0) {
        this.velocity.x = Math.min(0, this.velocity.x + CONFIG.PHYSICS.DECELERATION * deltaTime);
      }
    }

    if (input.consumeJump()) {
      this.jump();
    }
  }

  update(deltaTime) {
    if (this.isDying) {
      this.deathTimer += deltaTime;
      // Death jump animation after brief delay
      if (this.deathTimer > 0.4) {
        this.position.y += this.velocity.y * deltaTime;
        this.velocity.y += CONFIG.PHYSICS.GRAVITY * deltaTime;
      }
      return;
    }

    if (this.invulnerableTime > 0) {
      this.invulnerableTime -= deltaTime;
    }

    // Animation cycle
    if (Math.abs(this.velocity.x) > 10 && this.onGround) {
      this.animTimer += deltaTime * (Math.abs(this.velocity.x) / 10);
      this.runFrame = Math.floor(this.animTimer) % 2 === 0 ? 'run1' : 'stand';
    } else {
      this.runFrame = 'stand';
    }

    // Fall in abyss check
    if (this.position.y > CONFIG.CANVAS.HEIGHT + 40) {
      this.die();
    }
  }

  render(ctx, camera) {
    const renderX = Math.round(this.position.x - camera.x);
    const renderY = Math.round(this.position.y - camera.y);

    // Flicker when invulnerable
    if (this.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
    }

    let frame = this.runFrame;
    if (!this.onGround && !this.isDying) {
      frame = 'jump';
    }

    const sprite = this.spriteGen.getMarioSprite(frame, this.isSuper);

    ctx.save();
    if (this.facing === 'left') {
      ctx.translate(renderX + this.width, renderY);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, -2, 0);
    } else {
      ctx.drawImage(sprite, renderX - 1, renderY);
    }
    ctx.restore();
  }
}