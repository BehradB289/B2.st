/**
 * Fixed timestep game loop for deterministic physics simulation.
 */
export class GameLoop {
  constructor(updateFn, renderFn, timestep = 1 / 60) {
    this.update = updateFn;
    this.render = renderFn;
    this.timestep = timestep;
    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;
    this.rafId = null;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    const frame = (time) => {
      if (!this.running) return;
      const delta = (time - this.lastTime) / 1000;
      this.lastTime = time;

      // Cap delta time to prevent spiral of death
      this.accumulator += Math.min(delta, 0.1);

      while (this.accumulator >= this.timestep) {
        this.update(this.timestep);
        this.accumulator -= this.timestep;
      }

      this.render();
      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}