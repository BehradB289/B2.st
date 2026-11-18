/**
 * حلقه اصلی بازی با گام زمانی ثابت (Fixed Timestep Accumulator)
 * جهت شبیه‌سازی فیزیک قطعی در تمامی نرخ‌های نوسازی مانیتور (60Hz, 144Hz, 240Hz)
 */
export class GameLoop {
    /**
     * @param {Function} updateFn تابع به‌روزرسانی با مقدار dt ثابت
     * @param {Function} renderFn تابع ترسیم
     * @param {number} fixedStep ثانیه در هر تیک فیزیک (مثلاً 1/60)
     */
    constructor(updateFn, renderFn, fixedStep = 1 / 60) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.fixedStep = fixedStep;

        this.lastTime = 0;
        this.accumulator = 0;
        this.animationFrameId = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this._tick.bind(this));
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    _tick(currentTime) {
        if (!this.isRunning) return;

        let frameTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // ممانعت از اثر Spiral of Death در لگ‌های شدید سیستمی
        if (frameTime > 0.1) {
            frameTime = 0.1;
        }

        this.accumulator += frameTime;

        while (this.accumulator >= this.fixedStep) {
            this.updateFn(this.fixedStep);
            this.accumulator -= this.fixedStep;
        }

        this.renderFn();
        this.animationFrameId = requestAnimationFrame(this._tick.bind(this));
    }
}