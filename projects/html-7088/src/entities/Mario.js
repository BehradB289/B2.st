/**
 * استودیو B2.st - انتیتی اصلی ماریو (Mario Character Entity)
 * ماشین حالت کامل (FSM)، سیستم لختی و اینرسی حرکتی،
 * ارتقا به Super Mario، مکانیزم پرش متغیر و حمله کوبشی له کردن
 */
import { Entity } from './Entity.js';
import { PHYSICS_CONFIG } from '../engine/Physics.js';

export const MARIO_STATES = {
    IDLE: 'IDLE',
    WALKING: 'WALKING',
    RUNNING: 'RUNNING',
    SKIDDING: 'SKIDDING',
    JUMPING: 'JUMPING',
    FALLING: 'FALLING',
    CROUCHING: 'CROUCHING',
    DEAD: 'DEAD'
};

export const MARIO_FORMS = {
    SMALL: 'SMALL',
    SUPER: 'SUPER'
};

export class Mario extends Entity {
    constructor(x, y, audio) {
        super(x, y, 16, 16);
        this.audio = audio;
        this.form = MARIO_FORMS.SMALL;
        this.state = MARIO_STATES.IDLE;

        // پارامترهای فیزیک و اینرسی NES
        this.acceleration = 360;       // شتاب راه رفتن (px/s²)
        this.runAcceleration = 620;    // شتاب دویدن (px/s²)
        this.maxWalkSpeed = 125;       // حداکثر سرعت گام
        this.maxRunSpeed = 210;        // حداکثر سرعت دویدن
        this.skidDecel = 850;          // نیروی مقاومت هنگام اسلاید معکوس
        this.friction = 450;           // کاهش سرعت در صورت رها شدن کلید
        this.jumpForce = -355;         // نیروی شلیک پرش
        this.jumpSustain = -18;        // پایداری در صورت نگه‌داشتن دکمه پرش
        this.jumpHoldTimer = 0;
        this.maxJumpHoldTime = 0.22;

        this.invulnerableTimer = 0;
        this.isInvulnerable = false;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
    }

    upgradeToSuper() {
        if (this.form === MARIO_FORMS.SUPER) return;
        this.form = MARIO_FORMS.SUPER;
        this.size.set(16, 32);
        this.pos.y -= 16;
        if (this.audio) this.audio.playPowerUp();
    }

    downgradeToSmall() {
        if (this.form === MARIO_FORMS.SMALL) {
            this.kill();
            return;
        }
        this.form = MARIO_FORMS.SMALL;
        this.size.set(16, 16);
        this.isInvulnerable = true;
        this.invulnerableTimer = 2.0; // دو ثانیه آسیب‌ناپذیری همراه با چشمک‌زن
    }

    kill() {
        if (this.state === MARIO_STATES.DEAD) return;
        this.state = MARIO_STATES.DEAD;
        this.isDead = true;
        this.collidesWithWorld = false;
        this.hasGravity = false;
        this.vel.set(0, -320); // جهش نمادین مرگ به بالا و سقوط
        if (this.audio) this.audio.playDeath();
    }

    handleInput(input, dt) {
        if (this.state === MARIO_STATES.DEAD) return;

        const isRunning = input.keys.run;
        const currentAccel = isRunning ? this.runAcceleration : this.acceleration;
        const currentMaxSpeed = isRunning ? this.maxRunSpeed : this.maxWalkSpeed;

        // کنترل حرکت افقی و سیستم اینرسی
        if (input.keys.left) {
            this.facing = -1;
            if (this.vel.x > 0 && this.isGrounded) {
                // ترمز ناگهانی و تغییر جهت (Skid)
                this.state = MARIO_STATES.SKIDDING;
                this.vel.x -= this.skidDecel * dt;
            } else {
                this.vel.x -= currentAccel * dt;
                if (this.vel.x < -currentMaxSpeed) this.vel.x = -currentMaxSpeed;
            }
        } else if (input.keys.right) {
            this.facing = 1;
            if (this.vel.x < 0 && this.isGrounded) {
                // ترمز ناگهانی به راست
                this.state = MARIO_STATES.SKIDDING;
                this.vel.x += this.skidDecel * dt;
            } else {
                this.vel.x += currentAccel * dt;
                if (this.vel.x > currentMaxSpeed) this.vel.x = currentMaxSpeed;
            }
        } else {
            // کاهش تدریجی سرعت (اصطکاک اینرسی)
            if (this.vel.x > 0) {
                this.vel.x -= this.friction * dt;
                if (this.vel.x < 0) this.vel.x = 0;
            } else if (this.vel.x < 0) {
                this.vel.x += this.friction * dt;
                if (this.vel.x > 0) this.vel.x = 0;
            }
        }

        // سیستم پرش متغیر ماریو
        if (input.isPressed('jump') && this.isGrounded) {
            this.vel.y = this.jumpForce;
            this.isGrounded = false;
            this.jumpHoldTimer = this.maxJumpHoldTime;
            if (this.audio) this.audio.playJump();
        }

        if (input.keys.jump && this.jumpHoldTimer > 0) {
            this.vel.y += this.jumpSustain;
            this.jumpHoldTimer -= dt;
        } else {
            this.jumpHoldTimer = 0;
        }

        // نشستن برای سوپرماریو
        if (input.keys.down && this.isGrounded && this.form === MARIO_FORMS.SUPER) {
            this.state = MARIO_STATES.CROUCHING;
        }
    }

