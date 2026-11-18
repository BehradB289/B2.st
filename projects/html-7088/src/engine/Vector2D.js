/**
 * 2D Vector representation for positions, velocities, and accelerations.
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

  clone() {
    return new Vector2D(this.x, this.y);
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  static add(a, b) {
    return new Vector2D(a.x + b.x, a.y + b.y);
  }

  static sub(a, b) {
    return new Vector2D(a.x - b.x, a.y - b.y);
  }

  static scale(v, s) {
    return new Vector2D(v.x * s, v.y * s);
  }
}