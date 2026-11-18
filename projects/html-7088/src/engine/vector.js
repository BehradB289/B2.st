/**
 * 2D Vector Mathematics
 * Layer: Central Engine
 * Studio: B2.st
 */

export class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  subtract(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  clone() {
    return new Vector2D(this.x, this.y);
  }

  reset() {
    this.x = 0;
    this.y = 0;
    return this;
  }
}