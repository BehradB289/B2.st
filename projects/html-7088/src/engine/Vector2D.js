/**
 * Vector2D - کلاس بردار دو بعدی برای محاسبات موقعیت، سرعت و شتاب
 * طراحی‌شده برای بهینه‌سازی محاسبات ریاضی موتور بازی در استودیو B2.st
 */
export class Vector2D {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * مقداردهی مجدد مولفه‌های بردار
   * @param {number} x
   * @param {number} y
   * @returns {Vector2D}
   */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * جمع با بردار دیگر
   * @param {Vector2D} v
   * @returns {Vector2D}
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * تفریق بردار دیگر
   * @param {Vector2D} v
   * @returns {Vector2D}
   */
  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /**
   * ضرب اسکالر (بزرگ‌نمایی بردار)
   * @param {number} scalar
   * @returns {Vector2D}
   */
  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * محاسبه اندازه (طول) بردار
   * @returns {number}
   */
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * نرمال‌سازی بردار (تبدیل به بردار یکه)
   * @returns {Vector2D}
   */
  normalize() {
    const mag = this.magnitude();
    if (mag > 0) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }

  /**
   * ضرب داخلی دو بردار
   * @param {Vector2D} v
   * @returns {number}
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * فاصله اقلیدسی تا بردار دیگر
   * @param {Vector2D} v
   * @returns {number}
   */
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * صفر کردن مولفه‌ها
   * @returns {Vector2D}
   */
  zero() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  /**
   * ایجاد نسخه کپی مستقل از بردار
   * @returns {Vector2D}
   */
  clone() {
    return new Vector2D(this.x, this.y);
  }
}