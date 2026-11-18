/**
 * تعاریف رسمی مایگریشن‌های اسکیما (Migrations Registry v1 -> v2 -> v3)
 */
(function (global) {
  'use strict';

  const Config = typeof DatabaseConfig !== 'undefined'
    ? DatabaseConfig
    : (typeof require !== 'undefined' ? require('../../../config/database.config').DatabaseConfig : null);

  const migrations = [
    {
      version: 1,
      name: '001_create_initial_schema',
      description: 'ایجاد استورهای اصلی مایگریشن، پروفایل‌ها و تنظیمات بازی',
      up: async (db) => {
        // ایجاد استور تنظیمات
        if (!db.objectStoreNames.contains(Config.STORES.SETTINGS)) {
          db.createObjectStore(Config.STORES.SETTINGS, { keyPath: 'id' });
        }
        // ایجاد استور پروفایل بازیکن
        if (!db.objectStoreNames.contains(Config.STORES.PROFILES)) {
          db.createObjectStore(Config.STORES.PROFILES, { keyPath: 'profileId' });
        }
        // ایجاد استور لاگ‌های امنیتی
        if (!db.objectStoreNames.contains(Config.STORES.AUDIT_LOGS)) {
          const auditStore = db.createObjectStore(Config.STORES.AUDIT_LOGS, { keyPath: 'id', autoIncrement: true });
          auditStore.createIndex('idx_timestamp', 'timestamp', { unique: false });
        }
      }
    },
    {
      version: 2,
      name: '002_add_save_states_with_indexes',
      description: 'ایجاد استور اسلات‌های ذخیره بازی با ایندکس‌های زمانی و مرحله',
      up: async (db) => {
        if (!db.objectStoreNames.contains(Config.STORES.SAVE_STATES)) {
          const saveStore = db.createObjectStore(Config.STORES.SAVE_STATES, { keyPath: 'slotId' });
          saveStore.createIndex(Config.INDEXES.SAVE_STATES.BY_UPDATED, 'updatedAt', { unique: false });
          saveStore.createIndex(Config.INDEXES.SAVE_STATES.BY_WORLD, 'stats.world', { unique: false });
        }
      }
    },
    {
      version: 3,
      name: '003_add_high_scores_and_seeds',
      description: 'ایجاد جدول رکوردهای برتر با ایندکس امتیاز نزولی و تزریق رکوردهای پیش‌فرض NES',
      up: async (db, transaction) => {
        let scoreStore;
        if (!db.objectStoreNames.contains(Config.STORES.HIGH_SCORES)) {
          scoreStore = db.createObjectStore(Config.STORES.HIGH_SCORES, { keyPath: 'id', autoIncrement: true });
          scoreStore.createIndex(Config.INDEXES.HIGH_SCORES.BY_SCORE, 'score', { unique: false });
          scoreStore.createIndex(Config.INDEXES.HIGH_SCORES.BY_WORLD, 'world', { unique: false });
          scoreStore.createIndex(Config.INDEXES.HIGH_SCORES.BY_CREATED, 'createdAt', { unique: false });
        } else if (transaction) {
          scoreStore = transaction.objectStore(Config.STORES.HIGH_SCORES);
        }
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { migrations };
  } else {
    global.DB_MIGRATIONS = migrations;
  }
})(typeof window !== 'undefined' ? window : globalThis);