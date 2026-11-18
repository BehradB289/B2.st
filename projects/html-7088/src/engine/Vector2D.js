/**
 * 2D Vector Mathematical Representation
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
    return new Vector2D(this.x + vector.x, this.y + vector.y);
  }

  addMutate(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  sub(vector) {
    return new Vector2D(this.x - vector.x, this.y - vector.y);
  }

  multiply(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  multiplyMutate(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  magnitude() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const mag = this.magnitude();
    return mag > 0 ? this.multiply(1 / mag) : new Vector2D(0, 0);
  }

  clone() {
    return new Vector2D(this.x, this.y);
  }

  equals(vector, epsilon = 0.0001) {
    return (
      Math.abs(this.x - vector.x) <= epsilon &&
      Math.abs(this.y - vector.y) <= epsilon
    );
  }
}