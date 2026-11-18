import { Entity } from './Entity.js';
import { GAME_CONFIG } from '../../config/game.config.js';

/**
 * Super Mario Character Entity
 */
export class Mario extends Entity {
  constructor(x, y) {
    super(x, y, 14, 16, 'mario');
    this.facing = 1; // 1: Right, -1: Left
    this.state = 'SMALL'; // SMALL | SUPER | DEAD
    this.invulnerableTimer = 0;
    this.jumpTimer = 0;
    this.isJumping = false;
    this.walkAnimTimer = 0;
    this.walkFrame = 0;
  }

  update(dt, input, soundEngine) {
    super.update(dt);

    if (this.state === 'DEAD') {
      this.position.y += this.velocity.y * dt;
      this.velocity.y += 600 * dt;
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    const { WALK_SPEED, RUN_SPEED, ACCELERATION, FRICTION, JUMP_FORCE, JUMP_HOLD_GRAVITY_MOD } =
      GAME_CONFIG.PHYSICS;

    const maxSpeed = input.state.run ? RUN_SPEED : WALK_SPEED;

    // Horizontal Movement
    if (input.state.left) {
      this.facing = -1;
      if (this.velocity.x > 0) {
        this.velocity.x -= FRICTION * 1.5 * dt; // Turn-around skidding
      } else {
        this.velocity.x = Math.max(-maxSpeed, this.velocity.x - ACCELERATION * dt);
      }
    } else if (input.state.right) {
      this.facing = 1;
      if (this.velocity.x < 0) {
        this.velocity.x += FRICTION * 1.5 * dt; // Turn-around skidding
      } else {
        this.velocity.x = Math.min(maxSpeed, this.velocity.x + ACCELERATION * dt);
      }
    } else {
      // Natural Deceleration / Friction
      if (this.velocity.x > 0) {
        this.velocity.x = Math.max(0, this.velocity.x - FRICTION * dt);
      } else if (this.velocity.x < 0) {
        this.velocity.x = Math.min(0, this.velocity.x + FRICTION * dt);
      }
    }

    // Animation cycle
    if (this.isGrounded && Math.abs(this.velocity.x) > 10) {
      this.walkAnimTimer += dt * (Math.abs(this.velocity.x) / 30);
      this.walkFrame = Math.floor(this.walkAnimTimer) % 3;
    } else {
      this.walkFrame = 0;
    }

    // Jump Logic with Variable Height Impulse
    if (input.justPressed.jump && this.isGrounded) {
      this.velocity.y = JUMP_FORCE;
      this.isGrounded = false;
      this.isJumping = true;
      soundEngine?.playJump();
    }

    // Variable Jump Cutoff
    if (!input.state.jump && this.velocity.y < 0) {
      this.velocity.y += GAME_CONFIG.PHYSICS.GRAVITY * JUMP_HOLD_GRAVITY_MOD * dt;
    }
  }

  kill(soundEngine) {
    if (this.state === 'DEAD') return;
    this.state = 'DEAD';
    this.velocity.set(0, -320);
    soundEngine?.playDeath();
  }

  render(ctx, camera) {
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return; // Flicker effect when invincible
    }

    const screenPos = camera.worldToScreen(this.position.x, this.position.y);
    const w = this.size.x;
    const h = this.size.y;

    ctx.save();
    ctx.translate(screenPos.x + w / 2, screenPos.y + h / 2);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Pixel Art Procedural Canvas Drawing: Classic Red/Blue 8-bit Mario
    ctx.fillStyle = '#b81c00'; // Mario Red cap and shirt
    ctx.fillRect(-w / 2 + 3, -h / 2, 8, 4); // Cap
    ctx.fillRect(-w / 2 + 1, -h / 2 + 4, 11, 2); // Cap brim

    ctx.fillStyle = '#fce4a6'; // Face peach
    ctx.fillRect(-w / 2 + 2, -h / 2 + 4, 8, 4);
    ctx.fillStyle = '#5c4800'; // Hair & mustache
    ctx.fillRect(-w / 2 + 1, -h / 2 + 4, 3, 2);
    ctx.fillRect(-w / 2 + 5, -h / 2 + 6, 4, 2);

    // Overalls (Blue)
    ctx.fillStyle = '#0020d0';
    ctx.fillRect(-w / 2 + 2, -h / 2 + 8, 10, 5);

    // Red Sleeves
    ctx.fillStyle = '#b81c00';
    ctx.fillRect(-w / 2 + (this.walkFrame === 1 ? 0 : 1), -h / 2 + 8, 2, 4);
    ctx.fillRect(-w / 2 + 11, -h / 2 + 8, 2, 4);

    // Shoes (Brown)
    ctx.fillStyle = '#5c4800';
    if (!this.isGrounded) {
      // Jumping pose
      ctx.fillRect(-w / 2 - 1, -h / 2 + 13, 6, 3);
      ctx.fillRect(-w / 2 + 8, -h / 2 + 11, 6, 3);
    } else {
      ctx.fillRect(-w / 2 + (this.walkFrame * 2), -h / 2 + 13, 5, 3);
      ctx.fillRect(-w / 2 + 7 - (this.walkFrame * 1.5), -h / 2 + 13, 5, 3);
    }

    ctx.restore();
  }
}