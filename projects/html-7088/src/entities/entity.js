/**
 * ECS Base Entity
 * Layer: Entities & Components
 * Studio: B2.st
 */

import { Vector2D } from '../engine/vector.js';

export class Entity {
  constructor(x, y, width, height) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.width = width;
    this.height = height;

    this.hasGravity = true;
    this.onGround = false;
    this.isDead = false;
    this.markedForRemoval = false;
  }

  get x() {
    return this.position.x;
  }
  get y() {
    return this.position.y;
  }

  getBounds() {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height
    };
  }

  onWallCollide(direction) {
    // Override in subclass
  }

  onCeilingHit(tileX, tileY, tile) {
    // Override in subclass
  }

  update(deltaTime) {
    // Override in subclass
  }

  render(ctx, camera) {
    // Override in subclass
  }
}