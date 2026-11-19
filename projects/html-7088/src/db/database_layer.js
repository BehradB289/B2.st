/**
 * B2.st Studio - Mario Game Engine
 * Secure Database Layer, Data Access Objects & Anti-Tamper Security
 * @module src/db/database_layer
 */

import { DATABASE_CONFIG } from '../../config/database.config.js';
import { SchemaValidator } from './schema.js';
import { MigrationEngine } from './migrations.js';

/**
 * Cryptographic utility providing HMAC / SHA-256 data signing
 * to prevent manual memory/storage manipulation of saves & scores.
 */
export class DataIntegrityGuard {
  /**
   * Generates a deterministic SHA-256 hash string for arbitrary objects.
   * @param {Object} payload 
   * @param {string} salt 
   * @returns {Promise<string>}
   */
  static async computeHash(payload, salt = DATABASE_CONFIG.INTEGRITY_SALT) {
    // Clone without existing hash/signatures to guarantee idempotence
    const sanitized = { ...payload };
    delete sanitized._signature;
    delete sanitized._verifiedAt;

    // Deterministic key sort
    const canonicalString = JSON.stringify(sanitized, Object.keys(sanitized).sort()) + salt;
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalString);

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Signs a data record with a cryptographic signature.
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  static async sign(data) {
    const signature = await this.computeHash(data);
    return {
      ...data,
      _signature: signature,
      _signedAt: Date.now()
    };
  }

  /**
   * Verifies the authenticity of a signed record.
   * @param {Object} record 
   * @returns {Promise<boolean>}
   */
  static async verify(record) {
    if (!record || !record._signature) return false;
    const originalSignature = record._signature;
    const calculatedSignature = await this.computeHash(record);
    return originalSignature === calculatedSignature;
  }
}

/**
 * Core Database Layer implementing IndexedDB transactions, connection lifecycle,
 * and high-level typed repository queries.
 */
export class DatabaseLayer {
  /**
   * @private
   * @type {IDBDatabase | null}
   */
  #db = null;

  /**
   * @private
   * @type {boolean}
   */
  #isInitialized = false;

  constructor() {
    this.name = DATABASE_CONFIG.NAME;
    this.version = DATABASE_CONFIG.VERSION;
  }

  /**
   * Opens database connection and triggers migration pipeline if needed.
   * @returns {Promise<DatabaseLayer>}
   */
  async init() {
    if (this.#isInitialized && this.#db) {
      return this;
    }

    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this runtime environment.'));
      }

