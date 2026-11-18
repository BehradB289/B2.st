/**
 * استودیو B2.st - موتور فیزیک دو بعدی بازی
 * کلاس محاسبات برداری دو بعدی
 */
export class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    clone() {
        return new Vector2D(this.x, this.y);
    }

    mag() {
        return Math.hypot(this.x, this.y);
    }
}