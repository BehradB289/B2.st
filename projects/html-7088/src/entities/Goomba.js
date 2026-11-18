/**
 * استودیو B2.st - انتیتی دشمن گومبا (Goomba Entity)
 * هوش مصنوعی گشت‌زنی، انیمیشن قدم‌زدن، له شدن و پاک‌سازی حافظه
 */
import { Entity } from './Entity.js';

export const GOOMBA_STATES = {
    WALKING: 'WALKING',
    SQUISHED: 'SQUISHED',
    DEAD: 'DEAD'
};

export class Goomba extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vel.x = -38; // سرعت حرکت استاندارد به سمت چپ
        this.state = GOOMBA_STATES.WALKING;
        this.squishTimer = 0;
        this.animStepRate = 0.18;
    }

    update(dt, level) {
        if (this.state === GOOMBA_STATES.DEAD) {
            this.isRemoved = true;
            return;
        }

        if (this.state === GOOMBA_STATES.SQUISHED) {
            this.squishTimer += dt;
            if (this.squishTimer >= 0.45) {
                this.state = GOOMBA_STATES.DEAD;
            }
            return; // هنگامی که له شده حرکت نمی‌کند
        }

        super.update(dt, level);

        // چرخه انیمیشن گام برداشتن
        if (this.animTimer >= this.animStepRate) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }

        // پاکسازی اگر از دنیای بازی خارج شد
        if (this.pos.y > 280) {
            this.isRemoved = true;
        }
    }

    onCollideHorizontal(dir) {
        // تغییر جهت هوشمند هنگام برخورد با موانع، دیوارها و لوله‌ها
        this.facing = -dir;
        this.vel.x = this.facing * 38;
    }

    stomp() {
        if (this.state !== GOOMBA_STATES.WALKING) return;
        this.state = GOOMBA_STATES.SQUISHED;
        this.collidesWithWorld = false;
        this.hasGravity = false;
        this.vel.set(0, 0);
        this.size.y = 8;
        this.pos.y += 8; // تخت شدن روی زمین
    }

    render(ctx) {
        ctx.save();
        ctx.translate(Math.floor(this.pos.x), Math.floor(this.pos.y));

        if (this.state === GOOMBA_STATES.SQUISHED) {
            // رندر گومبای فشرده و له شده
            ctx.fillStyle = '#9C4A00'; // رنگ قهوه‌ای قارچ
            ctx.fillRect(1, 4, 14, 4);
            ctx.fillStyle = '#000000';
            ctx.fillRect(3, 4, 2, 2);
            ctx.fillRect(11, 4, 2, 2);
        } else {
            // سر قارچی قهوه‌ای
            ctx.fillStyle = '#9C4A00';
            ctx.fillRect(2, 1, 12, 8);
            ctx.fillRect(4, 0, 8, 1);
            ctx.fillRect(1, 3, 14, 5);

            // صورت کرمی
            ctx.fillStyle = '#FCD8A8';
            ctx.fillRect(4, 8, 8, 4);

            // چشم‌ها و ابروهای خشمگین
            ctx.fillStyle = '#000';
            // ابروها
            ctx.fillRect(4, 4, 3, 2);
            ctx.fillRect(9, 4, 3, 2);
            // مردمک چشم
            ctx.fillRect(5, 6, 2, 3);
            ctx.fillRect(9, 6, 2, 3);
            ctx.fillStyle = '#FFF';
            ctx.fillRect(5, 6, 1, 2);
            ctx.fillRect(10, 6, 1, 2);

            // پاهای سیاه متحرک
            ctx.fillStyle = '#000000';
            if (this.animFrame === 0) {
                ctx.fillRect(0, 12, 5, 4);
                ctx.fillRect(10, 13, 5, 3);
            } else {
                ctx.fillRect(1, 13, 5, 3);
                ctx.fillRect(11, 12, 5, 4);
            }
        }
        ctx.restore();
    }
}