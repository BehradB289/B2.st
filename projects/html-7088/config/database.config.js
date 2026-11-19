/**
 * @file database.config.js
 * @description پیکربندی متمرکز لایه پایگاه داده محلی بازی سوپر ماریو (B2.st Studio)
 */

export const DATABASE_CONFIG = {
  DB_NAME: 'B2_Mario_Retro_DB',
  DB_VERSION: 3,
  
  // نام جداول (Object Stores)
  STORES: {
    PROFILES: 'profiles',
    GAME_SAVES: 'game_saves',
    HIGH_SCORES: 'high_scores',
    SETTINGS: 'settings',
    LEVEL_PROGRESS: 'level_progress',
    AUDIT_LOGS: 'audit_logs'
  },

  // تنظیمات امنیتی و اعتبارسنجی یکپارچگی داده (Anti-Cheat / Anti-Tamper)
  SECURITY: {
    ENABLE_TAMPER_PROTECTION: true,
    INTEGRITY_SALT: 'b2_retro_mario_secure_token_v3_2025',
    HASH_ALGORITHM: 'SHA-256',
    MAX_ALLOWABLE_SCORE_DELTA: 500000,
    MAX_COINS: 99,
    MAX_LIVES: 99
  },

  // محدودیت‌های سیستم
  LIMITS: {
    MAX_HIGH_SCORES_RECORDS: 100,
    MAX_SAVED_SLOTS: 5,
    QUERY_TIMEOUT_MS: 5000
  }
};