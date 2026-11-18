/**
 * دوربین داینامیک ۲ بعدی با منطقه مرده (Dead-Zone) و مرزهای هوشمند مرحله
 */
export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.levelWidth = viewportWidth;
    this.levelHeight = viewportHeight;
    this.deadZoneX = 140;
    this.lerpSpeed = 0.12;
  }

  setLevelBounds(width, height) {
    this.levelWidth = width;
    this.levelHeight = height;
  }

  update(target) {
    if (!target) return;

    // تعقیب نرم افقی کاراکتر
    const targetCenterX = target.x + target.width / 2;
    const viewCenterX = this.x + this.width / 2;

    if (Math.abs(targetCenterX - viewCenterX) > this.deadZoneX) {
      const desiredX = targetCenterX > viewCenterX
        ? targetCenterX - this.deadZoneX - this.width / 2
        : targetCenterX + this.deadZoneX - this.width / 2;

      this.x += (desiredX - this.x) * this.lerpSpeed;
    }

    // قفل کردن مرزهای افقی و عمودی دوربین
    if (this.x < 0) this.x = 0;
    if (this.x > this.levelWidth - this.width) {
      this.x = Math.max(0, this.levelWidth - this.width);
    }

    // دوربین در راستای عمودی روی زمین تثبیت می‌شود مگر در مراحل مرتفع
    if (this.levelHeight > this.height) {
      const targetCenterY = target.y + target.height / 2;
      const desiredY = targetCenterY - this.height / 2;
      this.y += (desiredY - this.y) * 0.08;
      this.y = Math.max(0, Math.min(this.y, this.levelHeight - this.height));
    } else {
      this.y = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
  }

  restore(ctx) {
    ctx.restore();
  }
}