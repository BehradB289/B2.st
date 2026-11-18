import { Vector2D } from '../engine/Vector2D.js';

/**
 * Base Entity Component System Object
 */
export class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16, tag = 'entity') {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.size = new Vector2D(width, height);
    this.collisionOffset = new Vector2D(0, 0);
    this.tag = tag;

    this.isGrounded = false;
    this.isDead = false;
    this.markedForRemoval = false;
    this.dt = 1 / 60;
  }

  getBounds() {
    return {
      x: this.position.x + this.collisionOffset.x,
      y: this.position.y + this.collisionOffset.y,
      width: this.size.x,
      height: this.size.y
    };
  }

  update(dt) {
    this.dt = dt;
  }

  render(ctx, camera) {
    // Base render placeholder overridden by subclasses
  }
}