/**
 * Lightweight ECS Base Entity
 * Studio: B2.st
 */

import { Vector2D } from '../engine/Vector2D.js';
import { AABB } from '../engine/AABB.js';

export class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16, type = 'generic') {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.width = width;
    this.height = height;
    this.type = type;

    // ECS Flags and State Components
    this.isAlive = true;
    this.isGrounded = false;
    this.isSolid = true;
    this.facing = 1; // 1: Right, -1: Left
    this.markedForRemoval = false;
  }

  get x() {
    return this.position.x;
  }

  set x(val) {
    this.position.x = val;
  }

  get y() {
    return this.position.y;
  }

  set y(val) {
    this.position.y = val;
  }

  get vx() {
    return this.velocity.x;
  }

  set vx(val) {
    this.velocity.x = val;
  }

  get vy() {
    return this.velocity.y;
  }

  set vy(val) {
    this.velocity.y = val;
  }

  getBounds() {
    return new AABB(this.position.x, this.position.y, this.width, this.height);
  }

  update(dt) {
    // Overridden by specific entities
  }

  render(ctx, camera) {
    // Overridden by specific entities
  }
}