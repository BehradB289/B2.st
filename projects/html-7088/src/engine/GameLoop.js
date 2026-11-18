/**
 * Fixed Timestep Precision Game Loop
 */

export class GameLoop {
  constructor(updateFn, renderFn, fixedDelta = 1 / 60) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.fixedDelta = fixedDelta;

    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;
    this.rafId = null;

    this._loop = this._loop.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop(currentTime) {
    if (!this.running) return;

    let frameTime = (currentTime - this.lastTime) / 1000;
    if (frameTime > 0.25) frameTime = 0.25; // Prevent spiral of death
    this.lastTime = currentTime;

    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedDelta) {
      this.updateFn(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
    }

    const alpha = this.accumulator / this.fixedDelta;
    this.renderFn(alpha);

    this.rafId = requestAnimationFrame(this._loop);
  }
}