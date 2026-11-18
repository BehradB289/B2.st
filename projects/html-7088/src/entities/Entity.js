/**
 * Base Game Entity Class
 */

export class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.isDead = false;
    this.facing = 1; // 1: Right, -1: Left
    this.animTimer = 0;
    this.animFrame = 0;
  }

  update(dt, level) {
    this.animTimer += dt;
    if (this.animTimer > 0.12) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  get bounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}