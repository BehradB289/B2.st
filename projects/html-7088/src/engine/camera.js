/**
 * دوربین اسکرول متحرک جهت دنبال کردن روان ماریو در ابعاد مرحله
 */
(function (global) {
  'use strict';

  class Camera {
    constructor(viewportWidth = 256, viewportHeight = 240) {
      this.x = 0;
      this.y = 0;
      this.viewportWidth = viewportWidth;
      this.viewportHeight = viewportHeight;
      this.minX = 0;
      this.maxX = 3200;
    }

    setBounds(minX, maxX) {
      this.minX = minX;
      this.maxX = maxX;
    }

    /**
     * هدایت فوکوس روی ماریو با اسکرول رو به جلو مشابه نسخه رسمی NES
     */
    update(targetX) {
      const centerThreshold = targetX - this.viewportWidth * 0.45;
      if (centerThreshold > this.x) {
        this.x = centerThreshold;
      }
      // ممانعت از بازگشت به عقب‌تر از حد مجاز
      if (this.x < this.minX) this.x = this.minX;
      if (this.x > this.maxX - this.viewportWidth) {
        this.x = this.maxX - this.viewportWidth;
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Camera };
  } else {
    global.Camera = Camera;
  }
})(typeof window !== 'undefined' ? window : globalThis);