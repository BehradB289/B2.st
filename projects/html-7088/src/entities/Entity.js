import { Vector2D } from '../engine/Vector2D.js';

/**
 * کلاس پایه هویت‌ها در معماری سبک شی‌گرا/ECS
 */
export class Entity {
    constructor(x = 0, y = 0, width = 16, height = 16) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.size = new Vector2D(width, height);
        
        this.isGrounded = false;
        this.isDead = false;
        this.tag = 'entity';
    }

    update(dt) {
        // پیاده‌سازی در کلاس‌های فرزند
    }

    render(ctx, camera) {
        // پیاده‌سازی در کلاس‌های فرزند
    }

    onCollideHorizontal(direction, tileCol, tileRow) {}
    onCollideVertical(direction, tileCol, tileRow) {}
}