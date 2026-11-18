/**
 * پیکربندی مرکزی بازی سوپر ماریو - استودیو B2.st
 * تنظیمات موتور فیزیک، وضوح تصویر رترو NES و پارامترهای کشینگ
 */
export const GameConfig = {
    // رزولوشن اصلی NES با نسبت تصویر 4:3
    CANVAS: {
        WIDTH: 256,
        HEIGHT: 240,
        SCALE: 3,
        FPS: 60,
        FIXED_DELTA: 1 / 60
    },

    // تنظیمات جهان و کاشی‌ها
    WORLD: {
        TILE_SIZE: 16,
        GRAVITY: 980,          // پیکسل بر مجذور ثانیه
        MAX_FALL_SPEED: 420,
        FRICTION: 0.88,
        AIR_RESISTANCE: 0.94
    },

    // تنظیمات فیزیکی ماریو
    MARIO: {
        MOVE_ACCELERATION: 480,
        RUN_ACCELERATION: 750,
        MAX_WALK_SPEED: 120,
        MAX_RUN_SPEED: 190,
        JUMP_FORCE: 330,
        BOUNCE_FORCE: 220,
        INVULNERABLE_TIME: 2.0 // ثانیه
    },

    // تنظیمات دشمنان
    GOOMBA: {
        SPEED: 35,
        SQUISH_TIME: 0.5
    },

    // پارامترهای موتور کشینگ و ریت لیمیتر
    CACHE: {
        DEFAULT_TTL_MS: 15000,      // ۱۵ ثانیه عمر پیش‌فرض داده‌های کش
        PRUNE_INTERVAL_MS: 5000,    // بررسی پاکسازی خودکار
        MAX_ENTRIES: 500,
        AUDIO_RATE_LIMIT_MS: 80,    // محدودیت ارسال فرمان صوتی مشابه
        PARTICLE_RATE_LIMIT_MS: 30
    }
};