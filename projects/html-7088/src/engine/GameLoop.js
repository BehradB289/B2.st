/**
 * چرخه بازی (Game Loop) با گام زمانی ثابت (Fixed Timestep 60Hz) و رندر شناور
 */
export class GameLoop {
  constructor(updateFn, renderFn) {
    this.update = updateFn;
    this.render = renderFn;
    this.lastTime = 0;
    this.accumulatedTime = 0;
    this.step = 1000 / 60; // 60 فریم بر ثانیه پایدار
    this.running = false;
    this.rafId = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  loop(currentTime) {
    if (!this.running) return;

    let delta = currentTime - this.lastTime;
    if (delta > 250) delta = 250; // جلوگیری از افت فریم فاجعه‌بار حین تعویض تب مرورگر

    this.accumulatedTime += delta;
    this.lastTime = currentTime;

    while (this.accumulatedTime >= this.step) {
      this.update(this.step);
      this.accumulatedTime -= this.step;
    }

    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  }
}