/**
 * تعاریف اسکیما (Schema Contracts) و اعتبارسنجی رکوردها
 * @module src/db/schema
 */

import { DATABASE_CONFIG } from '../../config/database_config.js';

export const Schemas = Object.freeze({
  /**
   * اسکیمای پروفایل بازیکن
   */
  Profile: {
    name: 'Profile',
    storeName: DATABASE_CONFIG.STORES.PROFILES,
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'username_idx', keyPath: 'username', options: { unique: true } },
      { name: 'createdAt_idx', keyPath: 'createdAt', options: { unique: false } }
    ],
    validate(data) {
      if (!data.id || typeof data.id !== 'string') throw new Error('SchemaValidationError: profile.id must be a non-empty string.');
      if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 2) {
        throw new Error('SchemaValidationError: profile.username must be at least 2 characters.');
      }
      if (typeof data.createdAt !== 'number') throw new Error('SchemaValidationError: profile.createdAt must be an epoch timestamp.');
      return true;
    }
  },

  /**
   * اسکیمای ذخیره‌سازی وضعیت بازی ماریو (Save State)
   */
  GameSave: {
    name: 'GameSave',
    storeName: DATABASE_CONFIG.STORES.SAVES,
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'profileId_idx', keyPath: 'profileId', options: { unique: false } },
      { name: 'slotIndex_idx', keyPath: 'slotIndex', options: { unique: false } },
      { name: 'profile_slot_idx', keyPath: ['profileId', 'slotIndex'], options: { unique: true } },
      { name: 'world_idx', keyPath: 'world', options: { unique: false } },
      { name: 'updatedAt_idx', keyPath: 'updatedAt', options: { unique: false } }
    ],
    validate(data) {
      if (!data.id || typeof data.id !== 'string') throw new Error('GameSave: id is required.');
      if (!data.profileId || typeof data.profileId !== 'string') throw new Error('GameSave: profileId is required.');
      if (typeof data.slotIndex !== 'number' || data.slotIndex < 0 || data.slotIndex >= DATABASE_CONFIG.MAX_SAVE_SLOTS) {
        throw new Error(`GameSave: slotIndex must be between 0 and ${DATABASE_CONFIG.MAX_SAVE_SLOTS - 1}.`);
      }
      if (typeof data.world !== 'number' || data.world < 1) throw new Error('GameSave: world must be a positive integer.');
      if (typeof data.level !== 'number' || data.level < 1) throw new Error('GameSave: level must be a positive integer.');
      if (typeof data.lives !== 'number' || data.lives < 0) throw new Error('GameSave: lives cannot be negative.');
      if (typeof data.coins !== 'number' || data.coins < 0) throw new Error('GameSave: coins cannot be negative.');
      if (typeof data.score !== 'number' || data.score < 0) throw new Error('GameSave: score cannot be negative.');
      if (!['small', 'super', 'fire', 'invincible'].includes(data.marioState)) {
        throw new Error(`GameSave: invalid marioState '${data.marioState}'.`);
      }
      if (typeof data.checkpointX !== 'number' || typeof data.checkpointY !== 'number') {
        throw new Error('GameSave: checkpoint coords must be valid numbers.');
      }
      return true;
    }
  },

  /**
   * اسکیمای جدول برترین امتیازات (Leaderboard)
   */
  Leaderboard: {
    name: 'Leaderboard',
    storeName: DATABASE_CONFIG.STORES.LEADERBOARD,
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'score_idx', keyPath: 'score', options: { unique: false } },
      { name: 'profileId_idx', keyPath: 'profileId', options: { unique: false } },
      { name: 'timestamp_idx', keyPath: 'timestamp', options: { unique: false } }
    ],
    validate(data) {
      if (!data.id || typeof data.id !== 'string') throw new Error('Leaderboard: id is required.');
      if (typeof data.score !== 'number' || data.score < 0) throw new Error('Leaderboard: valid score required.');
      if (!data.playerName || typeof data.playerName !== 'string') throw new Error('Leaderboard: playerName is required.');
      if (typeof data.timestamp !== 'number') throw new Error('Leaderboard: timestamp is required.');
      return true;
    }
  },

  /**
   * اسکیمای تنظیمات بازی
   */
  Setting: {
    name: 'Setting',
    storeName: DATABASE_CONFIG.STORES.SETTINGS,
    keyPath: 'key',
    autoIncrement: false,
    indexes: [],
    validate(data) {
      if (!data.key || typeof data.key !== 'string') throw new Error('Setting: key is required.');
      if (data.value === undefined) throw new Error('Setting: value cannot be undefined.');
      return true;
    }
  },

  /**
   * اسکیمای لاگ‌های حسابرسی امنیتی و تاریخچه تراکنش‌ها
   */
  AuditLog: {
    name: 'AuditLog',
    storeName: DATABASE_CONFIG.STORES.AUDIT_LOGS,
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'action_idx', keyPath: 'action', options: { unique: false } },
      { name: 'timestamp_idx', keyPath: 'timestamp', options: { unique: false } }
    ],
    validate(data) {
      if (!data.id) throw new Error('AuditLog: id is required.');
      if (!data.action) throw new Error('AuditLog: action is required.');
      return true;
    }
  }
});