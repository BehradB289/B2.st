import { Entity } from './Entity.js';
import { GameConfig } from '../../config/game_config.js';

/**
 * موجودیت دشمن پایه گومبا (قارچ قهوه‌ای رنگ متخاصم)
 */
export class Goomba extends Entity {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {import('../levels/SpriteSheet.js').SpriteSheet} spriteSheet 
     */
    constructor(x, y, spriteSheet) {
        super(x, y, 16, 16);
        this.spriteSheet = spriteSheet;
        this.tag = 'enemy';
        this.velocity.x = -GameConfig.GOOMBA.SPEED;

        this.animTimer = 0;
        this.animFrame = 0;
        this.isSquished = false;
        this.squishTimer = 0;
    }

    update(dt) {
        if (this.isSquished) {
            this.squishTimer += dt;
            if (this.squishTimer > GameConfig.GOOMBA.SQUISH_TIME) {
                this.isDead = true;
            }
            return;
        }

        this.velocity.y += GameConfig.WORLD.GRAVITY * dt;
        if (this.velocity.y > GameConfig.WORLD.MAX_FALL_SPEED) {
            this.velocity.y = GameConfig.WORLD.MAX_FALL_SPEED;
        }

        // به‌روزرسانی فریم انیمیشن راه رفتن
        this.animTimer += dt;
        if (this.animTimer > 0.18) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }
    }

    onCollideHorizontal(direction) {
        // تغییر جهت حرکت پس از برخورد با موانع
        this.velocity.x = -this.velocity.x;
    }

    squish() {
        this.isSquished = true;
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    render(ctx, camera) {
        const renderX = Math.floor(this.position.x - camera.x);
        const renderY = Math.floor(this.position.y - camera.y);

        let sprite;
        if (this.isSquished) {
            sprite = this.spriteSheet.getGoombaSquished();
        } else {
            sprite = this.spriteSheet.getGoomba(this.animFrame);
        }

        ctx.drawImage(sprite, renderX, renderY);
    }
}