/**
 * 2D Horizontal Scrolling Viewport Camera
 * Enforces classic NES Mario rule: Viewport never scrolls backwards
 */
export class Camera {
  constructor(width, height) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.lookAhead = 0.45;
  }

  update(target, maxLevelWidth) {
    const targetCenterX = target.position.x + target.size.x * 0.5;
    const desiredX = targetCenterX - this.width * this.lookAhead;

    // Keep advancing rightwards, prevent scroll backwards
    if (desiredX > this.x) {
      this.x = desiredX;
    }

    // Clamp right level boundary
    const maxX = Math.max(0, maxLevelWidth - this.width);
    if (this.x > maxX) {
      this.x = maxX;
    }
  }

  worldToScreen(x, y) {
    return {
      x: Math.round(x - this.x),
      y: Math.round(y - this.y)
    };
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }
}