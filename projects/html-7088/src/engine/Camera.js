/**
 * دوربین با دید نرم و جلوگیری از به عقب رفتن ماریو مطابق نسخه اصلی نینتندو
 */
'use strict';

export class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.maxX = 0;
    }

    update(targetX, levelWidth) {
        // دوربین ماریو را در مرکز افقی دنبال می‌کند اما مانع بازگشت به چپ می‌شود
        const idealX = targetX - (this.viewportWidth * 0.35);
        if (idealX > this.x) {
            this.x = idealX;
        }

        // محدودسازی کادر بین 0 و حداکثر طول مرحله
        this.x = Math.max(0, Math.min(this.x, levelWidth - this.viewportWidth));
        this.y = 0;
    }

    reset() {
        this.x = 0;
        this.y = 0;
    }
}