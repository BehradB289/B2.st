import { Vector2 } from './Vector2.js';

/**
 * Axis-Aligned Bounding Box (AABB)
 * Geometric unit used for hitboxes, tile collisions, and frustum checks.
 */
export class AABB {
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.pos = new Vector2(x, y);
    this.size = new Vector2(width, height);
  }

  get x() { return this.pos.x; }
  set x(val) { this.pos.x = val; }

  get y() { return this.pos.y; }
  set y(val) { this.pos.y = val; }

  get width() { return this.size.x; }
  set width(val) { this.size.x = val; }

  get height() { return this.size.y; }
  set height(val) { this.size.y = val; }

  get left() { return this.pos.x; }
  get right() { return this.pos.x + this.size.x; }
  get top() { return this.pos.y; }
  get bottom() { return this.pos.y + this.size.y; }
  get centerX() { return this.pos.x + this.size.x * 0.5; }
  get centerY() { return this.pos.y + this.size.y * 0.5; }

  intersects(other) {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  containsPoint(px, py) {
    return (
      px >= this.left &&
      px <= this.right &&
      py >= this.top &&
      py <= this.bottom
    );
  }

  getOverlap(other) {
    if (!this.intersects(other)) return null;

    const dx1 = other.right - this.left;
    const dx2 = this.right - other.left;
    const dy1 = other.bottom - this.top;
    const dy2 = this.bottom - other.top;

    const overlapX = dx1 < dx2 ? -dx1 : dx2;
    const overlapY = dy1 < dy2 ? -dy1 : dy2;

    return {
      x: overlapX,
      y: overlapY,
      absX: Math.abs(overlapX),
      absY: Math.abs(overlapY)
    };
  }

  clone() {
    return new AABB(this.x, this.y, this.width, this.height);
  }
}