/**
 * B2.st Studio - Mario Game Engine
 * Schema Definitions & Entity Validation Contracts
 * @module src/db/schema
 */

import { DATABASE_CONFIG } from '../../config/database.config.js';

/**
 * Validates entity against strict structure and data types before write operations.
 */
export class SchemaValidator {
  /**
   * Validates a SaveState object.
   * @param {Object} state 
   * @returns {{isValid: boolean, errors: string[]}}
   */
  static validateSaveState(state) {
    const errors = [];
    if (!state || typeof state !== 'object') {
      return { isValid: false, errors: ['State payload must be a non-null object.'] };
    }

    if (typeof state.slotId !== 'string' || state.slotId.trim() === '') {
      errors.push('Invalid or missing "slotId" (expected string).');
    }
    if (typeof state.world !== 'number' || state.world < 1 || state.world > 8) {
      errors.push('Invalid "world" index (must be between 1 and 8).');
    }
    if (typeof state.level !== 'number' || state.level < 1 || state.level > 4) {
      errors.push('Invalid "level" index (must be between 1 and 4).');
    }
    if (typeof state.score !== 'number' || state.score < 0) {
      errors.push('Invalid "score" value.');
    }
    if (typeof state.coins !== 'number' || state.coins < 0 || state.coins > 99) {
      errors.push('Invalid "coins" value (must be 0-99).');
    }
    if (typeof state.lives !== 'number' || state.lives < 0 || state.lives > 99) {
      errors.push('Invalid "lives" value (must be 0-99).');
    }
    if (typeof state.timeRemaining !== 'number' || state.timeRemaining < 0) {
      errors.push('Invalid "timeRemaining" value.');
    }
    if (!state.mario || typeof state.mario !== 'object') {
      errors.push('Missing "mario" state snapshot.');
    } else {
      if (typeof state.mario.x !== 'number' || typeof state.mario.y !== 'number') {
        errors.push('Mario position coordinates (x, y) must be numeric.');
      }
      if (!['SMALL', 'SUPER', 'FIRE', 'INVINCIBLE'].includes(state.mario.powerState)) {
        errors.push(`Invalid Mario power state: "${state.mario.powerState}".`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates High Score entry.
   * @param {Object} entry 
   * @returns {{isValid: boolean, errors: string[]}}
   */
  static validateHighScore(entry) {
    const errors = [];
    if (!entry || typeof entry !== 'object') {
      return { isValid: false, errors: ['High score record must be an object.'] };
    }
    if (typeof entry.playerName !== 'string' || entry.playerName.length < 1 || entry.playerName.length > 12) {
      errors.push('Player name must be between 1 and 12 characters.');
    }
    if (typeof entry.score !== 'number' || entry.score < 0 || !Number.isInteger(entry.score)) {
      errors.push('High score must be a non-negative integer.');
    }
    if (typeof entry.stage !== 'string') {
      errors.push('Stage identifier string is required (e.g., "1-1").');
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Canonical Schema Definitions for Object Stores and Indexes.
 */
export const STORE_SCHEMAS = Object.freeze([
  {
    name: DATABASE_CONFIG.STORES.MIGRATIONS,
    keyPath: 'version',
    autoIncrement: false,
    indexes: [
      { name: 'idx_applied_at', keyPath: 'appliedAt', options: { unique: false } }
    ]
  },
  {
    name: DATABASE_CONFIG.STORES.PROFILES,
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'idx_created_at', keyPath: 'createdAt', options: { unique: false } }
    ]
  },
  {
    name: DATABASE_CONFIG.STORES.SAVE_STATES,
    keyPath: 'slotId',
    autoIncrement: false,
    indexes: [
      { name: 'idx_timestamp', keyPath: 'updatedAt', options: { unique: false } },
      { name: 'idx_world_level', keyPath: ['world', 'level'], options: { unique: false } },
      { name: 'idx_score', keyPath: 'score', options: { unique: false } }
    ]
  },
  {
    name: DATABASE_CONFIG.STORES.HIGH_SCORES,
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'idx_score_desc', keyPath: 'score', options: { unique: false } },
      { name: 'idx_stage', keyPath: 'stage', options: { unique: false } },
      { name: 'idx_player', keyPath: 'playerName', options: { unique: false } }
    ]
  },
  {
    name: DATABASE_CONFIG.STORES.SETTINGS,
    keyPath: 'id',
    autoIncrement: false,
    indexes: []
  },
  {
    name: DATABASE_CONFIG.STORES.AUDIT_LOGS,
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'idx_event_type', keyPath: 'type', options: { unique: false } },
      { name: 'idx_event_timestamp', keyPath: 'timestamp', options: { unique: false } }
    ]
  }
]);