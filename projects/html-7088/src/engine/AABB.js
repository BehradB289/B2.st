/**
 * Axis-Aligned Bounding Box (AABB) for 2D Collision Detection
 * Studio: B2.st
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
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  setSize(width, height) {
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

  clone() {
    return new AABB(this.x, this.y, this.width, this.height);
  }
}