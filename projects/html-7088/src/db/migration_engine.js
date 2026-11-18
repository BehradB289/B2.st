/**
 * موتور مدیریت و اجرای خودکار میگریشن‌ها (Automated Migration Engine)
 * @module src/db/migration_engine
 */

import { DATABASE_CONFIG } from '../../config/database_config.js';
import migration001 from './migrations/001_initial_schema.js';
import migration002 from './migrations/002_add_leaderboard_and_telemetry.js';

export class MigrationEngine {
  constructor() {
    this.migrations = [migration001, migration002].sort((a, b) => a.version - b.version);
  }

  /**
   * اجرای میگریشن‌ها به شکل خطی بر اساس نسخه قدیمی و هدف
   * @param {IDBDatabase} db 
   * @param {IDBTransaction} transaction 
   * @param {number} oldVersion 
   * @param {number} newVersion 
   */
  async runMigrations(db, transaction, oldVersion, newVersion) {
    const startTime = Date.now();
    console.info(`[B2.st MigrationEngine] Running migrations: current=${oldVersion} -> target=${newVersion}`);

    for (const migration of this.migrations) {
      if (migration.version > oldVersion && migration.version <= newVersion) {
        console.info(`[B2.st MigrationEngine] Applying Migration v${migration.version}: ${migration.name}...`);
        const migrationStart = Date.now();
        
        await migration.up(db, transaction);

        const duration = Date.now() - migrationStart;
        
        // ثبت در جدول متادیتا
        if (db.objectStoreNames.contains(DATABASE_CONFIG.STORES.MIGRATIONS)) {
          const metaStore = transaction.objectStore(DATABASE_CONFIG.STORES.MIGRATIONS);
          metaStore.put({
            version: migration.version,
            name: migration.name,
            appliedAt: Date.now(),
            durationMs: duration
          });
        }
        console.info(`[B2.st MigrationEngine] Migration v${migration.version} completed in ${duration}ms.`);
      }
    }

    console.info(`[B2.st MigrationEngine] All migrations finished successfully in ${Date.now() - startTime}ms.`);
  }

  /**
   * اعتبارسنجی یکپارچگی فایل‌های میگریشن
   */
  validateSequence() {
    let prev = 0;
    for (const m of this.migrations) {
      if (m.version !== prev + 1) {
        throw new Error(`Migration sequence broken: expected ${prev + 1}, found ${m.version}`);
      }
      prev = m.version;
    }
    return true;
  }
}