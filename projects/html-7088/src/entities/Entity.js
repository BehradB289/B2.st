import { Vector2 } from '../engine/Vector2.js';
import { AABB } from '../engine/AABB.js';

/**
 * Studio B2.st - Base Entity Class
 */
export class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.hitboxOffset = new Vector2(0, 0);
    this.hitboxSize = new Vector2(width, height);
    this.renderSize = new Vector2(width, height);

    this.grounded = false;
    this.alive = true;
    this.shouldRemove = false;
    this.animTimer = 0;
  }

  getHitbox() {
    return new AABB(
      this.position.x + this.hitboxOffset.x,
      this.position.y + this.hitboxOffset.y,
      this.hitboxSize.x,
      this.hitboxSize.y
    );
  }

  update(dt) {
    this.animTimer += dt;
  }

  render(ctx, camera) {
    // Override in derived classes
  }
}