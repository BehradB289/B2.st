/**
 * لایه دسترسی امن به داده (Data Access Layer & Transaction Manager)
 * پیاده‌سازی کامل الگوهای مخزن، تراکنش امن و امضای ضد تقلب استودیو B2.st
 * @module src/db/database_layer
 */

import { DATABASE_CONFIG } from '../../config/database_config.js';
import { CryptoSecurity } from './crypto.js';
import { Schemas } from './schema.js';
import { MigrationEngine } from './migration_engine.js';

export class DatabaseLayer {
  /**
   * مقداردهی اولیه به صورت Singleton
   */
  constructor() {
    if (DatabaseLayer._instance) {
      return DatabaseLayer._instance;
    }
    this.db = null;
    this.migrationEngine = new MigrationEngine();
    this.isOpen = false;
    this.migrationEngine.validateSequence();
    DatabaseLayer._instance = this;
  }

  /**
   * باز کردن اتصال به پایگاه‌داده و مدیریت خودکار Migrationها
   * @returns {Promise<DatabaseLayer>}
   */
  async initialize() {
    if (this.isOpen && this.db) {
      return this;
    }

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB is not supported in this runtime environment.'));
      }

      const request = indexedDB.open(DATABASE_CONFIG.NAME, DATABASE_CONFIG.VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const transaction = event.target.transaction;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || DATABASE_CONFIG.VERSION;

        this.migrationEngine.runMigrations(db, transaction, oldVersion, newVersion)
          .catch(err => {
            console.error('[DatabaseLayer] Migration failed fatally:', err);
            transaction.abort();
          });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isOpen = true;

        this.db.onversionchange = () => {
          this.close();
          console.warn('[DatabaseLayer] Database connection closed due to concurrent version change.');
        };

        this.db.onerror = (errEvent) => {
          console.error('[DatabaseLayer] Global DB Error:', errEvent.target.error);
        };

        // اعمال مقادیر اولیه در اولین بارگذاری
        this._seedDefaults().then(() => resolve(this)).catch(reject);
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to open IndexedDB: ${event.target.error?.message || 'Unknown error'}`));
      };

      request.onblocked = () => {
        console.warn('[DatabaseLayer] Database open blocked. Please close open tabs of this game.');
      };
    });
  }

  /**
   * بستن ارتباط با پایگاه‌داده
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isOpen = false;
    }
  }

  /**
   * اجرای یک تراکنش مدیریت‌شده و ایزوله
   * @param {string|string[]} storeNames 
   * @param {'readonly'|'readwrite'} mode 
   * @param {Function} operation 
   * @returns {Promise<any>}
   */
  async executeTransaction(storeNames, mode, operation) {
    await this._ensureConnection();
    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];

    return new Promise((resolve, reject) => {
      let isCompleted = false;
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          tx.abort();
          reject(new Error(`Transaction timed out after ${DATABASE_CONFIG.TRANSACTION_TIMEOUT_MS}ms`));
        }
      }, DATABASE_CONFIG.TRANSACTION_TIMEOUT_MS);

      const tx = this.db.transaction(stores, mode);

      tx.oncomplete = () => {
        isCompleted = true;
        clearTimeout(timeoutId);
      };

      tx.onerror = (event) => {
        isCompleted = true;
        clearTimeout(timeoutId);
        reject(new Error(`Transaction Error: ${event.target.error?.message}`));
      };

      tx.onabort = (event) => {
        isCompleted = true;
        clearTimeout(timeoutId);
        reject(new Error(`Transaction Aborted: ${event.target.error?.message || 'Aborted'}`));
      };

      Promise.resolve()
        .then(() => operation(tx))
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          try { tx.abort(); } catch (_) {}
          reject(err);
        });
    });
  }

  /**
   * خواندن یک رکورد بر اساس شناسه به همراه سنجش اصالت و امضا
   * @param {string} storeName 
   * @param {IDBValidKey} key 
   * @param {boolean} [verifyIntegrity=true] 
   * @returns {Promise<any|null>}
   */
  async get(storeName, key, verifyIntegrity = true) {
    return this.executeTransaction(storeName, 'readonly', async (tx) => {
      const store = tx.objectStore(storeName);
      return new Promise((res, rej) => {
        const req = store.get(key);
        req.onsuccess = async () => {
          const record = req.result;
          if (!record) return res(null);

          if (verifyIntegrity && record.checksum) {
            const isValid = await CryptoSecurity.verifyRecordIntegrity(record);
            if (!isValid) {
              await this._recordAudit('TAMPER_DETECTED', { store: storeName, key });
              return rej(new Error(`SecurityViolation: Data tampering detected in store '${storeName}' for key '${key}'. Record rejected.`));
            }
          }
          res(record);
        };
        req.onerror = () => rej(req.error);
      });
    });
  }

  /**
   * درج یا به‌روزرسانی امن رکورد همراه با اعتبارسنجی اسک Schema و الصاق امضای دیجیتال
   * @param {string} storeName 
   * @param {Object} record 
   * @param {boolean} [sign=true] 
   * @returns {Promise<Object>}
   */
  async put(storeName, record, sign = true) {
    const schema = this._getSchemaForStore(storeName);
    if (schema) {
      schema.validate(record);
    }

    const payload = sign ? await CryptoSecurity.signRecord(record) : { ...record };

    return this.executeTransaction(storeName, 'readwrite', (tx) => {
      const store = tx.objectStore(storeName);
      return new Promise((res, rej) => {
        const req = store.put(payload);
        req.onsuccess = () => res(payload);
        req.onerror = () => rej(req.error);
      });
    });
  }

  /**
   * حذف رکورد
   * @param {string} storeName 
   * @param {IDBValidKey} key 
   * @returns {Promise<boolean>}
   */
  async delete(storeName, key) {
    return this.executeTransaction(storeName, 'readwrite', (tx) => {
      const store = tx.objectStore(storeName);
      return new Promise((res, rej) => {
        const req = store.delete(key);
        req.onsuccess = () => res(true);
        req.onerror = () => rej(req.error);
      });
    });
  }

  /**
   * استخراج تمامی رکوردهای یک Store
   * @param {string} storeName 
   * @returns {Promise<Array>}
   */
  async getAll(storeName) {
    return this.executeTransaction(storeName, 'readonly', (tx) => {
      const store = tx.objectStore(storeName);
      return new Promise((res, rej) => {
        const req = store.getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
    });
  }

  /**
   * جستجو در ایندکس با قابلیت صفحه‌بندی و جهت
   * @param {string} storeName 
   * @param {string} indexName 
   * @param {IDBKeyRange} [range=null] 
   * @param {'next'|'prev'} [direction='next'] 
   * @param {number} [limit=100] 
   * @returns {Promise<Array>}
   */
  async queryIndex(storeName, indexName, range = null, direction = 'next', limit = 100) {
    return this.executeTransaction(storeName, 'readonly', (tx) => {
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const results = [];

      return new Promise((res, rej) => {
        const req = index.openCursor(range, direction);
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            res(results);
          }
        };
        req.onerror = () => rej(req.error);
      });
    });
  }

  /**
   * تخلیه کامل یک جدول
   * @param {string} storeName 
   * @returns {Promise<boolean>}
   */
  async clearStore(storeName) {
    return this.executeTransaction(storeName, 'readwrite', (tx) => {
      const store = tx.objectStore(storeName);
      return new Promise((res, rej) => {
        const req = store.clear();
        req.onsuccess = () => res(true);
        req.onerror = () => rej(req.error);
      });
    });
  }

  /**
   * پشتیبان‌گیری کامل از داده‌های بازی در قالب ساختار JSON امن
   * @returns {Promise<string>}
   */
  async exportFullSnapshot() {
    const stores = [
      DATABASE_CONFIG.STORES.PROFILES,
      DATABASE_CONFIG.STORES.SAVES,
      DATABASE_CONFIG.STORES.SETTINGS,
      DATABASE_CONFIG.STORES.LEADERBOARD
    ];

    const snapshot = {
      engine: 'B2.st Super Mario',
      version: DATABASE_CONFIG.VERSION,
      exportedAt: Date.now(),
      data: {}
    };

    for (const store of stores) {
      snapshot.data[store] = await this.getAll(store);
    }

    const payloadString = JSON.stringify(snapshot);
    const checksum = await CryptoSecurity.generateChecksum(payloadString);
    return JSON.stringify({ snapshot, checksum });
  }

  /**
   * بازگردانی داده‌ها از فایل پشتیبان همراه با کنترل صحت
   * @param {string} jsonDump 
   * @returns {Promise<boolean>}
   */
  async importFullSnapshot(jsonDump) {
    const parsed = JSON.parse(jsonDump);
    if (!parsed.snapshot || !parsed.checksum) {
      throw new Error('Invalid backup file format.');
    }

    const isValid = (await CryptoSecurity.generateChecksum(JSON.stringify(parsed.snapshot))) === parsed.checksum;
    if (!isValid) {
      throw new Error('Snapshot integrity check failed. The file may be modified or corrupted.');
    }

    const data = parsed.snapshot.data;
    for (const [storeName, records] of Object.entries(data)) {
      if (this.db.objectStoreNames.contains(storeName)) {
        await this.clearStore(storeName);
        for (const item of records) {
          await this.put(storeName, item, false);
        }
      }
    }
    return true;
  }

  /**
   * ثبت رخداد حسابرسی امنیتی
   * @private
   */
  async _recordAudit(action, metadata = {}) {
    try {
      if (!this.db || !this.db.objectStoreNames.contains(DATABASE_CONFIG.STORES.AUDIT_LOGS)) return;
      const logEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        action,
        metadata,
        timestamp: Date.now()
      };
      await this.put(DATABASE_CONFIG.STORES.AUDIT_LOGS, logEntry, false);
    } catch (e) {
      console.warn('[DatabaseLayer] Could not record audit log:', e);
    }
  }

  /**
   * بارگذاری پیش‌فرض تنظیمات در اولین لود
   * @private
   */
  async _seedDefaults() {
    const settings = await this.getAll(DATABASE_CONFIG.STORES.SETTINGS);
    if (settings.length === 0) {
      for (const [key, value] of Object.entries(DATABASE_CONFIG.DEFAULT_SETTINGS)) {
        await this.put(DATABASE_CONFIG.STORES.SETTINGS, { key, value }, false);
      }
    }
  }

  /**
   * بازیابی شماتیک بر اساس نام ObjectStore
   * @private
   */
  _getSchemaForStore(storeName) {
    for (const schema of Object.values(Schemas)) {
      if (schema.storeName === storeName) return schema;
    }
    return null;
  }

  /**
   * اطمینان از آماده بودن اتصال دیتابیس
   * @private
   */
  async _ensureConnection() {
    if (!this.isOpen || !this.db) {
      await this.initialize();
    }
  }
}