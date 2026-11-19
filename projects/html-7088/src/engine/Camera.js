import { GameConfig } from '../../config/game.config.js';

/**
 * Studio B2.st - Classic NES Clamped Scrolling Camera
 * Prevents Mario from scrolling backwards, strictly follows rightward progression.
 */
export class Camera {
  constructor(viewportWidth = GameConfig.CANVAS.INTERNAL_WIDTH, viewportHeight = GameConfig.CANVAS.INTERNAL_HEIGHT) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.maxLevelWidth = 0;
  }

  setLevelWidth(tilesCount) {
    this.maxLevelWidth = tilesCount * GameConfig.WORLD.TILE_SIZE;
  }

  update(targetX) {
    // NES Mario deadzone: target centered at 38% screen width
    const targetOffset = this.viewportWidth * 0.38;
    const desiredX = targetX - targetOffset;

    // Camera cannot scroll backwards
    if (desiredX > this.x) {
      this.x = desiredX;
    }

    // Clamp camera within level bounds
    const maxScroll = Math.max(0, this.maxLevelWidth - this.viewportWidth);
    if (this.x > maxScroll) {
      this.x = maxScroll;
    }
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }

  isVisible(aabb, margin = 32) {
    return (
      aabb.right >= this.x - margin &&
      aabb.left <= this.x + this.viewportWidth + margin
    );
  }

  worldToScreen(worldX, worldY) {
    return {
      x: Math.floor(worldX - this.x),
      y: Math.floor(worldY - this.y)
    };
  }
}