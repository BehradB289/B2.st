/**
 * Studio B2.st - Axis-Aligned Bounding Box (AABB) Collision Primitive
 */
export class AABB {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get left() {
    return this.x;
  }

  get right() {
    return this.x + this.width;
  }

  get top() {
    return this.y;
  }

  get bottom() {
    return this.y + this.height;
  }

  get centerX() {
    return this.x + this.width * 0.5;
  }

  get centerY() {
    return this.y + this.height * 0.5;
  }

  set(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  intersects(other) {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  contains(px, py) {
    return (
      px >= this.left &&
      px <= this.right &&
      py >= this.top &&
      py <= this.bottom
    );
  }

  getOverlap(other) {
    const ox = Math.min(this.right, other.right) - Math.max(this.left, other.left);
    const oy = Math.min(this.bottom, other.bottom) - Math.max(this.top, other.top);
    return {
      x: ox > 0 ? ox : 0,
      y: oy > 0 ? oy : 0
    };
  }
}