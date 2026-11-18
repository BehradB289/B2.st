/**
 * @file Camera.js
 * @description Dynamic tracking viewport camera with viewport clamping and smooth scrolling.
 */
import { Vector2D } from './Vector2D.js';

export class Camera {
  constructor(viewportWidth, viewportHeight, levelWidth, levelHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;
    this.position = new Vector2D(0, 0);
    this.target = null;
    this.deadzoneX = viewportWidth * 0.35; // Mario leads until center-left
  }

  follow(entity) {
    this.target = entity;
  }

  update() {
    if (!this.target) return;

    // NES Mario camera primarily advances rightwards, but here allows smooth deadzone tracking
    const targetScreenX = this.target.x - this.position.x;

    if (targetScreenX > this.deadzoneX) {
      this.position.x += (targetScreenX - this.deadzoneX);
    }

    // Clamp horizontally to level boundaries
    const maxX = Math.max(0, this.levelWidth - this.viewportWidth);
    this.position.x = Math.max(0, Math.min(this.position.x, maxX));
    
    // Fixed vertical camera matching classic NES 1-1 ground baseline
    this.position.y = 0;
  }
}