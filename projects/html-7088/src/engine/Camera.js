/**
 * B2.st Studio - Mario Game Engine
 * Smooth Scrolling NES-style Viewport Camera
 * @module src/engine/Camera
 */

export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.deadZoneX = viewportWidth * 0.35;
  }

  update(targetX, levelWidth) {
    const focusX = targetX - this.deadZoneX;
    if (focusX > this.x) {
      this.x = focusX;
    }
    // Prevent backward scrolling like classic NES SMB
    const maxX = Math.max(0, levelWidth - this.viewportWidth);
    if (this.x > maxX) {
      this.x = maxX;
    }
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }
}