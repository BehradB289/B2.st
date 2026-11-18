/**
 * @file GameLoop.js
 * @description Fixed-timestep game loop with variable rendering and periodic cache maintenance.
 */
export class GameLoop {
  /**
   * @param {Function} updateFn (dt) => void
   * @param {Function} renderFn (interpolation) => void
   * @param {PerformanceCache} cache Engine cache instance
   */
  constructor(updateFn, renderFn, cache) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.cache = cache;

    this.targetFPS = 60;
    this.fixedDelta = 1 / 60;
    this.accumulator = 0;
    this.lastTime = 0;
    this.isRunning = false;

    // Diagnostics
    this.fps = 0;
    this.framesCount = 0;
    this.fpsTimer = 0;
    this.maintenanceTimer = 0;

    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.isRunning = false;
  }

  _tick(currentTime) {
    if (!this.isRunning) return;

    let delta = (currentTime - this.lastTime) / 1000;
    if (delta > 0.25) delta = 0.25; // Clamp huge lag spikes
    this.lastTime = currentTime;

    this.accumulator += delta;

    // Diagnostics FPS computation
    this.fpsTimer += delta;
    this.framesCount++;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.framesCount;
      this.framesCount = 0;
      this.fpsTimer -= 1.0;
    }

    // Periodic maintenance on cache (prunes dead TTL entries every 5 seconds)
    this.maintenanceTimer += delta;
    if (this.maintenanceTimer >= 5.0) {
      if (this.cache) this.cache.pruneExpired();
      this.maintenanceTimer = 0;
    }

    // Deterministic fixed physics updates
    while (this.accumulator >= this.fixedDelta) {
      this.updateFn(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
    }

    // Render with remaining fraction
    const alpha = this.accumulator / this.fixedDelta;
    this.renderFn(alpha);

    requestAnimationFrame(this._tick);
  }
}