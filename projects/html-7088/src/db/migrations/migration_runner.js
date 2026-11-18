/**
 * رانر خودکار مایگریشن‌ها جهت اجرای متوالی ارتقای پایگاه داده با قابلیت لاگ و ردیابی
 */
(function (global) {
  'use strict';

  const Config = typeof DatabaseConfig !== 'undefined'
    ? DatabaseConfig
    : (typeof require !== 'undefined' ? require('../../../config/database.config').DatabaseConfig : null);

  const migrationsList = typeof DB_MIGRATIONS !== 'undefined'
    ? DB_MIGRATIONS
    : (typeof require !== 'undefined' ? require('./migrations').migrations : []);

  class MigrationRunner {
    constructor(dbAdapter) {
      this.dbAdapter = dbAdapter;
      this.migrations = [...migrationsList].sort((a, b) => a.version - b.version);
    }

    /**
     * بررسی و اعمال تمام مایگریشن‌های اعمال‌نشده تا نسخه هدف
     * @param {number} targetVersion 
     */
    async runPendingMigrations(dbInstance, currentVersion, transaction = null) {
      const logs = [];
      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          const startTime = Date.now();
          try {
            await migration.up(dbInstance, transaction);
            const duration = Date.now() - startTime;
            logs.push({
              version: migration.version,
              name: migration.name,
              status: 'APPLIED',
              durationMs: duration
            });
          } catch (err) {
            logs.push({
              version: migration.version,
              name: migration.name,
              status: 'FAILED',
              error: err.message
            });
            throw new Error(`شکست در اعمال مایگریشن نسخه ${migration.version} (${migration.name}): ${err.message}`);
          }
        }
      }
      return logs;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MigrationRunner };
  } else {
    global.MigrationRunner = MigrationRunner;
  }
})(typeof window !== 'undefined' ? window : globalThis);