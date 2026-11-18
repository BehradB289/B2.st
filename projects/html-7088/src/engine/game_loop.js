/**
 * چرخه بازی با نرخ فریم پایدار و گام زمانی ثابت (Fixed Timestep 60Hz Game Loop)
 */
(function (global) {
  'use strict';

  class GameLoop {
    constructor(updateFn, renderFn) {
      this.update = updateFn;
      this.render = renderFn;
      this.targetFps = 60;
      this.fixedStep = 1 / 60;
      this.accumulator = 0;
      this.lastTime = 0;
      this.isRunning = false;
      this.rafId = null;
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.lastTime = performance.now();
      const tick = (now) => {
        if (!this.isRunning) return;
        const delta = Math.min((now - this.lastTime) / 1000, 0.1); // جلوگیری از Spiral of Death
        this.lastTime = now;
        this.accumulator += delta;

        while (this.accumulator >= this.fixedStep) {
          this.update(this.fixedStep);
          this.accumulator -= this.fixedStep;
        }

        this.render();
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    }

    stop() {
      this.isRunning = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoop };
  } else {
    global.GameLoop = GameLoop;
  }
})(typeof window !== 'undefined' ? window : globalThis);