    updateFSM() {
        if (this.state === MARIO_STATES.DEAD) return;

        if (!this.isGrounded) {
            if (this.vel.y < 0) {
                this.state = MARIO_STATES.JUMPING;
            } else {
                this.state = MARIO_STATES.FALLING;
            }
        } else {
            if (this.state === MARIO_STATES.SKIDDING) {
                if (Math.abs(this.vel.x) < 20 || (this.facing === 1 && this.vel.x > 0) || (this.facing === -1 && this.vel.x < 0)) {
                    this.state = Math.abs(this.vel.x) > 0 ? MARIO_STATES.WALKING : MARIO_STATES.IDLE;
                }
            } else if (Math.abs(this.vel.x) > 130) {
                this.state = MARIO_STATES.RUNNING;
            } else if (Math.abs(this.vel.x) > 5) {
                this.state = MARIO_STATES.WALKING;
            } else {
                this.state = MARIO_STATES.IDLE;
            }
        }
    }

    update(dt, level) {
        if (this.state === MARIO_STATES.DEAD) {
            // شبیه‌سازی انیمیشن مرگ پرتابی
            this.pos.y += this.vel.y * dt;
            this.vel.y += PHYSICS_CONFIG.GRAVITY * 0.9 * dt;
            return;
        }

        super.update(dt, level);
        this.updateFSM();

        // چرخه تایمر فریم انیمیشن
        const speed = Math.abs(this.vel.x);
        const animInterval = speed > 130 ? 0.08 : 0.14;
        if (this.animTimer >= animInterval) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 3;
        }

