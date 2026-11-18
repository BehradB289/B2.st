import { Vector2D } from './Vector2D.js';

export class Camera {
  constructor(viewportWidth = 256, viewportHeight = 240) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.pos = new Vector2D(0, 0);
    this.worldWidth = 3200;
  }

  follow(target) {
    // Keep Mario in the center-left section of the screen
    const targetX = target.pos.x - this.viewportWidth * 0.35;
    if (targetX > this.pos.x) {
      this.pos.x = targetX;
    }
    // Clamp to level boundary
    this.pos.x = Math.max(0, Math.min(this.pos.x, this.worldWidth - this.viewportWidth));
  }
}