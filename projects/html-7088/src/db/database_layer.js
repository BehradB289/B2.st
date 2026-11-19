/**
 * @file database_layer.js
 * @description لایه دسترسی داده (Data Access Layer - DAL) امن، ناهمگام و شی‌گرا مبتنی بر IndexedDB
 * استودیو B2.st
 */

import { DATABASE_CONFIG } from '../../config/database.config.js';
import { DatabaseSecurity } from './security.js';
import { SchemaValidator } from './schemas.js';
import { DatabaseMigrator } from './migrator.js';

export class DatabaseLayer {
  constructor(dbName = DATABASE_CONFIG.DB_NAME, version = DATABASE_CONFIG.DB_VERSION) {
    this.dbName = dbName;
    this.version = version;
    /** @type {IDBDatabase|null} */
    this.db = null;
    this._initPromise = null;
  }

  /**
   * اتصال و راه‌اندازی پایگاه داده به صورت Singleton و کنترل چرخه‌ی Migration
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) {
      return this.db;
    }

    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' && typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB environment not found.'));
      }

      const idb = globalThis.indexedDB;
      const request = idb.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const transaction = request.transaction;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || this.version;

        DatabaseMigrator.executeMigrations(db, oldVersion, newVersion, transaction);
      };

      request.onsuccess = () => {
        this.db = request.result;
        
        // مدیریت بسته‌شدن ناگهانی دیتابیس توسط مرورگر
        this.db.onversionchange = () => {
          this.db.close();
          this.db = null;
          console.warn('[DatabaseLayer] Database connection closed due to version change.');
        };

        resolve(this.db);
      };

      request.onerror = () => {
        console.error('[DatabaseLayer] Open request failed:', request.error);
        reject(request.error);
      };

      request.onblocked = () => {
        console.warn('[DatabaseLayer] Database upgrade blocked: please close other active tabs.');
      };
    });

    return this._initPromise;
  }

  /**
   * تضمین فعال بودن اتصال به دیتابیس
   * @private
   */
  async _ensureConnected() {
    if (!this.db) {
      await this.init();
    }
  }

  /**
   * ایجاد تراکنش ایمن بر روی جدول مشخص
   * @param {string|string[]} storeNames نام جداول
   * @param {'readonly'|'readwrite'} mode نوع دسترسی
   * @returns {IDBTransaction}
   */
  _getTransaction(storeNames, mode = 'readonly') {
    return this.db.transaction(storeNames, mode);
  }

