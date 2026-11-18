/**
 * پیکربندی مرکزی لایه دیتابیس بازی ماریو استودیو B2.st
 * تنظیمات نسخه‌بندی، مخازن داده، کلیدهای اعتبارسنجی و سیاست‌های امنیتی
 */
(function (global) {
  'use strict';

  const DatabaseConfig = Object.freeze({
    // اطلاعات اتصال
    NAME: 'B2st_MarioRetroDB_v1',
    VERSION: 3,

    // اسامی استورها (Stores) در دیتابیس
    STORES: Object.freeze({
      MIGRATIONS: '_migrations',
      SETTINGS: 'player_settings',
      PROFILES: 'player_profiles',
      SAVE_STATES: 'save_states',
      HIGH_SCORES: 'high_scores',
      AUDIT_LOGS: 'security_audit_logs'
    }),

    // نمایه یا ایندکس‌های کلیدی
    INDEXES: Object.freeze({
      SAVE_STATES: {
        BY_UPDATED: 'idx_updatedAt',
        BY_WORLD: 'idx_worldLevel',
        BY_SLOT: 'idx_slotId'
      },
      HIGH_SCORES: {
        BY_SCORE: 'idx_score',
        BY_WORLD: 'idx_world',
        BY_CREATED: 'idx_createdAt'
      }
    }),

    // پیکربندی لایه امنیتی و رمزنگاری داده‌ها (Anti-Tamper)
    SECURITY: Object.freeze({
      ALGORITHM: 'HMAC-SHA256',
      SECRET_SALT: 'B2ST_STUDIO_RETRO_MARIO_SECRET_SALT_2025_SECURE_TOKEN',
      STRICT_VERIFICATION: true, // رد داده‌های دستکاری‌شده در صورت عدم تطابق امضا
      MAX_NAME_LENGTH: 12,
      SANIZATION_REGEX: /[^A-Z0-9_\-\s]/gi
    }),

    // مقادیر پیش‌فرض تنظیمات بازیکن
    DEFAULT_SETTINGS: Object.freeze({
      id: 'active_profile_settings',
      masterVolume: 0.8,
      sfxVolume: 0.9,
      bgmVolume: 0.6,
      crtScanlines: true,
      screenScale: 'fit', // 'fit' | 'pixel-perfect' | 'stretch'
      keyBindings: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'Space',
        sprint: 'ShiftLeft',
        duck: 'ArrowDown',
        pause: 'KeyP'
      },
      updatedAt: new Date().toISOString()
    })
  });

  // پشتیبانی دوگانه برای محیط مرورگر و Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DatabaseConfig };
  } else {
    global.DatabaseConfig = DatabaseConfig;
  }
})(typeof window !== 'undefined' ? window : globalThis);