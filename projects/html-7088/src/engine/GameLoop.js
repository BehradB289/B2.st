import { GameConfig } from '../../config/game.config.js';

/**
 * Studio B2.st - Deterministic Fixed-Timestep Game Loop
 * Eliminates screen-refresh rate discrepancies (60Hz, 120Hz, 144Hz) using accumulator pattern.
 */
export class GameLoop {
  constructor(onUpdate, onRender) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.fixedDelta = GameConfig.CANVAS.FIXED_DELTA_TIME;
    this.accumulator = 0;
    this.lastTime = 0;
    this.isRunning = false;
    this.rafId = null;

    this._step = this._step.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this._step);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _step(currentTime) {
    if (!this.isRunning) return;

    let frameDelta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Guard against spiral of death if tab was inactive
    if (frameDelta > 0.25) {
      frameDelta = 0.25;
    }

    this.accumulator += frameDelta;

    while (this.accumulator >= this.fixedDelta) {
      this.onUpdate(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
    }

    const alpha = this.accumulator / this.fixedDelta;
    this.onRender(alpha);

    this.rafId = requestAnimationFrame(this._step);
  }
}