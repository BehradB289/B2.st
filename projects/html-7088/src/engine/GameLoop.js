import { EventEmitter } from './EventEmitter.js';

/**
 * GameLoop - چرخه زمانی پایدار بازی با متد Fixed Timestep Accumulator
 * تضمین‌کننده عملکرد یکنواخت فیزیک بازی روی مانیتورهای ۶۰، ۱۲۰ و ۱۴۴ هرتز
 */
export class GameLoop extends EventEmitter {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.targetFps=60] نرخ فریم محاسبات فیزیک
   * @param {number} [options.maxAccumulator=0.2] حداکثر انباشت زمانی برای جلوگیری از افت تصاعدی (Spiral of Death)
   * @param {Function} [options.onUpdate=null] متد به‌روزرسانی منطق و فیزیک
   * @param {Function} [options.onRender=null] متد رندر گرافیکی
   */
  constructor(options = {}) {
    super();

    this.targetFps = options.targetFps || 60;
    this.fixedDeltaTime = 1 / this.targetFps; // زمان گام ثابت (مثبت ۰.۰۱۶۶۶ ثانیه)
    this.maxAccumulator = options.maxAccumulator || 0.2; // سقف ۲۰۰ میلی‌ثانیه

    this.onUpdate = options.onUpdate || (() => {});
    this.onRender = options.onRender || (() => {});

    this.isRunning = false;
    this.isPaused = false;

    this.lastTime = 0;
    this.accumulator = 0;
    this.animationFrameId = null;

    // معیارهای مانیتورینگ عملکرد (Performance Metrics)
    this.fps = 0;
    this.framesCount = 0;
    this.fpsTimer = 0;
    this.actualDeltaTime = 0;

    this.tick = this.tick.bind(this);
  }

  /**
   * شروع چرخه بازی
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.accumulator = 0;
    this.framesCount = 0;
    this.fpsTimer = this.lastTime;

    this.emit('start');
    this.animationFrameId = this.requestFrame(this.tick);
  }

  /**
   * توقف کامل چرخه
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = false;
    this.cancelFrame(this.animationFrameId);
    this.animationFrameId = null;

    this.emit('stop');
  }

  /**
   * توقف موقت (Pause)
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.emit('pause');
  }

  /**
   * ادامه بازی بعد از توقف موقت
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.accumulator = 0;
    this.emit('resume');
  }

  /**
   * تغییر وضعیت Pause / Resume
   */
  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * تیک اصلی فریم که با هر رفرش مانیتور اجرا می‌شود
   * @param {DOMHighResTimeStamp} currentTime
   */
  tick(currentTime = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
    if (!this.isRunning) return;

    // تبدیل به ثانیه
    const deltaMs = currentTime - this.lastTime;
    const frameDelta = deltaMs / 1000;
    this.actualDeltaTime = frameDelta;
    this.lastTime = currentTime;

    // محاسبه FPS لحظه‌ای
    this.framesCount++;
    if (currentTime - this.fpsTimer >= 1000) {
      this.fps = this.framesCount;
      this.framesCount = 0;
      this.fpsTimer = currentTime;
      this.emit('fps', this.fps);
    }

    if (!this.isPaused) {
      // انباشت زمان سپری‌شده با سقف امنیتی
      this.accumulator += Math.min(frameDelta, this.maxAccumulator);

      // مصرف گام‌های زمانی ثابت توسط موتور فیزیک
      while (this.accumulator >= this.fixedDeltaTime) {
        this.onUpdate(this.fixedDeltaTime);
        this.accumulator -= this.fixedDeltaTime;
      }
    }

    // ضریب میان‌یابی (Interpolation Alpha) جهت رندر بدون لکنت گرافیک بین دو گام
    const alpha = this.accumulator / this.fixedDeltaTime;
    this.onRender(alpha);

    this.emit('frame', {
      fps: this.fps,
      actualDeltaTime: this.actualDeltaTime,
      alpha
    });

    this.animationFrameId = this.requestFrame(this.tick);
  }

  /**
   * متد انتزاعی فراخوانی فریم (سازگار با محیط مرورگر و تست‌های Node.js)
   * @param {Function} callback
   * @returns {number|NodeJS.Timeout}
   */
  requestFrame(callback) {
    if (typeof requestAnimationFrame !== 'undefined') {
      return requestAnimationFrame(callback);
    }
    return setTimeout(() => callback(Date.now()), 1000 / this.targetFps);
  }

  /**
   * متد لغو فریم
   * @param {number|NodeJS.Timeout} id
   */
  cancelFrame(id) {
    if (typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  }
}