      const request = window.indexedDB.open(this.name, this.version);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const transaction = request.transaction;
        MigrationEngine.runMigrations(db, transaction, event.oldVersion, event.newVersion);
      };

      request.onsuccess = async () => {
        this.#db = request.result;
        this.#isInitialized = true;

        this.#db.onversionchange = () => {
          this.#db.close();
          console.warn('[B2.st Database] Database version changed elsewhere. Connection closed.');
        };

        try {
          await this.#seedDefaultSettings();
          await this.#logAudit('SYSTEM_BOOT', { version: this.version });
          console.info('[B2.st Database] Core Database Layer initialized successfully.');
          resolve(this);
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to initialize database: ${request.error?.message}`));
      };

      request.onblocked = () => {
        console.warn('[B2.st Database] Upgrade blocked: another open connection exists.');
      };
    });
  }

  /**
   * Generic execution wrapper ensuring strict transaction lifecycle.
   * @template T
   * @param {string|string[]} storeNames 
   * @param {'readonly'|'readwrite'} mode 
   * @param {(stores: Record<string, IDBObjectStore>, tx: IDBTransaction) => Promise<T>|T} operation 
   * @returns {Promise<T>}
   */
  async executeTransaction(storeNames, mode, operation) {
    await this.init();

    const names = Array.isArray(storeNames) ? storeNames : [storeNames];

    return new Promise((resolve, reject) => {
      const tx = this.#db.transaction(names, mode);
      const storeMap = {};
      for (const name of names) {
        storeMap[name] = tx.objectStore(name);
      }

      let operationResult;

      tx.oncomplete = () => {
        resolve(operationResult);
      };

      tx.onerror = () => {
        reject(new Error(`Transaction failed on stores [${names.join(', ')}]: ${tx.error?.message}`));
      };

      tx.onabort = () => {
        reject(new Error(`Transaction aborted on stores [${names.join(', ')}]: ${tx.error?.message}`));
      };

      Promise.resolve()
        .then(() => operation(storeMap, tx))
        .then(result => {
          operationResult = result;
        })
        .catch(err => {
          try {
            tx.abort();
          } catch (_) {
            // Already finished or abort failed
          }
          reject(err);
        });
    });
  }

  // ==========================================
  // SAVE STATE REPOSITORY OPERATIONS
  // ==========================================

  /**
   * Saves game checkpoint / state with validation & anti-tamper signature.
   * @param {Object} rawState 
   * @returns {Promise<Object>} Saved signed state
   */
  async saveGameState(rawState) {
    const validation = SchemaValidator.validateSaveState(rawState);
    if (!validation.isValid) {
      throw new Error(`State validation failed: ${validation.errors.join(' | ')}`);
    }

    const stateToSign = {
      ...rawState,
      updatedAt: Date.now()
    };

    const signedRecord = await DataIntegrityGuard.sign(stateToSign);

    await this.executeTransaction(
      [DATABASE_CONFIG.STORES.SAVE_STATES, DATABASE_CONFIG.STORES.AUDIT_LOGS],
      'readwrite',
      async (stores) => {
        stores[DATABASE_CONFIG.STORES.SAVE_STATES].put(signedRecord);
        stores[DATABASE_CONFIG.STORES.AUDIT_LOGS].add({
          type: 'STATE_SAVED',
          slotId: signedRecord.slotId,
          world: signedRecord.world,
          level: signedRecord.level,
          score: signedRecord.score,
          timestamp: Date.now()
        });
      }
    );

    return signedRecord;
  }

  /**
   * Loads save state by slot identifier and verifies cryptographic signature.
   * @param {string} slotId 
   * @returns {Promise<Object>}
   */
  async loadGameState(slotId) {
    const record = await this.executeTransaction(
      DATABASE_CONFIG.STORES.SAVE_STATES,
      'readonly',
      (stores) => {
        return new Promise((resolve, reject) => {
          const req = stores[DATABASE_CONFIG.STORES.SAVE_STATES].get(slotId);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      }
    );

    if (!record) {
      return null;
    }

    const isAuthentic = await DataIntegrityGuard.verify(record);
    if (!isAuthentic) {
      await this.#logAudit('SECURITY_VIOLATION', {
        reason: 'TAMPERED_SAVE_STATE',
        slotId
      });
      throw new Error(`Security Violation: Tampered save state detected in slot "${slotId}".`);
    }

    return record;
  }

  /**
   * Lists all available save states metadata.
   * @returns {Promise<Array<Object>>}
   */
  async listSaveSlots() {
    return this.executeTransaction(
      DATABASE_CONFIG.STORES.SAVE_STATES,
      'readonly',
      (stores) => {
        return new Promise((resolve, reject) => {
          const req = stores[DATABASE_CONFIG.STORES.SAVE_STATES].getAll();
          req.onsuccess = () => {
            const list = (req.result || []).map(item => ({
              slotId: item.slotId,
              world: item.world,
              level: item.level,
              score: item.score,
              lives: item.lives,
              coins: item.coins,
              updatedAt: item.updatedAt
            }));
            resolve(list);
          };
          req.onerror = () => reject(req.error);
        });
      }
    );
  }

  /**
   * Deletes a save state by slot identifier.
   * @param {string} slotId 
   * @returns {Promise<boolean>}
   */
  async deleteSaveState(slotId) {
    return this.executeTransaction(
      DATABASE_CONFIG.STORES.SAVE_STATES,
      'readwrite',
      (stores) => {
        return new Promise((resolve, reject) => {
          const req = stores[DATABASE_CONFIG.STORES.SAVE_STATES].delete(slotId);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      }
    );
  }

  // ==========================================
  // HIGH SCORES & LEADERBOARD
  // ==========================================

  /**
   * Records a validated high score.
   * @param {{playerName: string, score: number, stage: string, coins: number}} scoreData 
   * @returns {Promise<Object>}
   */
  async recordHighScore(scoreData) {
    const payload = {
      playerName: scoreData.playerName.trim().toUpperCase(),
      score: scoreData.score,
      stage: scoreData.stage,
      coins: scoreData.coins || 0,
      achievedAt: Date.now()
    };

    const validation = SchemaValidator.validateHighScore(payload);
    if (!validation.isValid) {
      throw new Error(`High score invalid: ${validation.errors.join(' | ')}`);
    }

    const signedScore = await DataIntegrityGuard.sign(payload);

    return this.executeTransaction(
      DATABASE_CONFIG.STORES.HIGH_SCORES,
      'readwrite',
      (stores) => {
        return new Promise((resolve, reject) => {
          const req = stores[DATABASE_CONFIG.STORES.HIGH_SCORES].add(signedScore);
          req.onsuccess = () => {
            resolve({ ...signedScore, id: req.result });
          };
          req.onerror = () => reject(req.error);
        });
      }
    );
  }

  /**
   * Retrieves top high scores sorted descending.
   * @param {number} [limit=10] 
   * @returns {Promise<Array<Object>>}
   */
  async getTopHighScores(limit = 10) {
    return this.executeTransaction(
      DATABASE_CONFIG.STORES.HIGH_SCORES,
      'readonly',
      (stores) => {
        return new Promise((resolve, reject) => {
          const store = stores[DATABASE_CONFIG.STORES.HIGH_SCORES];
          const index = store.index('idx_score_desc');
          const results = [];

          // Open cursor with descending direction
          const cursorReq = index.openCursor(null, 'prev');
          cursorReq.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor && results.length < limit) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              resolve(results);
            }
          };
          cursorReq.onerror = () => reject(cursorReq.error);
        });
      }
    );
  }

  // ==========================================
  // GAME SETTINGS
  // ==========================================

  /**
   * Fetches active game settings.
   * @returns {Promise<Object>}
   */
  async getSettings() {
    return this.executeTransaction(
      DATABASE_CONFIG.STORES.SETTINGS,
      'readonly',
      (stores) => {
        return new Promise((resolve, reject) => {
          const req = stores[DATABASE_CONFIG.STORES.SETTINGS].get('active_config');
          req.onsuccess = () => resolve(req.result || DATABASE_CONFIG.DEFAULT_SETTINGS);
          req.onerror = () => reject(req.error);
        });
      }
    );
  }

  /**
   * Updates partial or full game settings.
   * @param {Partial<typeof DATABASE_CONFIG.DEFAULT_SETTINGS>} partialSettings 
   * @returns {Promise<Object>}
   */
  async updateSettings(partialSettings) {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...partialSettings,
      id: 'active_config',
      updatedAt: Date.now()
    };

    await this.executeTransaction(
      DATABASE_CONFIG.STORES.SETTINGS,
      'readwrite',
      (stores) => {
        return new Promise((resolve, reject) => {
          const req = stores[DATABASE_CONFIG.STORES.SETTINGS].put(updated);
          req.onsuccess = () => resolve(updated);
          req.onerror = () => reject(req.error);
        });
      }
    );

    return updated;
  }

  // ==========================================
  // BACKUP, RESTORE & HEALTH CHECKS
  // ==========================================

  /**
   * Exports full database dump as a verified JSON bundle.
   * @returns {Promise<string>}
   */
  async exportBackup() {
    const storesToExport = [
      DATABASE_CONFIG.STORES.SAVE_STATES,
      DATABASE_CONFIG.STORES.HIGH_SCORES,
      DATABASE_CONFIG.STORES.SETTINGS
    ];

    const backupData = {
      version: this.version,
      exportedAt: new Date().toISOString(),
      stores: {}
    };

    await this.executeTransaction(
      storesToExport,
      'readonly',
      async (stores) => {
        for (const name of storesToExport) {
          backupData.stores[name] = await new Promise((resolve, reject) => {
            const req = stores[name].getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
          });
        }
      }
    );

    const checksum = await DataIntegrityGuard.computeHash(backupData.stores);
    backupData.checksum = checksum;

    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Restores database from a verified JSON backup string.
   * @param {string} jsonString 
   * @returns {Promise<{success: boolean, restoredRecords: number}>}
   */
  async restoreBackup(jsonString) {
    const bundle = JSON.parse(jsonString);
    if (!bundle.checksum || !bundle.stores) {
      throw new Error('Corrupt or invalid backup bundle format.');
    }

    const calculatedChecksum = await DataIntegrityGuard.computeHash(bundle.stores);
    if (calculatedChecksum !== bundle.checksum) {
      throw new Error('Integrity check failed: Backup bundle checksum mismatch.');
    }

    let count = 0;
    const storeNames = Object.keys(bundle.stores);

    await this.executeTransaction(
      storeNames,
      'readwrite',
      async (stores) => {
        for (const storeName of storeNames) {
          const targetStore = stores[storeName];
          if (!targetStore) continue;

          // Clear existing
          await new Promise((res, rej) => {
            const clearReq = targetStore.clear();
            clearReq.onsuccess = res;
            clearReq.onerror = rej;
          });

          // Insert verified items
          for (const item of bundle.stores[storeName]) {
            targetStore.put(item);
            count++;
          }
        }
      }
    );

    await this.#logAudit('BACKUP_RESTORED', { recordCount: count });
    return { success: true, restoredRecords: count };
  }

  /**
   * Database diagnostics and storage quota estimation.
   * @returns {Promise<{isHealthy: boolean, storageQuota: Object, migrationVersion: number}>}
   */
  async healthCheck() {
    let quota = { usage: 0, quota: 0, percentUsed: 0 };
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const total = estimate.quota || 1;
      quota = {
        usageMB: (usage / (1024 * 1024)).toFixed(2),
        quotaMB: (total / (1024 * 1024)).toFixed(2),
        percentUsed: ((usage / total) * 100).toFixed(2)
      };
    }

    return {
      isHealthy: Boolean(this.#db),
      name: this.name,
      migrationVersion: this.version,
      storageQuota: quota
    };
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  async #seedDefaultSettings() {
    const current = await this.executeTransaction(
      DATABASE_CONFIG.STORES.SETTINGS,
      'readonly',
      (stores) => {
        return new Promise((resolve) => {
          const req = stores[DATABASE_CONFIG.STORES.SETTINGS].get('active_config');
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });
      }
    );

    if (!current) {
      await this.executeTransaction(
        DATABASE_CONFIG.STORES.SETTINGS,
        'readwrite',
        (stores) => {
          stores[DATABASE_CONFIG.STORES.SETTINGS].put(DATABASE_CONFIG.DEFAULT_SETTINGS);
        }
      );
    }
  }

  async #logAudit(type, details) {
    try {
      await this.executeTransaction(
        DATABASE_CONFIG.STORES.AUDIT_LOGS,
        'readwrite',
        (stores) => {
          stores[DATABASE_CONFIG.STORES.AUDIT_LOGS].add({
            type,
            details,
            timestamp: Date.now()
          });
        }
      );
    } catch (e) {
      console.warn('[B2.st Database] Audit logging suppressed:', e.message);
    }
  }
}

// Singleton export instance
export const dbInstance = new DatabaseLayer();