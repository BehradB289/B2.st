/**
 * Lightweight Visual Particle & Score Popup System
 * Layer: Entities & Visuals
 * Studio: B2.st
 */

export class Particle {
  constructor(x, y, text = '100', color = '#ffffff') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.lifetime = 0.7;
    this.age = 0;
    this.velocityY = -50;
    this.markedForRemoval = false;
  }

  update(deltaTime) {
    this.age += deltaTime;
    this.y += this.velocityY * deltaTime;
    if (this.age >= this.lifetime) {
      this.markedForRemoval = true;
    }
  }

  render(ctx, camera) {
    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, Math.round(this.x - camera.x), Math.round(this.y - camera.y));
    ctx.restore();
  }
}