/**
 * میگریشن شماره ۲: اضافه کردن جدول لیدربورد و لاگ‌های امنیتی
 * @module src/db/migrations/002_add_leaderboard_and_telemetry
 */

import { DATABASE_CONFIG } from '../../../config/database_config.js';

export default {
  version: 2,
  name: '002_add_leaderboard_and_telemetry',

  /**
   * ارتقا به نسخه ۲
   * @param {IDBDatabase} db 
   * @param {IDBTransaction} transaction 
   */
  async up(db, transaction) {
    // 1. ایجاد جدول تابلوی امتیازات ماریو
    if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.LEADERBOARD)) {
      const lbStore = db.createObjectStore(DATABASE_CONFIG.STORES.LEADERBOARD, { keyPath: 'id' });
      lbStore.createIndex('score_idx', 'score', { unique: false });
      lbStore.createIndex('profileId_idx', 'profileId', { unique: false });
      lbStore.createIndex('timestamp_idx', 'timestamp', { unique: false });
    }

    // 2. ایجاد جدول لاگ‌های امنیتی و ردگیری رخدادهای بازی
    if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.AUDIT_LOGS)) {
      const auditStore = db.createObjectStore(DATABASE_CONFIG.STORES.AUDIT_LOGS, { keyPath: 'id' });
      auditStore.createIndex('action_idx', 'action', { unique: false });
      auditStore.createIndex('timestamp_idx', 'timestamp', { unique: false });
    }
  },

  /**
   * بازگردانی تغییرات نسخه ۲
   * @param {IDBDatabase} db 
   * @param {IDBTransaction} transaction 
   */
  async down(db, transaction) {
    if (db.objectStoreNames.contains(DATABASE_CONFIG.STORES.AUDIT_LOGS)) {
      db.deleteObjectStore(DATABASE_CONFIG.STORES.AUDIT_LOGS);
    }
    if (db.objectStoreNames.contains(DATABASE_CONFIG.STORES.LEADERBOARD)) {
      db.deleteObjectStore(DATABASE_CONFIG.STORES.LEADERBOARD);
    }
  }
};