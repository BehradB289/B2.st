/**
 * Axis-Aligned Bounding Box (AABB) for 2D collision detection and resolution.
 */
export class AABB {
  constructor(x, y, width, height) {
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

  /**
   * Checks whether this AABB intersects with another.
   * @param {AABB} other
   * @returns {boolean}
   */
  intersects(other) {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  /**
   * Calculates penetration depth and direction relative to another box.
   * @param {AABB} other
   * @returns {{ox: number, oy: number, dx: number, dy: number} | null}
   */
  getOverlap(other) {
    const dx = this.centerX - other.centerX;
    const dy = this.centerY - other.centerY;
    const halfWidths = (this.width + other.width) / 2;
    const halfHeights = (this.height + other.height) / 2;

    const ox = halfWidths - Math.abs(dx);
    const oy = halfHeights - Math.abs(dy);

    if (ox <= 0 || oy <= 0) {
      return null;
    }

    return { ox, oy, dx, dy };
  }
}