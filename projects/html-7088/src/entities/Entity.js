/**
 * کلاس والد موجودیت‌ها (Bounding Box & Collision Math)
 */
'use strict';

export class Entity {
    constructor(x, y, width, height) {
        this.x = Number(x) || 0;
        this.y = Number(y) || 0;
        this.width = Number(width) || 32;
        this.height = Number(height) || 32;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.isAlive = true;
    }

    get bounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    intersects(other) {
        if (!other || !other.bounds) return false;
        const a = this.bounds;
        const b = other.bounds;
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    update(_dt) {
        // برای بازنویسی در فرزندان
    }

    render(_ctx, _cameraX) {
        // برای بازنویسی در فرزندان
    }
}