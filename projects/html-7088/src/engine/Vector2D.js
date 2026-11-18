/**
 * کلاس بردار دوبعدی ریاضی جهت موقعیت، سرعت و شتاب
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
}