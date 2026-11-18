/**
 * @file Entity.js
 * @description Base Entity class in the lightweight ECS/OOP hybrid model.
 */
import { Vector2D } from '../engine/Vector2D.js';

export class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocity = new Vector2D(0, 0);
    this.acceleration = new Vector2D(0, 0);
    this.isGrounded = false;
    this.isAlive = true;
    this.type = 'generic';
  }

  update(dt, physics) {
    if (!this.isAlive) return;

    // Apply gravity
    this.velocity.y += physics.gravity * dt;
    if (this.velocity.y > physics.terminalVelocityY) {
      this.velocity.y = physics.terminalVelocityY;
    }

    // Integrate positions
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
  }

  render(ctx, camera) {
    // Abstract hook
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}