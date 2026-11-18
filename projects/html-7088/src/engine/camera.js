/**
 * 2D Dynamic Scrolling Camera
 * Keeps Mario in focus with horizontal boundary locking
 * Layer: Central Engine
 * Studio: B2.st
 */

import { CONFIG } from '../../config/game_config.js';

export class Camera {
  constructor(viewportWidth = CONFIG.CANVAS.WIDTH, viewportHeight = CONFIG.CANVAS.HEIGHT) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.minX = 0;
    this.maxX = 10000;
  }

  setLevelBounds(worldWidth) {
    this.maxX = Math.max(0, worldWidth - this.viewportWidth);
  }

  follow(target) {
    // Mario center target
    const targetCenterX = target.position.x + target.width / 2;
    const desiredX = targetCenterX - this.viewportWidth * 0.45;

    // Smooth forward progression (Mario classic: camera doesn't scroll backwards)
    if (desiredX > this.x) {
      this.x = desiredX;
    }

    // Clamping to map edges
    if (this.x < this.minX) this.x = this.minX;
    if (this.x > this.maxX) this.x = this.maxX;
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }

  isVisible(x, y, width, height) {
    return (
      x + width >= this.x &&
      x <= this.x + this.viewportWidth &&
      y + height >= this.y &&
      y <= this.y + this.viewportHeight
    );
  }
}