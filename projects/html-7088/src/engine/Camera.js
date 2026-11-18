/**
 * 2D Scrolling Camera with forward-only tracking lock (Classic NES Mario style)
 * Studio: B2.st
 */

export class Camera {
  constructor(viewportWidth = 256, viewportHeight = 240) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.deadZoneLeadX = viewportWidth * 0.45;
  }

  update(targetX) {
    const desiredX = targetX - this.deadZoneLeadX;
    // In classic Mario 1-1, camera never scrolls backward
    if (desiredX > this.x) {
      this.x = desiredX;
    }
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }

  isVisible(box) {
    return (
      box.right >= this.x &&
      box.left <= this.x + this.viewportWidth &&
      box.bottom >= this.y &&
      box.top <= this.y + this.viewportHeight
    );
  }

  worldToScreenX(worldX) {
    return Math.floor(worldX - this.x);
  }

  worldToScreenY(worldY) {
    return Math.floor(worldY - this.y);
  }
}