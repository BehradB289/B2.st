/**
 * B2.st Mario Retro Game Engine - Database Configuration
 * Version: 3.0.0
 * Architecture: Modular OOP & ECS Data Access Layer
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MarioDbConfig = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  const DB_CONFIG = Object.freeze({
    name: 'B2_MARIO_RETRO_DB',
    version: 3,
    environment: typeof window !== 'undefined' ? 'browser' : 'node',
    
    // Store configurations and indexed search keys
    stores: {
      profiles: {
        keyPath: 'id',
        autoIncrement: false,
        indexes: [
          { name: 'by_username', keyPath: 'username', unique: true },
          { name: 'by_updatedAt', keyPath: 'updatedAt', unique: false }
        ]
      },
      save_states: {
        keyPath: 'id',
        autoIncrement: false,
        indexes: [
          { name: 'by_profileId', keyPath: 'profileId', unique: false },
          { name: 'by_slot', keyPath: ['profileId', 'slot'], unique: true },
          { name: 'by_timestamp', keyPath: 'timestamp', unique: false }
        ]
      },
      high_scores: {
        keyPath: 'id',
        autoIncrement: false,
        indexes: [
          { name: 'by_score', keyPath: 'score', unique: false },
          { name: 'by_profileId', keyPath: 'profileId', unique: false },
          { name: 'by_world', keyPath: 'world', unique: false }
        ]
      },
      settings: {
        keyPath: 'id',
        autoIncrement: false,
        indexes: []
      },
      audit_log: {
        keyPath: 'id',
        autoIncrement: false,
        indexes: [
          { name: 'by_timestamp', keyPath: 'timestamp', unique: false },
          { name: 'by_event', keyPath: 'event', unique: false }
        ]
      },
      migrations_history: {
        keyPath: 'version',
        autoIncrement: false,
        indexes: [
          { name: 'by_appliedAt', keyPath: 'appliedAt', unique: false }
        ]
      }
    },

    // Security & Data Integrity Constraints
    security: {
      integritySalt: 'B2_RETRO_MARIO_SECURITY_SALT_2025_#9842A',
      maxSaveSlotsPerProfile: 5,
      maxLeaderboardRows: 100,
      sanitizeInput: true,
      maxUsernameLength: 20,
      minUsernameLength: 2,
      maxAuditEntries: 500
    },

    // Game Default NES Configuration
    defaultSettings: {
      id: 'system_settings',
      masterVolume: 80,
      bgmVolume: 70,
      sfxVolume: 90,
      crtFilter: true,
      scanlines: true,
      curvature: false,
      fpsLimit: 60,
      keybindings: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        down: 'ArrowDown',
        jump: 'KeyZ',
        run: 'KeyX',
        pause: 'KeyP',
        altJump: 'Space',
        altRun: 'ShiftLeft'
      },
      updatedAt: Date.now()
    }
  });

  return { DB_CONFIG };
});