/**
 * چرخه بازی بر پایه Fixed Timestep با اکومولاتور زمان
 */
export class GameLoop {
  constructor(updateFn, renderFn, fixedStep = 1 / 60) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.fixedStep = fixedStep;
    this.accumulatedTime = 0;
    this.lastTime = 0;
    this.isRunning = false;
    this.rafId = null;

    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
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

    let delta = (currentTime - this.lastTime) / 1000;
    if (delta > 0.1) delta = 0.1; // جلوگیری از افت فاحش (spiral of death)

    this.accumulatedTime += delta;
    this.lastTime = currentTime;

    while (this.accumulatedTime >= this.fixedStep) {
      this.updateFn(this.fixedStep);
      this.accumulatedTime -= this.fixedStep;
    }

    this.renderFn(this.accumulatedTime / this.fixedStep);
    this.rafId = requestAnimationFrame(this.tick);
  }
}