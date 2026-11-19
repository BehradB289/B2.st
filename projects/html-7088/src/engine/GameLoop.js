/**
 * B2.st Studio - Mario Game Engine
 * Fixed Timestep High-Precision Game Loop
 * @module src/engine/GameLoop
 */

export class GameLoop {
  constructor(updateFn, renderFn, timestep = 1 / 60) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.timestep = timestep;
    this.accumulatedTime = 0;
    this.lastTime = 0;
    this.animationFrameId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    const frame = (currentTime) => {
      if (!this.isRunning) return;
      let deltaTime = (currentTime - this.lastTime) / 1000;
      if (deltaTime > 0.1) deltaTime = 0.1; // Panic clamp

      this.accumulatedTime += deltaTime;
      while (this.accumulatedTime >= this.timestep) {
        this.updateFn(this.timestep);
        this.accumulatedTime -= this.timestep;
      }

      this.renderFn();
      this.lastTime = currentTime;
      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}