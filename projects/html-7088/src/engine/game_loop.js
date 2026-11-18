/**
 * Deterministic Game Loop
 * Fixed Timestep for Physics Simulation + Smooth Interpolated Render
 * Layer: Central Engine
 * Studio: B2.st
 */

export class GameLoop {
  /**
   * @param {Function} updateFn - Called with fixed delta time
   * @param {Function} renderFn - Called on animation frame
   * @param {number} [targetFps=60]
   */
  constructor(updateFn, renderFn, targetFps = 60) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.fixedDeltaTime = 1 / targetFps;

    this.isRunning = false;
    this.rafId = null;
    this.lastTime = 0;
    this.accumulator = 0;

    // Performance telemetry
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.frameCount = 0;
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  tick(currentTime) {
    if (!this.isRunning) return;

    let frameTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Prevent spiral of death on lag spikes (cap at 250ms)
    if (frameTime > 0.25) {
      frameTime = 0.25;
    }

    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedDeltaTime) {
      this.updateFn(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    this.renderFn();

    // FPS calculation
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }
}