/**
 * پیکربندی مرکزی لایه داده و پایگاه‌داده استودیو B2.st
 * @module config/database_config
 */

export const DATABASE_CONFIG = Object.freeze({
  NAME: 'MarioB2_GameEngine_DB',
  VERSION: 2,
  INTEGRITY_SALT: 'B2_STUDIO_SUPER_MARIO_SALT_SECURE_2025_998244353',
  MAX_SAVE_SLOTS: 5,
  MAX_LEADERBOARD_ENTRIES: 100,
  TRANSACTION_TIMEOUT_MS: 5000,
  STORAGE_ADAPTER: 'IndexedDB',
  STORES: Object.freeze({
    PROFILES: 'profiles',
    SAVES: 'game_saves',
    SETTINGS: 'settings',
    LEADERBOARD: 'leaderboard',
    AUDIT_LOGS: 'audit_logs',
    MIGRATIONS: '_migrations_meta'
  }),
  DEFAULT_SETTINGS: Object.freeze({
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.7,
    crtShaderEnabled: true,
    pixelScale: 3,
    controlLayout: 'retro_classic',
    debugOverlay: false
  })
});