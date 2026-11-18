import { Entity } from './Entity.js';
import { GameConfig } from '../../config/game_config.js';

/**
 * موجودیت بازیکن اصلی ماریو
 */
export class Mario extends Entity {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {import('../levels/SpriteSheet.js').SpriteSheet} spriteSheet 
     * @param {import('../engine/AudioEngine.js').AudioEngine} audio 
     */
    constructor(x, y, spriteSheet, audio) {
        super(x, y, 14, 16); // محدوده برخورد فیزیکی دقیق
        this.spriteSheet = spriteSheet;
        this.audio = audio;
        this.tag = 'mario';

        this.facingRight = true;
        this.animTimer = 0;
        this.animFrame = 0;
        this.invulnerableTimer = 0;
    }

    update(dt, input) {
        if (this.isDead) {
            // شبیه‌سازی انیمیشن مرگ و جهش به بالا و سقوط
            this.velocity.y += GameConfig.WORLD.GRAVITY * 0.7 * dt;
            this.position.y += this.velocity.y * dt;
            return;
        }

        // بررسی زمان مصونیت پس از آسیب
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }

        const accel = input.keys.run ? GameConfig.MARIO.RUN_ACCELERATION : GameConfig.MARIO.MOVE_ACCELERATION;
        const maxSpeed = input.keys.run ? GameConfig.MARIO.MAX_RUN_SPEED : GameConfig.MARIO.MAX_WALK_SPEED;

        // ورودی افقی
        if (input.keys.right) {
            this.velocity.x += accel * dt;
            this.facingRight = true;
        } else if (input.keys.left) {
            this.velocity.x -= accel * dt;
            this.facingRight = false;
        } else {
            // اعمال اصطکاک سطح
            this.velocity.x *= GameConfig.WORLD.FRICTION;
            if (Math.abs(this.velocity.x) < 5) this.velocity.x = 0;
        }

        // محدودسازی حداکثر سرعت افقی
        if (this.velocity.x > maxSpeed) this.velocity.x = maxSpeed;
        if (this.velocity.x < -maxSpeed) this.velocity.x = -maxSpeed;

        // فرمان پرش
        if (input.keys.jump && this.isGrounded) {
            this.velocity.y = -GameConfig.MARIO.JUMP_FORCE;
            this.isGrounded = false;
            this.audio.playJump();
        }

        // اعمال گرانش جهانی
        this.velocity.y += GameConfig.WORLD.GRAVITY * dt;
        if (this.velocity.y > GameConfig.WORLD.MAX_FALL_SPEED) {
            this.velocity.y = GameConfig.WORLD.MAX_FALL_SPEED;
        }

        // انیمیشن دویدن
        if (Math.abs(this.velocity.x) > 10 && this.isGrounded) {
            this.animTimer += dt * (Math.abs(this.velocity.x) / 10);
            if (this.animTimer > 0.12) {
                this.animFrame = (this.animFrame + 1) % 2;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
        }
    }

    bounce() {
        this.velocity.y = -GameConfig.MARIO.BOUNCE_FORCE;
        this.isGrounded = false;
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.velocity.x = 0;
        this.velocity.y = -260; // پرش کوتاه قبل از افتادن
        this.audio.playDie();
    }

    render(ctx, camera) {
        // در صورت مصونیت چشمک بزند
        if (this.invulnerableTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
            return;
        }

        const renderX = Math.floor(this.position.x - camera.x);
        const renderY = Math.floor(this.position.y - camera.y);

        let sprite;
        if (this.isDead) {
            sprite = this.spriteSheet.getMarioJump();
        } else if (!this.isGrounded) {
            sprite = this.spriteSheet.getMarioJump();
        } else if (Math.abs(this.velocity.x) > 10) {
            sprite = this.spriteSheet.getMarioRun(this.animFrame);
        } else {
            sprite = this.spriteSheet.getMarioIdle();
        }

        ctx.save();
        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -renderX - this.size.x, renderY);
        } else {
            ctx.drawImage(sprite, renderX, renderY);
        }
        ctx.restore();
    }
}