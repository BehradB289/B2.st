/**
 * Deterministic Fixed-Step Game Loop with requestAnimationFrame
 */
export class GameLoop {
  constructor(fixedStep, updateFn, renderFn) {
    this.fixedStep = fixedStep;
    this.updateFn = updateFn;
    this.renderFn = renderFn;

    this.accumulator = 0;
    this.lastTime = 0;
    this.isRunning = false;
    this.rafId = null;

    this._loop = this._loop.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this._loop);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop(currentTime) {
    if (!this.isRunning) return;

    let deltaSeconds = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Prevent spiral of death on tab-out
    if (deltaSeconds > 0.1) {
      deltaSeconds = 0.1;
    }

    this.accumulator += deltaSeconds;

    while (this.accumulator >= this.fixedStep) {
      this.updateFn(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    this.renderFn(this.accumulator / this.fixedStep);
    this.rafId = requestAnimationFrame(this._loop);
  }
}