import { Vector2 } from '../engine/Vector2.js';
import { AABB } from '../engine/AABB.js';

/**
 * Base Game Entity (ECS lightweight component/entity hybrid)
 */
export class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16, tag = 'ENTITY') {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.size = new Vector2(width, height);
    this.accelX = 0;
    this.tag = tag;

    this.isStatic = false;
    this.hasGravity = true;
    this.isGrounded = false;
    this.active = true;
  }

  getBounds() {
    return new AABB(this.pos.x, this.pos.y, this.size.x, this.size.y);
  }

  update(dt) {
    // Override in derived classes
  }

  onWallHit(side) {
    // Override in derived classes
  }

  onHeadBump(tile) {
    // Override in derived classes
  }
}