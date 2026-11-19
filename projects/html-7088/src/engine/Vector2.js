/**
 * 2D Vector Math Primitives
 * Optimized for GC efficiency with chainable mutating methods and pure factories.
 */
export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  addScaled(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  magnitude() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const len = this.magnitude();
    if (len > 0.00001) {
      this.scale(1 / len);
    }
    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  equals(v, epsilon = 0.001) {
    return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon;
  }

  static zero() {
    return new Vector2(0, 0);
  }
}