  /**
   * خواندن امن یک رکورد بر اساس شناسه با اعتبارسنجی خودکار امضا
   * @param {string} storeName نام جدول
   * @param {string|number} key کلید اولیه
   * @returns {Promise<Object|null>}
   */
  async get(storeName, key) {
    await this._ensureConnected();

    return new Promise((resolve, reject) => {
      const transaction = this._getTransaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = async () => {
        const record = request.result;
        if (!record) {
          return resolve(null);
        }

        // بررسی سلامت و عدم جعل داده
        const isHealthy = await DatabaseSecurity.verifyRecordIntegrity(record);
        if (!isHealthy) {
          console.error(`[DatabaseLayer] Security violation detected! Record in '${storeName}' with key '${key}' was tampered.`);
          this.logSecurityAlert('TAMPER_DETECTED', { storeName, key });
          return reject(new Error(`Integrity check failed for record '${key}'. Data tampering detected.`));
        }

        resolve(record);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * درج یا بروزرسانی امن داده همراه با اعتبارسنجی اسکیما و مهروموم رمزنگاری
   * @param {string} storeName نام جدول
   * @param {Object} rawData موجودیت داده
   * @returns {Promise<Object>} رکورد ذخیره شده
   */
  async put(storeName, rawData) {
    await this._ensureConnected();

    // ۱. اعتبارسنجی ساختار داده با اسکیما
    const validation = SchemaValidator.validate(storeName, rawData);
    if (!validation.valid) {
      throw new Error(`Schema validation error in '${storeName}': ${validation.errors.join(' | ')}`);
    }

    // ۲. الصاق امضای امنیتی و زمان‌بندی
    const sealedData = await DatabaseSecurity.sealRecord(rawData);

    // ۳. درج در دیتابیس به شکل ترنزکشنال
    return new Promise((resolve, reject) => {
      const transaction = this._getTransaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(sealedData);

      request.onsuccess = () => resolve(sealedData);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * حذف یک رکورد با شناسه
   * @param {string} storeName 
   * @param {string|number} key 
   * @returns {Promise<boolean>}
   */
  async delete(storeName, key) {
    await this._ensureConnected();

    return new Promise((resolve, reject) => {
      const transaction = this._getTransaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * بازیابی تمام رکوردهای یک جدول با بررسی یکپارچگی تک تک آنها
   * @param {string} storeName نام جدول
   * @returns {Promise<Array<Object>>}
   */
  async getAll(storeName) {
    await this._ensureConnected();

    return new Promise((resolve, reject) => {
      const transaction = this._getTransaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = async () => {
        const records = request.result || [];
        const verifiedRecords = [];

        for (const rec of records) {
          const isValid = await DatabaseSecurity.verifyRecordIntegrity(rec);
          if (isValid) {
            verifiedRecords.push(rec);
          } else {
            console.warn(`[DatabaseLayer] Corrupted/Tampered record excluded from results in '${storeName}'.`);
          }
        }

        resolve(verifiedRecords);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * جستجو بر اساس ایندکس اختصاصی
   * @param {string} storeName نام جدول
   * @param {string} indexName نام ایندکس
   * @param {IDBKeyRange|any} query شرط جستجو
   * @param {IDBCursorDirection} direction جهت پیمایش
   * @returns {Promise<Array<Object>>}
   */
  async queryIndex(storeName, indexName, query = null, direction = 'next') {
    await this._ensureConnected();

    return new Promise((resolve, reject) => {
      const transaction = this._getTransaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);

      request.onsuccess = async () => {
        const records = request.result || [];
        const results = [];
        for (const record of records) {
          if (await DatabaseSecurity.verifyRecordIntegrity(record)) {
            results.push(record);
          }
        }
        if (direction === 'prev') {
          results.reverse();
        }
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // =========================================================================
  // توابع تخصصی منطق بازی ماریو (Game Domain APIs)
  // =========================================================================

  /**
   * ذخیره وضعیت جاری بازی ماریو (Game State Slot)
   * @param {Object} stateData 
   */
  async saveGameState(stateData) {
    const sanitizedSlot = {
      slotId: stateData.slotId || 'slot_1',
      profileId: stateData.profileId || 'default_player',
      world: Number(stateData.world) || 1,
      stage: Number(stateData.stage) || 1,
      score: Math.max(0, Number(stateData.score) || 0),
      coins: Math.min(DATABASE_CONFIG.SECURITY.MAX_COINS, Math.max(0, Number(stateData.coins) || 0)),
      lives: Math.min(DATABASE_CONFIG.SECURITY.MAX_LIVES, Math.max(0, Number(stateData.lives) || 3)),
      powerState: ['SMALL', 'SUPER', 'FIRE', 'STAR'].includes(stateData.powerState) ? stateData.powerState : 'SMALL',
      checkpointX: Number(stateData.checkpointX) || 0,
      checkpointY: Number(stateData.checkpointY) || 0,
      updatedAt: Date.now()
    };

    return this.put(DATABASE_CONFIG.STORES.GAME_SAVES, sanitizedSlot);
  }

  /**
   * بارگذاری وضعیت بازی بر اساس شماره اسلات
   * @param {string} slotId 
   */
  async loadGameState(slotId = 'slot_1') {
    return this.get(DATABASE_CONFIG.STORES.GAME_SAVES, slotId);
  }

  /**
   * ثبت رکورد امتیاز جدید با بررسی صحت و ضدعفونی نام بازیکن
   * @param {string} profileId شناسه پروفایل
   * @param {string} playerName نام نمایشی
   * @param {number} score امتیاز کسب شده
   * @param {number} world دنیای نهایی
   * @param {number} stage مرحله نهایی
   */
  async recordHighScore(profileId, playerName, score, world = 1, stage = 1) {
    const cleanName = DatabaseSecurity.sanitizeString(playerName) || 'MARIO';
    const cleanScore = Math.max(0, Math.floor(Number(score) || 0));

    const record = {
      id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      profileId: profileId || 'player_anon',
      playerName: cleanName,
      score: cleanScore,
      world: Math.min(8, Math.max(1, world)),
      stage: Math.min(4, Math.max(1, stage)),
      timestamp: Date.now()
    };

    return this.put(DATABASE_CONFIG.STORES.HIGH_SCORES, record);
  }

  /**
   * دریافت جدول رده‌بندی برترین بازیکنان (Leaderboard) به صورت مرتب شده
   * @param {number} limit تعداد نتایج
   */
  async getTopHighScores(limit = 10) {
    const allScores = await this.getAll(DATABASE_CONFIG.STORES.HIGH_SCORES);
    return allScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * ثبت لاگ امنیتی در صورت مشاهده رفتار ناهنجار یا نفوذ
   * @param {string} type نوع رویداد
   * @param {Object} details جزئیات
   */
  async logSecurityAlert(type, details) {
    try {
      const transaction = this._getTransaction(DATABASE_CONFIG.STORES.AUDIT_LOGS, 'readwrite');
      const store = transaction.objectStore(DATABASE_CONFIG.STORES.AUDIT_LOGS);
      store.add({
        type,
        details,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('[DatabaseLayer] Failed to write audit log:', e);
    }
  }

  /**
   * بستن دیتابیس و ریست کردن کانکشن
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this._initPromise = null;
    }
  }
}

// ساخت نمونه پیش‌فرض جهت استفاده سریع در موتور بازی
export const dbLayer = new DatabaseLayer();