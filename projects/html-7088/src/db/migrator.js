/**
 * @file migrator.js
 * @description سیستم مهاجرت خودکار (Automated Migration Engine) و ارتقای متوالی نسخ دیتابیس
 */

import { DATABASE_CONFIG } from '../../config/database.config.js';

/**
 * لیست تمامی مایگریشن‌های سیستم به صورت ترتیبی و گام‌به‌گام
 */
export const MIGRATIONS = [
  {
    version: 1,
    description: 'Initial schema setup: profiles, high scores, and user settings.',
    /**
     * @param {IDBDatabase} db مرجع دیتابیس
     */
    up(db) {
      // 1. جدول پروفایل بازیکنان
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.PROFILES)) {
        const profileStore = db.createObjectStore(DATABASE_CONFIG.STORES.PROFILES, { keyPath: 'id' });
        profileStore.createIndex('by_username', 'username', { unique: false });
        profileStore.createIndex('by_lastActive', 'lastActive', { unique: false });
      }

      // 2. جدول رکوردهای برتر (High Scores)
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.HIGH_SCORES)) {
        const scoreStore = db.createObjectStore(DATABASE_CONFIG.STORES.HIGH_SCORES, { keyPath: 'id' });
        scoreStore.createIndex('by_score', 'score', { unique: false });
        scoreStore.createIndex('by_profile', 'profileId', { unique: false });
        scoreStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }

      // 3. جدول تنظیمات کاربری و نگاشت کلیدهای NES
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.SETTINGS)) {
        db.createObjectStore(DATABASE_CONFIG.STORES.SETTINGS, { keyPath: 'id' });
      }
    }
  },

  {
    version: 2,
    description: 'Add game saves store with slot management and checkpoint indices.',
    /**
     * @param {IDBDatabase} db مرجع دیتابیس
     */
    up(db) {
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.GAME_SAVES)) {
        const savesStore = db.createObjectStore(DATABASE_CONFIG.STORES.GAME_SAVES, { keyPath: 'slotId' });
        savesStore.createIndex('by_profile', 'profileId', { unique: false });
        savesStore.createIndex('by_updatedAt', 'updatedAt', { unique: false });
      }
    }
  },

  {
    version: 3,
    description: 'Introduce level progress tracking and security audit log table.',
    /**
     * @param {IDBDatabase} db مرجع دیتابیس
     */
    up(db) {
      // پیشرفت مراحل
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.LEVEL_PROGRESS)) {
        const progressStore = db.createObjectStore(DATABASE_CONFIG.STORES.LEVEL_PROGRESS, { keyPath: 'id' });
        progressStore.createIndex('by_profile', 'profileId', { unique: false });
        progressStore.createIndex('by_world_stage', ['world', 'stage'], { unique: false });
      }

      // جدول تاریخچه امنیتی جهت ره‌گیری دستکاری‌ها و خطاهای لاگین
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.AUDIT_LOGS)) {
        const auditStore = db.createObjectStore(DATABASE_CONFIG.STORES.AUDIT_LOGS, {
          keyPath: 'id',
          autoIncrement: true
        });
        auditStore.createIndex('by_type', 'type', { unique: false });
        auditStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
    }
  }
];

export class DatabaseMigrator {
  /**
   * اجرای زنجیره مایگریشن‌ها در هنگام باز شدن پایگاه‌داده
   * @param {IDBDatabase} db 
   * @param {number} oldVersion نسخه قبلی ذخیره شده
   * @param {number} newVersion نسخه جدید مورد نظر
   * @param {IDBTransaction} transaction تراکنش جاری
   */
  static executeMigrations(db, oldVersion, newVersion, transaction) {
    console.info(`[DatabaseMigrator] Migrating database from v${oldVersion} to v${newVersion}...`);

    for (const migration of MIGRATIONS) {
      if (migration.version > oldVersion && migration.version <= newVersion) {
        console.log(`[DatabaseMigrator] Applying Migration v${migration.version}: ${migration.description}`);
        try {
          migration.up(db, transaction);
        } catch (error) {
          console.error(`[DatabaseMigrator] Migration v${migration.version} failed:`, error);
          throw new Error(`Failed to apply migration v${migration.version}: ${error.message}`);
        }
      }
    }

    console.info(`[DatabaseMigrator] All migrations executed successfully.`);
  }
}