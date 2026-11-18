/**
 * دوربین ۲ بعدی با پشتیبانی از اسکرول افقی تک‌جهته NES و Viewport Culling
 */
export class Camera {
  constructor(width, height) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.minX = 0;
    this.maxX = 0;
    // در استاندارد NES ماریو نمی‌تواند به سمت چپ دوربین بازگردد
    this.forwardOnly = true;
  }

  /**
   * تنظیم محدوده‌های مجاز نقشه
   */
  setBounds(minX, maxX) {
    this.minX = minX;
    this.maxX = maxX;
  }

  /**
   * دنبال کردن موقعیت ماریو
   * @param {Object} target موقعیت کاراکتر
   */
  follow(target) {
    // افست برای قرار گرفتن ماریو در حدود ۳۵ درصدی از سمت چپ کادر
    const targetScreenX = this.width * 0.35;
    const desiredX = target.pos.x - targetScreenX;

    if (this.forwardOnly) {
      if (desiredX > this.x) {
        this.x = desiredX;
      }
    } else {
      this.x = desiredX;
    }

    // مهار دوربین در محدوده مرحله
    if (this.x < this.minX) this.x = this.minX;
    if (this.x > this.maxX - this.width) this.x = this.maxX - this.width;
  }

  /**
   * بررسی قرار داشتن مستطیل در میدان دید جهت Viewport Culling
   */
  isVisible(boxX, boxY, boxWidth, boxHeight) {
    return (
      boxX + boxWidth >= this.x &&
      boxX <= this.x + this.width &&
      boxY + boxHeight >= this.y &&
      boxY <= this.y + this.height
    );
  }

  /**
   * دریافت محدوده ستون‌ها و ردیف‌های نمایان برای بهینه‌سازی رندر
   */
  getVisibleTileRange(tileSize) {
    const startCol = Math.max(0, Math.floor(this.x / tileSize));
    const endCol = Math.ceil((this.x + this.width) / tileSize);
    const startRow = Math.max(0, Math.floor(this.y / tileSize));
    const endRow = Math.ceil((this.y + this.height) / tileSize);

    return { startCol, endCol, startRow, endRow };
  }

  /**
   * اعمال ترنسلیت به کانتکست نقاشی
   */
  apply(ctx) {
    ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
  }
}