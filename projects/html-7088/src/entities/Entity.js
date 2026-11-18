import { Vector2D } from '../engine/Vector2D.js';
import { AABB } from '../engine/AABB.js';

export class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(0, 0);
    this.width = width;
    this.height = height;
    this.isDynamic = true;
    this.isGrounded = false;
    this.isAlive = true;
    this.type = 'entity';
  }

  getAABB() {
    return new AABB(this.pos.x, this.pos.y, this.width, this.height);
  }

  onGroundCollision(tile) {}
  onCeilingCollision(tile) {}
  onWallCollision(tile) {}
}