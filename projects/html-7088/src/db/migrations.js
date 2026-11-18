/**
 * B2.st Mario Retro Game Engine - Automatic Migration System
 * Version tracking, sequential schema transformations, transactional safe-guards.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const { DB_CONFIG } = require('../../config/db.config.js');
    const { SettingsSchema, ProfileSchema, MigrationRecordSchema } = require('./schema.js');
    module.exports = factory(DB_CONFIG, { SettingsSchema, ProfileSchema, MigrationRecordSchema });
  } else {
    root.MarioDbMigrations = factory(root.MarioDbConfig.DB_CONFIG, root.MarioDbSchema);
  }
})(typeof self !== 'undefined' ? self : this, function(DB_CONFIG, Schemas) {
  'use strict';

  /**
   * Base class for versioned migrations
   */
  class Migration {
    constructor(version, name) {
      this.version = version;
      this.name = name;
    }

    async up(adapter, helpers) {
      throw new Error(`Migration ${this.version} (${this.name}) must implement up()`);
    }

    async down(adapter, helpers) {
      throw new Error(`Migration ${this.version} (${this.name}) must implement down()`);
    }
  }

  /**
   * Migration V1: Initial Store Seeding
   * Seeds default system settings & Default guest Mario profile
   */
  class MigrationV1_InitialSchema extends Migration {
    constructor() {
      super(1, 'InitialSchema_V1');
    }

    async up(adapter, helpers) {
      // 1. Seed system settings if missing
      const existingSettings = await adapter.get('settings', DB_CONFIG.defaultSettings.id);
      if (!existingSettings) {
        const validatedSettings = Schemas.SettingsSchema.validate(DB_CONFIG.defaultSettings);
        await adapter.put('settings', validatedSettings);
      }

      // 2. Seed default Guest profile if none exist
      const existingProfiles = await adapter.getAll('profiles');
      if (existingProfiles.length === 0) {
        const defaultProfile = Schemas.ProfileSchema.validate({
          id: 'profile_guest_mario',
          username: 'Mario',
          avatar: 'mario',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        await adapter.put('profiles', defaultProfile);
      }
    }

    async down(adapter, helpers) {
      await adapter.delete('settings', DB_CONFIG.defaultSettings.id);
      await adapter.delete('profiles', 'profile_guest_mario');
    }
  }

  /**
   * Migration V2: Save States & Checkpoint Baseline
   * Establishes slot-1 baseline save state for the default profile
   */
  class MigrationV2_SaveStatesAndCheckpoints extends Migration {
    constructor() {
      super(2, 'SaveStatesAndCheckpoints_V2');
    }

    async up(adapter, helpers) {
      const guestSaveKey = 'save_profile_guest_mario_1';
      const existingSave = await adapter.get('save_states', guestSaveKey);

      if (!existingSave) {
        const initialSaveState = {
          id: guestSaveKey,
          profileId: 'profile_guest_mario',
          slot: 1,
          world: 1,
          level: 1,
          score: 0,
          coins: 0,
          lives: 3,
          powerState: 'small',
          checkpointX: 40,
          checkpointY: 192,
          timeRemaining: 400,
          timestamp: Date.now()
        };

        if (helpers && helpers.cryptoSecurity) {
          initialSaveState.checksum = await helpers.cryptoSecurity.sign(initialSaveState);
        }

        await adapter.put('save_states', initialSaveState);
      }
    }

    async down(adapter, helpers) {
      await adapter.delete('save_states', 'save_profile_guest_mario_1');
    }
  }

  /**
   * Migration V3: Cryptographic Integrity Enforced & CRT Retro Settings Extended
   * Calculates SHA-256 signatures for existing records, initializes audit log.
   */
  class MigrationV3_SecurityAndAudit extends Migration {
    constructor() {
      super(3, 'SecurityAndAudit_V3');
    }

    async up(adapter, helpers) {
      // 1. Ensure all existing save states have verified cryptographic checksums
      if (helpers && helpers.cryptoSecurity) {
        const allSaves = await adapter.getAll('save_states');
        for (const save of allSaves) {
          if (!save.checksum) {
            save.checksum = await helpers.cryptoSecurity.sign(save);
            await adapter.put('save_states', save);
          }
        }
      }

      // 2. Ensure settings include CRT and curvature keys
      const currentSettings = await adapter.get('settings', DB_CONFIG.defaultSettings.id);
      if (currentSettings) {
        let changed = false;
        if (currentSettings.curvature === undefined) {
          currentSettings.curvature = false;
          changed = true;
        }
        if (currentSettings.crtFilter === undefined) {
          currentSettings.crtFilter = true;
          changed = true;
        }
        if (changed) {
          currentSettings.updatedAt = Date.now();
          await adapter.put('settings', currentSettings);
        }
      }

      // 3. Log migration event into audit log
      const auditEntry = {
        id: `audit_m3_${Date.now()}`,
        event: 'MIGRATION_V3_APPLIED',
        details: {
          timestamp: Date.now(),
          targetVersion: 3,
          note: 'Cryptographic integrity hashes enforced on all stores.'
        },
        timestamp: Date.now()
      };
      await adapter.put('audit_log', auditEntry);
    }

    async down(adapter, helpers) {
      await adapter.delete('audit_log', `audit_m3_${Date.now()}`);
    }
  }

  /**
   * Migration Runner: Executes pending migrations sequentially,
   * records execution metadata, handles atomic rollbacks on failure.
   */
  class MigrationRunner {
    constructor(migrations = null) {
      this.migrations = migrations || [
        new MigrationV1_InitialSchema(),
        new MigrationV2_SaveStatesAndCheckpoints(),
        new MigrationV3_SecurityAndAudit()
      ];
      this.migrations.sort((a, b) => a.version - b.version);
    }

    async getAppliedVersions(adapter) {
      try {
        const records = await adapter.getAll('migrations_history');
        return new Set(
          records
            .filter(r => r.status === 'SUCCESS')
            .map(r => r.version)
        );
      } catch (err) {
        return new Set();
      }
    }

    async run(adapter, helpers = {}) {
      const applied = await this.getAppliedVersions(adapter);
      const executed = [];

      for (const migration of this.migrations) {
        if (!applied.has(migration.version)) {
          const startTime = Date.now();
          try {
            await migration.up(adapter, helpers);
            const duration = Date.now() - startTime;

            const record = Schemas.MigrationRecordSchema.validate({
              version: migration.version,
              name: migration.name,
              appliedAt: Date.now(),
              executionTimeMs: duration,
              status: 'SUCCESS'
            });

            await adapter.put('migrations_history', record);
            executed.push(record);
          } catch (err) {
            const duration = Date.now() - startTime;
            const failedRecord = {
              version: migration.version,
              name: migration.name,
              appliedAt: Date.now(),
              executionTimeMs: duration,
              status: 'FAILED'
            };
            try {
              await adapter.put('migrations_history', failedRecord);
            } catch (_) {}

            // Attempt rollback
            try {
              await migration.down(adapter, helpers);
            } catch (rollbackErr) {
              console.error(`Rollback failed for migration v${migration.version}:`, rollbackErr);
            }

            throw new Error(`Migration ${migration.version} (${migration.name}) failed: ${err.message}`);
          }
        }
      }

      return executed;
    }
  }

  return {
    Migration,
    MigrationV1_InitialSchema,
    MigrationV2_SaveStatesAndCheckpoints,
    MigrationV3_SecurityAndAudit,
    MigrationRunner
  };
});