        // مدیریت حالت نامرئی بعد آسیب (Invulnerability)
        if (this.isInvulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.isInvulnerable = false;
            }
        }

        // افتادن در چاله و گودال
        if (this.pos.y > 250) {
            this.kill();
        }
    }

    /**
     * سیستم تعامل تهاجمی برخورد با دشمنان (Stomp Offensive vs Hurt)
     */
    checkEnemyCollisions(enemies) {
        if (this.state === MARIO_STATES.DEAD) return;

        for (const enemy of enemies) {
            if (enemy.isDead || enemy.state === 'SQUISHED') continue;

            const marioBounds = this.getBounds();
            const enemyBounds = enemy.getBounds();

            if (
                marioBounds.pos.x < enemyBounds.pos.x + enemyBounds.size.x &&
                marioBounds.pos.x + marioBounds.size.x > enemyBounds.pos.x &&
                marioBounds.pos.y < enemyBounds.pos.y + enemyBounds.size.y &&
                marioBounds.pos.y + marioBounds.size.y > enemyBounds.pos.y
            ) {
                // آیا ماریو در حال فرود روی سر دشمن است؟
                const isStomp = this.vel.y > 0 && (this.pos.y + this.size.y - (this.vel.y * 0.016)) <= enemy.pos.y + (enemy.size.y * 0.65);

                if (isStomp) {
                    // اجرای حمله کوبشی موفق
                    enemy.stomp();
                    this.vel.y = -260; // پرش برگشتی ماریو به هوا
                    this.score += 100;
                    if (this.audio) this.audio.playStomp();
                } else {
                    // آسیب دیدن از پهلو یا زیر
                    if (!this.isInvulnerable) {
                        this.downgradeToSmall();
                    }
                }
            }
        }
    }

    render(ctx) {
        if (this.isInvulnerable && Math.floor(Date.now() / 60) % 2 === 0) {
            return; // افکت چشمک‌زن دوران شکست‌ناپذیری
        }

        ctx.save();
        ctx.translate(Math.floor(this.pos.x), Math.floor(this.pos.y));

        if (this.facing === -1) {
            ctx.scale(-1, 1);
            ctx.translate(-this.size.x, 0);
        }

        if (this.form === MARIO_FORMS.SMALL) {
            this._renderSmallMario(ctx);
        } else {
            this._renderSuperMario(ctx);
        }

        ctx.restore();
    }

    _renderSmallMario(ctx) {
        const RED = '#E72200';
        const BLUE = '#0039A6';
        const SKIN = '#FCA044';
        const BROWN = '#6C3600';

        if (this.state === MARIO_STATES.DEAD) {
            // فریم نمادین مرگ ماریو
            ctx.fillStyle = RED;
            ctx.fillRect(3, 1, 10, 4);
            ctx.fillStyle = SKIN;
            ctx.fillRect(4, 5, 8, 4);
            ctx.fillStyle = BLUE;
            ctx.fillRect(3, 9, 10, 7);
            return;
        }

        // کلاه و پیراهن قرمز
        ctx.fillStyle = RED;
        ctx.fillRect(3, 1, 9, 3);
        ctx.fillRect(2, 7, 12, 4);

        // سر و دست‌ها
        ctx.fillStyle = SKIN;
        ctx.fillRect(3, 4, 8, 3);
        ctx.fillRect(11, 4, 2, 2); // بینی
        ctx.fillRect(1, 8, 3, 3);

        // سیبیل و مو قهوه‌ای
        ctx.fillStyle = BROWN;
        ctx.fillRect(1, 4, 3, 3);
        ctx.fillRect(6, 5, 4, 2);

        // شلوار بنددار آبی
        ctx.fillStyle = BLUE;
        ctx.fillRect(4, 9, 8, 4);

        // فریم‌های حرکتی پاها
        if (this.state === MARIO_STATES.JUMPING || this.state === MARIO_STATES.FALLING) {
            ctx.fillRect(1, 13, 5, 3);
            ctx.fillRect(10, 11, 5, 3);
        } else if (this.state === MARIO_STATES.SKIDDING) {
            ctx.fillStyle = BROWN;
            ctx.fillRect(0, 13, 6, 3);
            ctx.fillRect(10, 13, 6, 3);
        } else if (this.animFrame === 1 && this.state !== MARIO_STATES.IDLE) {
            ctx.fillStyle = BROWN;
            ctx.fillRect(1, 13, 5, 3);
            ctx.fillRect(9, 13, 6, 3);
        } else {
            ctx.fillStyle = BROWN;
            ctx.fillRect(3, 13, 4, 3);
            ctx.fillRect(9, 13, 4, 3);
        }
    }

    _renderSuperMario(ctx) {
        const RED = '#E72200';
        const BLUE = '#0039A6';
        const SKIN = '#FCA044';
        const BROWN = '#6C3600';

        // کلاه بزرگ
        ctx.fillStyle = RED;
        ctx.fillRect(3, 1, 10, 4);
        ctx.fillRect(2, 3, 13, 3);

        // صورت
        ctx.fillStyle = SKIN;
        ctx.fillRect(4, 6, 9, 6);
        ctx.fillRect(13, 7, 2, 3); // بینی کشیده

        // مو و سیبیل
        ctx.fillStyle = BROWN;
        ctx.fillRect(2, 6, 4, 5);
        ctx.fillRect(8, 9, 6, 3);

        // پیراهن قرمز
        ctx.fillStyle = RED;
        ctx.fillRect(3, 12, 10, 8);
        ctx.fillRect(1, 13, 3, 6);

        // شلوار آبی دوال
        ctx.fillStyle = BLUE;
        ctx.fillRect(4, 18, 8, 8);
        ctx.fillRect(1, 22, 5, 4);
        ctx.fillRect(10, 22, 5, 4);

        // کفش‌ها
        ctx.fillStyle = BROWN;
        if (this.state === MARIO_STATES.JUMPING) {
            ctx.fillRect(0, 27, 6, 5);
            ctx.fillRect(11, 25, 5, 5);
        } else if (this.animFrame === 1 && this.state !== MARIO_STATES.IDLE) {
            ctx.fillRect(0, 28, 7, 4);
            ctx.fillRect(10, 27, 6, 5);
        } else {
            ctx.fillRect(2, 28, 5, 4);
            ctx.fillRect(9, 28, 5, 4);
        }
    }
}