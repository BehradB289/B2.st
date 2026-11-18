/**
 * Fixed-Timestep Game Loop Manager
 * Studio: B2.st
 */

import { CANVAS } from '../../config/constants.js';

export class GameLoop {
  constructor(updateFn, renderFn, fixedDelta = CANVAS.FIXED_DELTA_TIME) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.fixedDelta = fixedDelta;
    this.isRunning = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.rafId = null;
  }

  start() {
    this.isRunning = true;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.accumulator = 0;

    const frame = (currentTime) => {
      if (!this.isRunning) return;

      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Cap delta time to prevent spiral of death on lag spikes
      const clampedDelta = Math.min(delta, 0.25);
      this.accumulator += clampedDelta;

      while (this.accumulator >= this.fixedDelta) {
        this.updateFn(this.fixedDelta);
        this.accumulator -= this.fixedDelta;
      }

      this.renderFn();

      if (typeof requestAnimationFrame !== 'undefined') {
        this.rafId = requestAnimationFrame(frame);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this.rafId = requestAnimationFrame(frame);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.rafId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }

  step(customDelta = this.fixedDelta) {
    this.updateFn(customDelta);
    this.renderFn();
  }
}