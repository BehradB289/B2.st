/**
 * Dynamic Viewport Camera with Lookahead & Deadzones
 */

import { CONFIG } from '../../config/game.config.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = CONFIG.CANVAS.INTERNAL_WIDTH;
    this.height = CONFIG.CANVAS.INTERNAL_HEIGHT;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  update(target, maxLevelWidth, dt) {
    if (!target) return;

    // Classic NES Mario camera only scrolls right forward
    const deadzoneCenterX = this.x + this.width * 0.42;

    if (target.x > deadzoneCenterX) {
      this.x = Math.max(this.x, target.x - this.width * 0.42);
    }

    // Horizontal limit
    const maxX = maxLevelWidth * CONFIG.TILES.SIZE - this.width;
    if (this.x > maxX) this.x = maxX;
    if (this.x < 0) this.x = 0;

    // Screen Shake effect
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffset = (Math.random() - 0.5) * this.shakeIntensity;
    } else {
      this.shakeOffset = 0;
    }
  }

  shake(duration = 0.2, intensity = 4) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  isVisible(x, width) {
    return x + width >= this.x && x <= this.x + this.width;
  }
}