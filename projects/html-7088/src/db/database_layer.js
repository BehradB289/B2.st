/**
 * B2.st Mario Retro Game Engine - Secure Database Layer
 * Unified Storage Adapters (IndexedDB + In-Memory Fallback),
 * Web Crypto SHA-256 Anti-Tamper Engine, Repository Pattern,
 * Automatic Migrations Runner.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const { DB_CONFIG } = require('../../config/db.config.js');
    const Schemas = require('./schema.js');
    const Migrations = require('./migrations.js');
    module.exports = factory(DB_CONFIG, Schemas, Migrations);
  } else {
    root.MarioDatabase = factory(
      root.MarioDbConfig.DB_CONFIG,
      root.MarioDbSchema,
      root.MarioDbMigrations
    );
  }
})(typeof self !== 'undefined' ? self : this, function(DB_CONFIG, Schemas, Migrations) {
  'use strict';

  /**
   * Security Tamper Detection Error
   */
  class SecurityTamperError extends Error {
    constructor(message, context = {}) {
      super(message);
      this.name = 'SecurityTamperError';
      this.context = context;
      this.timestamp = Date.now();
    }
  }

  /**
   * Cryptographic Engine: Web Crypto SHA-256 signature generator & validator
   */
  class CryptoSecurity {
    constructor(salt = DB_CONFIG.security.integritySalt) {
      this.salt = salt;
    }

    async _getCryptoSubtle() {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        return crypto.subtle;
      }
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        return window.crypto.subtle;
      }
      // Node.js crypto module fallback
      try {
        const nodeCrypto = require('crypto');
        if (nodeCrypto.webcrypto && nodeCrypto.webcrypto.subtle) {
          return nodeCrypto.webcrypto.subtle;
        }
      } catch (_) {}
      return null;
    }

    _deterministicStringify(obj) {
      if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
      }
      if (Array.isArray(obj)) {
        return '[' + obj.map(item => this._deterministicStringify(item)).join(',') + ']';
      }
      const sortedKeys = Object.keys(obj).sort();
      const parts = [];
      for (const key of sortedKeys) {
        parts.push(JSON.stringify(key) + ':' + this._deterministicStringify(obj[key]));
      }
      return '{' + parts.join(',') + '}';
    }

    async hash(payload) {
      const canonicalString = typeof payload === 'string' 
        ? payload 
        : this._deterministicStringify(payload);
      const textToHash = `${this.salt}::${canonicalString}::${this.salt}`;
      const subtle = await this._getCryptoSubtle();

      if (subtle) {
        const msgUint8 = new TextEncoder().encode(textToHash);
        const hashBuffer = await subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Pure JS fallback if crypto.subtle is unavailable
      return this._fallbackSha256(textToHash);
    }

    async sign(record) {
      // Exclude existing signatures/checksums from calculation
      const { checksum, signature, ...cleanPayload } = record;
      return await this.hash(cleanPayload);
    }

    async verify(record, expectedChecksum) {
      if (!expectedChecksum || typeof expectedChecksum !== 'string') {
        return false;
      }
      const calculated = await this.sign(record);
      return calculated === expectedChecksum;
    }

    _fallbackSha256(ascii) {
      function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
      }
      const mathPow = Math.pow;
      const maxWord = mathPow(2, 32);
      const lengthProperty = 'length';
      let i, j;
      let result = '';
      const words = [];
      const asciiBitLength = ascii[lengthProperty] * 8;
      let hash = [1779033703, 3144134277, 1013904242, 2773480762,
                  1359893119, 2600822924, 528734635, 1541459225];
      const k = [1116353208, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221,
                 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580,
                 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
                 2554220882, 2821834349, 2952996808, 3210313671, 3487454416, 3914583585, 59701762, 178918296,
                 447265814, 856947266, 1283626388, 1459814467, 1709327579, 2110967078, 2426985159, 2714045970,
                 2857040416, 3592949781, 4043549047, 4261705190, 78877708, 237915832, 448695571, 720786054,
                 1083416588, 1124883485, 1435278616, 1575217988, 1637719608, 1888912820, 1974745224, 2176343542,
                 2345763772, 2518947478, 2679232030, 2879538304, 3307972402, 3578051971, 3647880901, 3865271297];

      words[asciiBitLength >> 5] |= 0x80 << (24 - asciiBitLength % 32);
      words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

      for (i = 0; i < words[lengthProperty]; i += 16) {
        const w = words.slice(i, i + 16);
        const oldHash = hash;
        hash = hash.slice(0, 8);
        for (j = 0; j < 64; j++) {
          const w15 = w[j - 15], w2 = w[j - 2];
          const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
          const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
          w[j] = j < 16 ? w[j] : (w[j - 16] + s0 + w[j - 7] + s1) | 0;

          const s1_h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
          const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
          const temp1 = hash[7] + s1_h + ch + k[j] + w[j];
          const s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
          const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
          const temp2 = s0_h + maj;

          hash = [(temp1 + temp2) | 0].concat(hash);
          hash[4] = (hash[4] + temp1) | 0;
          hash.pop();
        }
        for (j = 0; j < 8; j++) {
          hash[j] = (hash[j] + oldHash[j]) | 0;
        }
      }

      for (i = 0; i < 8; i++) {
        for (j = 3; j >= 0; j--) {
          const b = (hash[i] >> (8 * j)) & 255;
          result += (b < 16 ? '0' : '') + b.toString(16);
        }
      }
      return result;
    }
  }

  // ==========================================
  // STORAGE ADAPTERS (INDEXEDDB & IN-MEMORY)
  // ==========================================

  /**
   * Browser Native IndexedDB Storage Adapter
   */
  class IndexedDBAdapter {
    constructor(config = DB_CONFIG) {
      this.config = config;
      this.db = null;
    }

    async open() {
      if (this.db) return this;
      if (typeof indexedDB === 'undefined') {
        throw new Error('IndexedDB is not supported in this runtime environment.');
      }

      return new Promise((resolve, reject) => {
        const req = indexedDB.open(this.config.name, this.config.version);

        req.onupgradeneeded = event => {
          const db = event.target.result;
          for (const [storeName, storeDef] of Object.entries(this.config.stores)) {
            let store;
            if (!db.objectStoreNames.contains(storeName)) {
              store = db.createObjectStore(storeName, {
                keyPath: storeDef.keyPath,
                autoIncrement: storeDef.autoIncrement || false
              });
            } else {
              store = req.transaction.objectStore(storeName);
            }

            if (storeDef.indexes) {
              for (const idx of storeDef.indexes) {
                if (!store.indexNames.contains(idx.name)) {
                  store.createIndex(idx.name, idx.keyPath, { unique: idx.unique || false });
                }
              }
            }
          }
        };

        req.onsuccess = event => {
          this.db = event.target.result;
          resolve(this);
        };

        req.onerror = event => {
          reject(new Error(`IndexedDB open error: ${event.target.error?.message}`));
        };
      });
    }

    _tx(storeName, mode = 'readonly') {
      if (!this.db) throw new Error('Database is not initialized. Call open() first.');
      const tx = this.db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      return { tx, store };
    }

    async get(storeName, key) {
      return new Promise((resolve, reject) => {
        const { store } = this._tx(storeName, 'readonly');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? Schemas.Sanitizer.deepClone(req.result) : null);
        req.onerror = () => reject(req.error);
      });
    }

    async put(storeName, value) {
      const sanitized = Schemas.Sanitizer.deepClone(value);
      return new Promise((resolve, reject) => {
        const { store } = this._tx(storeName, 'readwrite');
        const req = store.put(sanitized);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async delete(storeName, key) {
      return new Promise((resolve, reject) => {
        const { store } = this._tx(storeName, 'readwrite');
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    }

    async getAll(storeName) {
      return new Promise((resolve, reject) => {
        const { store } = this._tx(storeName, 'readonly');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result.map(v => Schemas.Sanitizer.deepClone(v)));
        req.onerror = () => reject(req.error);
      });
    }

    async clear(storeName) {
      return new Promise((resolve, reject) => {
        const { store } = this._tx(storeName, 'readwrite');
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    }

    async close() {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
    }
  }

  /**
   * High-Performance In-Memory Storage Adapter
   * Used for unit tests, headless CI pipelines, and private browsing fallbacks.
   */
  class MemoryStorageAdapter {
    constructor(config = DB_CONFIG) {
      this.config = config;
      this.stores = new Map();
      this._initStores();
    }

    _initStores() {
      for (const [storeName, storeDef] of Object.entries(this.config.stores)) {
        if (!this.stores.has(storeName)) {
          this.stores.set(storeName, {
            keyPath: storeDef.keyPath,
            data: new Map()
          });
        }
      }
    }

    async open() {
      this._initStores();
      return this;
    }

    async get(storeName, key) {
      const store = this.stores.get(storeName);
      if (!store) throw new Error(`Store '${storeName}' does not exist.`);
      const val = store.data.get(key);
      return val ? Schemas.Sanitizer.deepClone(val) : null;
    }

    async put(storeName, value) {
      const store = this.stores.get(storeName);
      if (!store) throw new Error(`Store '${storeName}' does not exist.`);
      const sanitized = Schemas.Sanitizer.deepClone(value);
      const key = sanitized[store.keyPath];
      if (key === undefined || key === null) {
        throw new Error(`Item missing required keyPath '${store.keyPath}'`);
      }
      store.data.set(key, sanitized);
      return key;
    }

    async delete(storeName, key) {
      const store = this.stores.get(storeName);
      if (!store) throw new Error(`Store '${storeName}' does not exist.`);
      return store.data.delete(key);
    }

    async getAll(storeName) {
      const store = this.stores.get(storeName);
      if (!store) throw new Error(`Store '${storeName}' does not exist.`);
      return Array.from(store.data.values()).map(v => Schemas.Sanitizer.deepClone(v));
    }

    async clear(storeName) {
      const store = this.stores.get(storeName);
      if (store) store.data.clear();
      return true;
    }

    async close() {
      // Memory state cleanup
      return true;
    }
  }

  // ==========================================
  // DATA REPOSITORIES (SECURE DATA ACCESS LAYER)
  // ==========================================

  class ProfilesRepository {
    constructor(adapter) {
      this.adapter = adapter;
    }

    async create(profileData) {
      const validated = Schemas.ProfileSchema.validate({
        id: profileData.id || `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: profileData.username,
        avatar: profileData.avatar || 'mario',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Check unique username constraint
      const all = await this.adapter.getAll('profiles');
      if (all.some(p => p.username.toLowerCase() === validated.username.toLowerCase())) {
        throw new Schemas.ValidationError(`Username '${validated.username}' is already taken.`, 'username');
      }

      await this.adapter.put('profiles', validated);
      return validated;
    }

    async getById(id) {
      return await this.adapter.get('profiles', id);
    }

    async getByUsername(username) {
      const all = await this.adapter.getAll('profiles');
      return all.find(p => p.username.toLowerCase() === username.toLowerCase()) || null;
    }

    async listAll() {
      return await this.adapter.getAll('profiles');
    }

    async update(id, partial) {
      const existing = await this.getById(id);
      if (!existing) throw new Error(`Profile with id '${id}' not found.`);

      const updated = {
        ...existing,
        ...partial,
        id, // Immutable ID
        updatedAt: Date.now()
      };
      const validated = Schemas.ProfileSchema.validate(updated);
      await this.adapter.put('profiles', validated);
      return validated;
    }

    async delete(id) {
      return await this.adapter.delete('profiles', id);
    }
  }

  class SaveStatesRepository {
    constructor(adapter, cryptoSecurity, auditRepo) {
      this.adapter = adapter;
      this.cryptoSecurity = cryptoSecurity;
      this.auditRepo = auditRepo;
    }

    _generateSaveKey(profileId, slot) {
      return `save_${profileId}_${slot}`;
    }

    async saveSlot(profileId, slot, stateData) {
      if (slot < 1 || slot > DB_CONFIG.security.maxSaveSlotsPerProfile) {
        throw new Schemas.ValidationError(`Save slot must be between 1 and ${DB_CONFIG.security.maxSaveSlotsPerProfile}`, 'slot');
      }

      const savePayload = {
        id: this._generateSaveKey(profileId, slot),
        profileId,
        slot,
        world: stateData.world,
        level: stateData.level,
        score: stateData.score,
        coins: stateData.coins,
        lives: stateData.lives,
        powerState: stateData.powerState || 'small',
        checkpointX: Math.round(stateData.checkpointX ?? 40),
        checkpointY: Math.round(stateData.checkpointY ?? 192),
        timeRemaining: stateData.timeRemaining ?? 400,
        timestamp: Date.now()
      };

      // Validate data structure against SaveStateSchema
      const validated = Schemas.SaveStateSchema.validate(savePayload);

      // Compute cryptographic SHA-256 tamper-proof checksum
      validated.checksum = await this.cryptoSecurity.sign(validated);

      await this.adapter.put('save_states', validated);

      if (this.auditRepo) {
        await this.auditRepo.log('SAVE_STATE_CREATED', {
          profileId,
          slot,
          world: validated.world,
          level: validated.level,
          score: validated.score
        });
      }

      return validated;
    }

    async loadSlot(profileId, slot) {
      const key = this._generateSaveKey(profileId, slot);
      const record = await this.adapter.get('save_states', key);
      if (!record) return null;

      // Verify integrity checksum to prevent cheat engine / raw storage tampering
      const isValid = await this.cryptoSecurity.verify(record, record.checksum);
      if (!isValid) {
        if (this.auditRepo) {
          await this.auditRepo.log('SECURITY_SAVE_TAMPER_DETECTED', {
            profileId,
            slot,
            key,
            recordedChecksum: record.checksum
          });
        }
        throw new SecurityTamperError(
          `Critical Security Alert: Save data in slot ${slot} has been tampered with or corrupted!`,
          { profileId, slot, key }
        );
      }

      return record;
    }

    async listSlots(profileId) {
      const all = await this.adapter.getAll('save_states');
      const profileSaves = all.filter(s => s.profileId === profileId);
      
      // Verify integrity status of each slot
      const verifiedList = [];
      for (const save of profileSaves) {
        const isTampered = !(await this.cryptoSecurity.verify(save, save.checksum));
        verifiedList.push({
          ...save,
          tampered: isTampered
        });
      }
      return verifiedList.sort((a, b) => a.slot - b.slot);
    }

    async deleteSlot(profileId, slot) {
      const key = this._generateSaveKey(profileId, slot);
      return await this.adapter.delete('save_states', key);
    }
  }

  class HighScoresRepository {
    constructor(adapter, cryptoSecurity, auditRepo) {
      this.adapter = adapter;
      this.cryptoSecurity = cryptoSecurity;
      this.auditRepo = auditRepo;
    }

    async submitScore(entry) {
      const rawPayload = {
        id: entry.id || `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        profileId: entry.profileId,
        playerName: entry.playerName,
        score: entry.score,
        world: entry.world,
        level: entry.level,
        timeRemaining: entry.timeRemaining,
        achievedAt: Date.now()
      };

      const validated = Schemas.HighScoreSchema.validate(rawPayload);
      validated.signature = await this.cryptoSecurity.sign(validated);

      await this.adapter.put('high_scores', validated);

      if (this.auditRepo) {
        await this.auditRepo.log('HIGH_SCORE_RECORDED', {
          profileId: validated.profileId,
          playerName: validated.playerName,
          score: validated.score
        });
      }

      return validated;
    }

    async getLeaderboard(limit = 10) {
      const all = await this.adapter.getAll('high_scores');
      const verifiedScores = [];

      for (const entry of all) {
        const isValid = await this.cryptoSecurity.verify(entry, entry.signature);
        if (isValid) {
          verifiedScores.push(entry);
        }
      }

      return verifiedScores
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(limit, DB_CONFIG.security.maxLeaderboardRows));
    }

    async verifyScore(entry) {
      return await this.cryptoSecurity.verify(entry, entry.signature);
    }
  }

  class SettingsRepository {
    constructor(adapter) {
      this.adapter = adapter;
      this.id = DB_CONFIG.defaultSettings.id;
    }

    async getSettings() {
      const settings = await this.adapter.get('settings', this.id);
      return settings || DB_CONFIG.defaultSettings;
    }

    async updateSettings(partial) {
      const current = await this.getSettings();
      const updated = {
        ...current,
        ...partial,
        id: this.id,
        updatedAt: Date.now()
      };

      const validated = Schemas.SettingsSchema.validate(updated);
      await this.adapter.put('settings', validated);
      return validated;
    }

    async resetToDefaults() {
      const validated = Schemas.SettingsSchema.validate(DB_CONFIG.defaultSettings);
      await this.adapter.put('settings', validated);
      return validated;
    }
  }

  class AuditLogRepository {
    constructor(adapter) {
      this.adapter = adapter;
    }

    async log(event, details = {}) {
      try {
        const entry = Schemas.AuditLogSchema.validate({
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          event,
          details,
          timestamp: Date.now()
        });
        await this.adapter.put('audit_log', entry);
        return entry;
      } catch (err) {
        console.warn('Audit logging bypassed due to error:', err.message);
      }
    }

    async getRecent(limit = 20) {
      const all = await this.adapter.getAll('audit_log');
      return all
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    }
  }

  // ==========================================
  // UNIFIED DATABASE MANAGER
  // ==========================================

  class SecureDatabase {
    constructor(options = {}) {
      this.useMemory = options.useMemory || (typeof indexedDB === 'undefined');
      this.adapter = this.useMemory
        ? new MemoryStorageAdapter(DB_CONFIG)
        : new IndexedDBAdapter(DB_CONFIG);

      this.crypto = new CryptoSecurity(DB_CONFIG.security.integritySalt);
      this.migrationRunner = new Migrations.MigrationRunner();

      // Repositories initialization
      this.audit = new AuditLogRepository(this.adapter);
      this.profiles = new ProfilesRepository(this.adapter);
      this.saves = new SaveStatesRepository(this.adapter, this.crypto, this.audit);
      this.highScores = new HighScoresRepository(this.adapter, this.crypto, this.audit);
      this.settings = new SettingsRepository(this.adapter);
      this.initialized = false;
    }

    async initialize() {
      if (this.initialized) return this;

      // 1. Open underlying storage adapter
      await this.adapter.open();

      // 2. Run automated migration pipeline
      await this.migrationRunner.run(this.adapter, {
        cryptoSecurity: this.crypto,
        schemas: Schemas
      });

      this.initialized = true;
      return this;
    }

    async exportDatabase() {
      const exportObject = {
        version: DB_CONFIG.version,
        exportedAt: Date.now(),
        stores: {}
      };

      for (const storeName of Object.keys(DB_CONFIG.stores)) {
        exportObject.stores[storeName] = await this.adapter.getAll(storeName);
      }

      // Add top-level cryptographic seal
      exportObject.exportSignature = await this.crypto.sign(exportObject.stores);
      return JSON.stringify(exportObject, null, 2);
    }

    async importDatabase(jsonString) {
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (err) {
        throw new Error('Invalid JSON format for database backup.');
      }

      if (!parsed.stores || !parsed.exportSignature) {
        throw new Error('Malformed backup payload: missing stores or cryptographic signature.');
      }

      // Verify backup signature integrity
      const isSignatureValid = await this.crypto.verify(parsed.stores, parsed.exportSignature);
      if (!isSignatureValid) {
        throw new SecurityTamperError('Database import aborted: Corrupted or tampered backup signature.');
      }

      // Clear and restore each store atomically
      for (const [storeName, records] of Object.entries(parsed.stores)) {
        if (!DB_CONFIG.stores[storeName]) continue;

        await this.adapter.clear(storeName);
        for (const record of records) {
          await this.adapter.put(storeName, record);
        }
      }

      await this.audit.log('DATABASE_RESTORED_FROM_BACKUP', {
        timestamp: Date.now(),
        version: parsed.version
      });

      return true;
    }

    /**
     * Testing utility: Allows intentional score modification without updating signature,
     * specifically for demonstrating the Anti-Tamper engine in dev/testing mode.
     */
    async simulateTampering(profileId, slot, maliciousScore = 9999990) {
      const key = `save_${profileId}_${slot}`;
      const record = await this.adapter.get('save_states', key);
      if (!record) throw new Error(`Slot ${slot} does not exist to tamper.`);

      // Modify score directly in storage without recalculating checksum
      record.score = maliciousScore;
      await this.adapter.put('save_states', record);
      return record;
    }

    async close() {
      await this.adapter.close();
      this.initialized = false;
    }
  }

  return {
    SecurityTamperError,
    CryptoSecurity,
    IndexedDBAdapter,
    MemoryStorageAdapter,
    ProfilesRepository,
    SaveStatesRepository,
    HighScoresRepository,
    SettingsRepository,
    AuditLogRepository,
    SecureDatabase
  };
});