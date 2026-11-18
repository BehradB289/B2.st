/**
 * استودیو B2.st - کلاس پایه هویت‌ها (Entity Base Class)
 * ستون فقرات معماری ماژولار انتیتی‌ها
 */
import { Vector2D } from '../engine/Vector2D.js';
import { Physics } from '../engine/Physics.js';

export class Entity {
    constructor(x = 0, y = 0, width = 16, height = 16) {
        this.pos = new Vector2D(x, y);
        this.vel = new Vector2D(0, 0);
        this.size = new Vector2D(width, height);
        this.facing = 1; // 1 برای راست، -1 برای چپ
        this.isGrounded = false;
        this.hasGravity = true;
        this.collidesWithWorld = true;
        this.isDead = false;
        this.isRemoved = false;
        this.state = 'IDLE';
        this.animTimer = 0;
        this.animFrame = 0;
    }

    getBounds() {
        return {
            pos: this.pos,
            size: this.size
        };
    }

    update(dt, level) {
        this.animTimer += dt;
        Physics.applyGravity(this, dt);
        Physics.resolveTileMapCollisions(this, level.tileMap, dt);
    }

    onCollideHorizontal(direction) {
        // قابل بازنویسی توسط فرزندان
    }

    onCollideVertical(direction, tile) {
        // قابل بازنویسی توسط فرزندان
    }

    render(ctx) {
        // انتزاعی - باید توسط هر انتیتی رندر شود
    }
}