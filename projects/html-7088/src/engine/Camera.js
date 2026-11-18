/**
 * دوربین اسکرولر افقی متحرک جهت دنبال کردن ماریو به سبک بازی کلاسیک NES
 */
export class Camera {
    /**
     * @param {number} width عرض دید دوربین
     * @param {number} height ارتفاع دید دوربین
     */
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.maxX = 0;
    }

    /**
     * دنبال کردن هدف (ماریو) بدون امکان برگشت به عقب در صورت نیاز
     * @param {import('../entities/Entity.js').Entity} target 
     * @param {number} levelPixelWidth عرض کل مرحله به پیکسل
     */
    update(target, levelPixelWidth) {
        // دوربین ماریو را در مرکز افقی یا کمی متمایل به چپ حفظ می‌کند
        const targetX = target.position.x - this.width * 0.38;

        if (targetX > this.x) {
            this.x = targetX;
        }

        // قفل کردن دوربین در محدوده مرحله
        if (this.x < 0) this.x = 0;
        const maxScroll = levelPixelWidth - this.width;
        if (this.x > maxScroll) this.x = maxScroll;
    }
}