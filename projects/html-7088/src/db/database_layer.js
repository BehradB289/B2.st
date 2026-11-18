/**
 * لایه امنیتی و یکپارچه پایگاه داده (Enterprise Mario Data Access Layer)
 * مدیریت ارتباط با IndexedDB با Fallback خودکار به حافظه در تست‌ها،
 * اجرای مایگریشن‌های خودکار، امضای اعتبارسنجی ضد تقلب (Anti-Tamper) و سرویس‌های CRUD.
 */
(function (global) {
  'use strict';

  const Config = typeof DatabaseConfig !== 'undefined' 
    ? DatabaseConfig 
    : (typeof require !== 'undefined' ? require('../../config/database.config').DatabaseConfig : null);

  const Vault = typeof CryptoVault !== 'undefined'
    ? CryptoVault
    : (typeof require !== 'undefined' ? require('./security/crypto_vault').CryptoVault : null);

  const Runner = typeof MigrationRunner !== 'undefined'
    ? MigrationRunner
    : (typeof require !== 'undefined' ? require('./migrations/migration_runner').MigrationRunner : null);

  const SaveModel = typeof SaveStateModel !== 'undefined'
    ? SaveStateModel
    : (typeof require !== 'undefined' ? require('./models/save_state_model').SaveStateModel : null);

  const ScoreModel = typeof HighScoreModel !== 'undefined'
    ? HighScoreModel
    : (typeof require !== 'undefined' ? require('./models/high_score_model').HighScoreModel : null);

  const SettingsModelClass = typeof SettingsModel !== 'undefined'
    ? SettingsModel
    : (typeof require !== 'undefined' ? require('./models/settings_model').SettingsModel : null);

  // آداپتور ذخیره‌سازی در حافظه (Memory Storage Adapter) ویژه محیط بدون ایندکس‌دی‌بی نظیر تست‌های Node.js
  class MemoryStorageDriver {
    constructor() {
      this.stores = new Map();
      this.objectStoreNames = {
        contains: (name) => this.stores.has(name)
      };
    }
    createObjectStore(name) {
      if (!this.stores.has(name)) {
        this.stores.set(name, new Map());
      }
      return {
        createIndex: () => {}
      };
    }
    async get(storeName, key) {
      const store = this.stores.get(storeName);
      if (!store) return null;
      const val = store.get(key);
      return val ? JSON.parse(JSON.stringify(val)) : null;
    }
    async put(storeName, key, value) {
      if (!this.stores.has(storeName)) {
        this.stores.set(storeName, new Map());
      }
      const store = this.stores.get(storeName);
      const clone = JSON.parse(JSON.stringify(value));
      store.set(key, clone);
      return key;
    }
    async getAll(storeName) {
      const store = this.stores.get(storeName);
      if (!store) return [];
      return Array.from(store.values()).map(v => JSON.parse(JSON.stringify(v)));
    }
    async delete(storeName, key) {
      const store = this.stores.get(storeName);
      if (!store) return false;
      return store.delete(key);
    }
    async clear(storeName) {
      const store = this.stores.get(storeName);
      if (store) store.clear();
    }
  }

  class DatabaseLayer {
    constructor(customOptions = {}) {
      this.dbName = customOptions.dbName || Config.NAME;
      this.version = customOptions.version || Config.VERSION;
      this.secretSalt = customOptions.salt || Config.SECURITY.SECRET_SALT;
      this.db = null;
      this.isMemoryDriver = false;
      this.memoryDriver = null;
      this.migrationRunner = new Runner(this);

      // اتصال ریپازیتوری‌ها
      this.saveStates = new SaveStateRepository(this);
      this.highScores = new HighScoreRepository(this);
      this.settings = new SettingsRepository(this);
    }

    /**
     * راه‌اندازی ارتباط و اعمال مایگریشن‌های خودکار در هنگام بوت
     */
    async initialize() {
      if (typeof window !== 'undefined' && window.indexedDB) {
        return this._initIndexedDB();
      } else {
        return this._initMemoryDB();
      }
    }

    _initIndexedDB() {
      return new Promise((resolve, reject) => {
        const req = window.indexedDB.open(this.dbName, this.version);

        req.onupgradeneeded = async (event) => {
          const dbInstance = event.target.result;
          const oldVer = event.oldVersion;
          const transaction = event.target.transaction;
          try {
            await this.migrationRunner.runPendingMigrations(dbInstance, oldVer, transaction);
          } catch (err) {
            console.error('[DatabaseLayer] ارور هنگام ارتقای اسکیما:', err);
          }
        };

        req.onsuccess = async (event) => {
          this.db = event.target.result;
          await this._seedInitialData();
          resolve(this);
        };

        req.onerror = (event) => {
          reject(new Error(`خطای باز کردن IndexedDB: ${event.target.error?.message}`));
        };
      });
    }

    async _initMemoryDB() {
      this.isMemoryDriver = true;
      this.memoryDriver = new MemoryStorageDriver();
      await this.migrationRunner.runPendingMigrations(this.memoryDriver, 0);
      await this._seedInitialData();
      return this;
    }

    async _seedInitialData() {
      // بررسی و ذخیره تنظیمات پیش‌فرض
      const curSettings = await this.settings.get();
      if (!curSettings) {
        const defaultSettings = new SettingsModelClass();
        defaultSettings.sign(this.secretSalt);
        await this.settings.save(defaultSettings);
      }

      // تزریق رکوردهای کلاسیک تابلوی امتیازات در صورت خالی بودن
      const topScores = await this.highScores.getTop(1);
      if (topScores.length === 0) {
        const seedScores = [
          { playerName: 'B2ST', score: 15400, coins: 64, world: '1-4', timeRemaining: 182 },
          { playerName: 'MARIO', score: 12800, coins: 48, world: '1-3', timeRemaining: 150 },
          { playerName: 'LUIGI', score: 9200, coins: 33, world: '1-2', timeRemaining: 120 },
          { playerName: 'PEACH', score: 6500, coins: 21, world: '1-1', timeRemaining: 95 }
        ];
        for (const s of seedScores) {
          const record = new ScoreModel(s);
          record.sign(this.secretSalt);
          await this.highScores.record(record);
        }
      }
    }

    // متدهای عمومی سطح پایین خواندن و نوشتن تراکنش‌ها
    async getRaw(storeName, key) {
      if (this.isMemoryDriver) {
        return this.memoryDriver.get(storeName, key);
      }
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    }

    async putRaw(storeName, value, optionalKey = null) {
      if (this.isMemoryDriver) {
        const key = optionalKey !== null ? optionalKey : (value.id || value.slotId || Date.now());
        await this.memoryDriver.put(storeName, key, value);
        return key;
      }
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = optionalKey !== null ? store.put(value, optionalKey) : store.put(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async getAllRaw(storeName) {
      if (this.isMemoryDriver) {
        return this.memoryDriver.getAll(storeName);
      }
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    }

    async deleteRaw(storeName, key) {
      if (this.isMemoryDriver) {
        return this.memoryDriver.delete(storeName, key);
      }
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    }

    async clearStore(storeName) {
      if (this.isMemoryDriver) {
        return this.memoryDriver.clear(storeName);
      }
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    }

    /**
     * خروجی کامل پشتیبان داده‌ها به همراه امضای اصالت کلی سیستم (Encrypted Export)
     */
    async exportBackup() {
      const backupData = {
        meta: {
          app: 'B2st Mario Game',
          version: this.version,
          exportedAt: new Date().toISOString()
        },
        settings: await this.getAllRaw(Config.STORES.SETTINGS),
        saveStates: await this.getAllRaw(Config.STORES.SAVE_STATES),
        highScores: await this.getAllRaw(Config.STORES.HIGH_SCORES)
      };
      const signature = Vault.sign(backupData, this.secretSalt);
      return JSON.stringify({ ...backupData, masterSignature: signature }, null, 2);
    }

    /**
     * بازیابی فایل پشتیبان با تایید اعتبار و هش جامع ضد دستکاری
     */
    async importBackup(jsonString) {
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (e) {
        throw new Error('قالب فایل پشتیبان نامعتبر است (JSON Parsing Error).');
      }

      const { masterSignature, ...payload } = parsed;
      if (!masterSignature || !Vault.verify(payload, masterSignature, this.secretSalt)) {
        throw new Error('رد صلاحیت امنیتی: فایل پشتیبان مخدوش یا دستکاری شده است!');
      }

      // بازنشانی داده‌ها
      await this.clearStore(Config.STORES.SETTINGS);
      for (const s of payload.settings || []) await this.putRaw(Config.STORES.SETTINGS, s);

      await this.clearStore(Config.STORES.SAVE_STATES);
      for (const st of payload.saveStates || []) await this.putRaw(Config.STORES.SAVE_STATES, st);

      await this.clearStore(Config.STORES.HIGH_SCORES);
      for (const sc of payload.highScores || []) await this.putRaw(Config.STORES.HIGH_SCORES, sc);

      return true;
    }

    close() {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
    }
  }

  // --- ریپازیتوری‌های تخصصی استورها ---

  class SaveStateRepository {
    constructor(dbLayer) {
      this.db = dbLayer;
      this.storeName = Config.STORES.SAVE_STATES;
    }

    async save(saveModel) {
      const validation = saveModel.validate();
      if (!validation.isValid) {
        throw new Error(`خطای اعتبارسنجی فایل ذخیره: ${validation.errors.join(', ')}`);
      }
      saveModel.sign(this.db.secretSalt);
      const dataToStore = saveModel.serialize();
      await this.db.putRaw(this.storeName, dataToStore);
      return saveModel;
    }

    async load(slotId) {
      const raw = await this.db.getRaw(this.storeName, slotId);
      if (!raw) return null;
      const model = new SaveModel(raw);
      const isValid = model.verifyIntegrity(this.db.secretSalt);
      return {
        saveState: model,
        isValidIntegrity: isValid,
        isTampered: !isValid
      };
    }

    async listSlots() {
      const all = await this.db.getAllRaw(this.storeName);
      return all.map(item => {
        const model = new SaveModel(item);
        const isValid = model.verifyIntegrity(this.db.secretSalt);
        return {
          slotId: model.slotId,
          label: model.label,
          score: model.stats.score,
          coins: model.stats.coins,
          lives: model.stats.lives,
          world: `${model.stats.world}-${model.stats.level}`,
          updatedAt: model.updatedAt,
          isValidIntegrity: isValid,
          isTampered: !isValid
        };
      });
    }

    async delete(slotId) {
      return this.db.deleteRaw(this.storeName, slotId);
    }
  }

  class HighScoreRepository {
    constructor(dbLayer) {
      this.db = dbLayer;
      this.storeName = Config.STORES.HIGH_SCORES;
    }

    async record(scoreModel) {
      const validation = scoreModel.validate();
      if (!validation.isValid) {
        throw new Error(`خطای اعتبارسنجی امتیاز: ${validation.errors.join(', ')}`);
      }
      scoreModel.sign(this.db.secretSalt);
      const serialized = scoreModel.serialize();
      const insertId = await this.db.putRaw(this.storeName, serialized);
      scoreModel.id = insertId;
      return scoreModel;
    }

    async getTop(limit = 10, worldFilter = null) {
      const all = await this.db.getAllRaw(this.storeName);
      const verified = [];
      for (const item of all) {
        const model = new ScoreModel(item);
        const isValid = model.verifyIntegrity(this.db.secretSalt);
        if (isValid || !Config.SECURITY.STRICT_VERIFICATION) {
          if (!worldFilter || model.world === worldFilter) {
            verified.push(model);
          }
        }
      }
      verified.sort((a, b) => b.score - a.score);
      return verified.slice(0, limit);
    }

    async clear() {
      return this.db.clearStore(this.storeName);
    }
  }

  class SettingsRepository {
    constructor(dbLayer) {
      this.db = dbLayer;
      this.storeName = Config.STORES.SETTINGS;
      this.defaultId = 'active_profile_settings';
    }

    async get() {
      const raw = await this.db.getRaw(this.storeName, this.defaultId);
      if (!raw) return null;
      const model = new SettingsModelClass(raw);
      model.verifyIntegrity(this.db.secretSalt);
      return model;
    }

    async save(settingsModel) {
      const validation = settingsModel.validate();
      if (!validation.isValid) {
        throw new Error(`خطای اعتبارسنجی تنظیمات: ${validation.errors.join(', ')}`);
      }
      settingsModel.sign(this.db.secretSalt);
      await this.db.putRaw(this.storeName, settingsModel.serialize());
      return settingsModel;
    }

    async resetToDefault() {
      const defaults = new SettingsModelClass();
      return this.save(defaults);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      DatabaseLayer,
      MemoryStorageDriver,
      SaveStateRepository,
      HighScoreRepository,
      SettingsRepository
    };
  } else {
    global.DatabaseLayer = DatabaseLayer;
  }
})(typeof window !== 'undefined' ? window : globalThis);