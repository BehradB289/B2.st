/**
 * B2.st Studio - Mario Game Engine
 * Configuration: Database, Storage Quotas & Security Salts
 * @module config/database.config
 */

export const DATABASE_CONFIG = Object.freeze({
  NAME: 'B2ST_SUPER_MARIO_DB',
  VERSION: 3,
  STORAGE_QUOTA_ALERT_MB: 20,
  INTEGRITY_SALT: 'B2st::Engine::SecureSalt::v3.81.4429',
  STORES: Object.freeze({
    MIGRATIONS: '_migrations',
    PROFILES: 'player_profiles',
    SAVE_STATES: 'save_states',
    HIGH_SCORES: 'high_scores',
    SETTINGS: 'game_settings',
    AUDIT_LOGS: 'security_audit_logs'
  }),
  DEFAULT_PROFILE_ID: 'mario_p1_default',
  DEFAULT_SETTINGS: Object.freeze({
    id: 'active_config',
    masterVolume: 0.8,
    sfxVolume: 0.9,
    bgmVolume: 0.7,
    crtFilterEnabled: true,
    scanlines: true,
    keyBindings: {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      jump: 'Space',
      run: 'ShiftLeft',
      down: 'ArrowDown',
      pause: 'KeyP'
    },
    autoSaveIntervalMs: 15000,
    antiTamperStrict: true
  })
});