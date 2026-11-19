import { Vector2 } from './Vector2.js';
import { GAME_CONFIG } from '../../config/game.config.js';

/**
 * 2D Viewport Camera
 * Tracks player character with configurable deadzone and level clamping.
 */
export class Camera {
  constructor(viewportWidth = GAME_CONFIG.VIEWPORT_WIDTH, viewportHeight = GAME_CONFIG.VIEWPORT_HEIGHT) {
    this.pos = new Vector2(0, 0);
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.maxLevelWidth = 3200; // default length
    this.deadzoneLeft = viewportWidth * 0.35;
    this.deadzoneRight = viewportWidth * 0.55;
  }

  setBounds(maxLevelWidth) {
    this.maxLevelWidth = maxLevelWidth;
  }

  update(targetEntity) {
    if (!targetEntity) return;

    const screenTargetX = targetEntity.pos.x - this.pos.x;

    if (screenTargetX > this.deadzoneRight) {
      this.pos.x += screenTargetX - this.deadzoneRight;
    } else if (screenTargetX < this.deadzoneLeft) {
      this.pos.x += screenTargetX - this.deadzoneLeft;
    }

    // Clamp camera within world boundaries
    if (this.pos.x < 0) this.pos.x = 0;
    const maxScroll = Math.max(0, this.maxLevelWidth - this.viewportWidth);
    if (this.pos.x > maxScroll) this.pos.x = maxScroll;
  }

  worldToScreen(worldVec) {
    return new Vector2(worldVec.x - this.pos.x, worldVec.y - this.pos.y);
  }

  screenToWorld(screenVec) {
    return new Vector2(screenVec.x + this.pos.x, screenVec.y + this.pos.y);
  }

  isVisible(aabb) {
    return (
      aabb.right >= this.pos.x &&
      aabb.left <= this.pos.x + this.viewportWidth &&
      aabb.bottom >= this.pos.y &&
      aabb.top <= this.pos.y + this.viewportHeight
    );
  }
}