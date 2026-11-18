/**
 * میگریشن شماره ۱: ایجاد ساختار پایه جداول
 * @module src/db/migrations/001_initial_schema
 */

import { DATABASE_CONFIG } from '../../../config/database_config.js';

export default {
  version: 1,
  name: '001_initial_schema',
  
  /**
   * ارتقا به نسخه ۱
   * @param {IDBDatabase} db 
   * @param {IDBTransaction} transaction 
   */
  async up(db, transaction) {
    // 1. جدول متادیتای میگریشن‌ها
    if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.MIGRATIONS)) {
      db.createObjectStore(DATABASE_CONFIG.STORES.MIGRATIONS, { keyPath: 'version' });
    }

    // 2. جدول پروفایل بازیکنان
    if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.PROFILES)) {
      const profileStore = db.createObjectStore(DATABASE_CONFIG.STORES.PROFILES, { keyPath: 'id' });
      profileStore.createIndex('username_idx', 'username', { unique: true });
      profileStore.createIndex('createdAt_idx', 'createdAt', { unique: false });
    }

    // 3. جدول فایل‌های ذخیره بازی ماریو (Game Saves)
    if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.SAVES)) {
      const saveStore = db.createObjectStore(DATABASE_CONFIG.STORES.SAVES, { keyPath: 'id' });
      saveStore.createIndex('profileId_idx', 'profileId', { unique: false });
      saveStore.createIndex('slotIndex_idx', 'slotIndex', { unique: false });
      saveStore.createIndex('profile_slot_idx', ['profileId', 'slotIndex'], { unique: true });
      saveStore.createIndex('world_idx', 'world', { unique: false });
      saveStore.createIndex('updatedAt_idx', 'updatedAt', { unique: false });
    }

    // 4. جدول تنظیمات کاربری
    if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.SETTINGS)) {
      db.createObjectStore(DATABASE_CONFIG.STORES.SETTINGS, { keyPath: 'key' });
    }
  },

  /**
   * بازگردانی تغییرات نسخه ۱
   * @param {IDBDatabase} db 
   * @param {IDBTransaction} transaction 
   */
  async down(db, transaction) {
    if (db.objectStoreNames.contains(DATABASE_CONFIG.STORES.SETTINGS)) {
      db.deleteObjectStore(DATABASE_CONFIG.STORES.SETTINGS);
    }
    if (db.objectStoreNames.contains(DATABASE_CONFIG.STORES.SAVES)) {
      db.deleteObjectStore(DATABASE_CONFIG.STORES.SAVES);
    }
    if (db.objectStoreNames.contains(DATABASE_CONFIG.STORES.PROFILES)) {
      db.deleteObjectStore(DATABASE_CONFIG.STORES.PROFILES);
    }
  }
};