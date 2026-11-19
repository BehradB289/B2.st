/**
 * B2.st Studio - Mario Game Engine
 * Automated Database Migration Pipeline
 * @module src/db/migrations
 */

import { STORE_SCHEMAS } from './schema.js';
import { DATABASE_CONFIG } from '../../config/database.config.js';

/**
 * Migration definition interface:
 * {
 *   version: number,
 *   description: string,
 *   up: (db: IDBDatabase, transaction: IDBTransaction) => Promise<void> | void
 * }
 */
export const MIGRATIONS = [
  {
    version: 1,
    description: 'Initial schema setup: Baseline stores, save states, and system tables.',
    up: (db, transaction) => {
      // Create migration store if not present
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.MIGRATIONS)) {
        const migStore = db.createObjectStore(DATABASE_CONFIG.STORES.MIGRATIONS, { keyPath: 'version' });
        migStore.createIndex('idx_applied_at', 'appliedAt', { unique: false });
      }

      // Profiles store
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.PROFILES)) {
        const profileStore = db.createObjectStore(DATABASE_CONFIG.STORES.PROFILES, { keyPath: 'id' });
        profileStore.createIndex('idx_created_at', 'createdAt', { unique: false });
      }

      // Save states store
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.SAVE_STATES)) {
        const stateStore = db.createObjectStore(DATABASE_CONFIG.STORES.SAVE_STATES, { keyPath: 'slotId' });
        stateStore.createIndex('idx_timestamp', 'updatedAt', { unique: false });
        stateStore.createIndex('idx_score', 'score', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.SETTINGS)) {
        db.createObjectStore(DATABASE_CONFIG.STORES.SETTINGS, { keyPath: 'id' });
      }
    }
  },
  {
    version: 2,
    description: 'Add high_scores store with compound stage indexes and leaderboards.',
    up: (db, transaction) => {
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.HIGH_SCORES)) {
        const scoreStore = db.createObjectStore(DATABASE_CONFIG.STORES.HIGH_SCORES, {
          keyPath: 'id',
          autoIncrement: true
        });
        scoreStore.createIndex('idx_score_desc', 'score', { unique: false });
        scoreStore.createIndex('idx_stage', 'stage', { unique: false });
        scoreStore.createIndex('idx_player', 'playerName', { unique: false });
      }

      // Add compound index to save_states
      if (db.objectStoreNames.contains(DATABASE_CONFIG.STORES.SAVE_STATES)) {
        const stateStore = transaction.objectStore(DATABASE_CONFIG.STORES.SAVE_STATES);
        if (!stateStore.indexNames.contains('idx_world_level')) {
          stateStore.createIndex('idx_world_level', ['world', 'level'], { unique: false });
        }
      }
    }
  },
  {
    version: 3,
    description: 'Introduce security audit logging store and data integrity hashing support.',
    up: (db, transaction) => {
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.AUDIT_LOGS)) {
        const auditStore = db.createObjectStore(DATABASE_CONFIG.STORES.AUDIT_LOGS, {
          keyPath: 'id',
          autoIncrement: true
        });
        auditStore.createIndex('idx_event_type', 'type', { unique: false });
        auditStore.createIndex('idx_event_timestamp', 'timestamp', { unique: false });
      }
    }
  }
];

/**
 * Migration Runner responsible for executing migrations transactionally.
 */
export class MigrationEngine {
  /**
   * Applies all pending migrations up to targetVersion during IDB onupgradeneeded.
   * @param {IDBDatabase} db 
   * @param {IDBTransaction} transaction 
   * @param {number} oldVersion 
   * @param {number} newVersion 
   */
  static runMigrations(db, transaction, oldVersion, newVersion) {
    console.info(`[B2.st Database] Initiating Migration: v${oldVersion} -> v${newVersion}`);

    const pending = MIGRATIONS.filter(
      mig => mig.version > oldVersion && mig.version <= newVersion
    ).sort((a, b) => a.version - b.version);

    for (const step of pending) {
      console.info(`[B2.st Migration Engine] Executing v${step.version}: ${step.description}`);
      try {
        step.up(db, transaction);

        const migStore = transaction.objectStore(DATABASE_CONFIG.STORES.MIGRATIONS);
        migStore.put({
          version: step.version,
          description: step.description,
          appliedAt: new Date().toISOString(),
          status: 'SUCCESS'
        });
      } catch (error) {
        console.error(`[B2.st Migration Engine] Fatal failure in migration v${step.version}:`, error);
        throw new Error(`Database Migration Failed at version ${step.version}: ${error.message}`);
      }
    }
  }
}