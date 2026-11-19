/**
 * @file schemas.js
 * @description مدل‌های داده، تعاریف اسکیمای ساختاریافته و سیستم اعتبارسنجی فیلدها برای B2 Mario
 */

import { DATABASE_CONFIG } from '../../config/database.config.js';

export const DataType = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array'
};

/**
 * تعاریف رسمی اسکیمای جداول
 */
export const SCHEMAS = {
  [DATABASE_CONFIG.STORES.PROFILES]: {
    id: { type: DataType.STRING, required: true },
    username: { type: DataType.STRING, required: true, maxLength: 32 },
    createdAt: { type: DataType.NUMBER, required: true },
    lastActive: { type: DataType.NUMBER, required: true }
  },

  [DATABASE_CONFIG.STORES.GAME_SAVES]: {
    slotId: { type: DataType.STRING, required: true },
    profileId: { type: DataType.STRING, required: true },
    world: { type: DataType.NUMBER, required: true, min: 1, max: 8 },
    stage: { type: DataType.NUMBER, required: true, min: 1, max: 4 },
    score: { type: DataType.NUMBER, required: true, min: 0 },
    coins: { type: DataType.NUMBER, required: true, min: 0, max: DATABASE_CONFIG.SECURITY.MAX_COINS },
    lives: { type: DataType.NUMBER, required: true, min: 0, max: DATABASE_CONFIG.SECURITY.MAX_LIVES },
    powerState: { type: DataType.STRING, required: true, enum: ['SMALL', 'SUPER', 'FIRE', 'STAR'] },
    checkpointX: { type: DataType.NUMBER, required: true, min: 0 },
    checkpointY: { type: DataType.NUMBER, required: true, min: 0 },
    updatedAt: { type: DataType.NUMBER, required: true }
  },

  [DATABASE_CONFIG.STORES.HIGH_SCORES]: {
    id: { type: DataType.STRING, required: true },
    profileId: { type: DataType.STRING, required: true },
    playerName: { type: DataType.STRING, required: true, maxLength: 32 },
    score: { type: DataType.NUMBER, required: true, min: 0 },
    world: { type: DataType.NUMBER, required: true, min: 1, max: 8 },
    stage: { type: DataType.NUMBER, required: true, min: 1, max: 4 },
    timestamp: { type: DataType.NUMBER, required: true }
  },

  [DATABASE_CONFIG.STORES.SETTINGS]: {
    id: { type: DataType.STRING, required: true },
    masterVolume: { type: DataType.NUMBER, required: true, min: 0, max: 1 },
    sfxVolume: { type: DataType.NUMBER, required: true, min: 0, max: 1 },
    musicVolume: { type: DataType.NUMBER, required: true, min: 0, max: 1 },
    crtFilterEnabled: { type: DataType.BOOLEAN, required: true },
    pixelScale: { type: DataType.NUMBER, required: true, min: 1, max: 6 },
    keyBindings: { type: DataType.OBJECT, required: true }
  },

  [DATABASE_CONFIG.STORES.LEVEL_PROGRESS]: {
    id: { type: DataType.STRING, required: true }, // Format: `${profileId}_W${world}_S${stage}`
    profileId: { type: DataType.STRING, required: true },
    world: { type: DataType.NUMBER, required: true, min: 1, max: 8 },
    stage: { type: DataType.NUMBER, required: true, min: 1, max: 4 },
    completed: { type: DataType.BOOLEAN, required: true },
    starsCollected: { type: DataType.NUMBER, required: true, min: 0, max: 3 },
    bestTimeMs: { type: DataType.NUMBER, required: true, min: 0 }
  }
};

/**
 * اعتبارسنجی داده‌ها بر اساس اسکیما
 */
export class SchemaValidator {
  /**
   * بررسی صحت داده نسبت به مدل مشخص شده
   * @param {string} storeName نام جدول
   * @param {Object} data موجودیت ارسالی
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(storeName, data) {
    const schema = SCHEMAS[storeName];
    if (!schema) {
      return { valid: false, errors: [`No schema defined for store '${storeName}'`] };
    }

    const errors = [];

    // بررسی تمام فیلدهای تعیین شده در اسکیما
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Field '${field}' is required in store '${storeName}'.`);
        continue;
      }

      if (value !== undefined && value !== null) {
        // ارزیابی نوع داده
        const actualType = Array.isArray(value) ? DataType.ARRAY : typeof value;
        if (actualType !== rules.type) {
          errors.push(`Field '${field}' expected type '${rules.type}', got '${actualType}'.`);
          continue;
        }

        // محدودیت‌های عددی
        if (rules.type === DataType.NUMBER) {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`Field '${field}' must be >= ${rules.min}, received ${value}.`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`Field '${field}' must be <= ${rules.max}, received ${value}.`);
          }
        }

        // محدودیت‌های رشته‌ای
        if (rules.type === DataType.STRING) {
          if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            errors.push(`Field '${field}' length exceeds ${rules.maxLength}.`);
          }
        }

        // بررسی مقادیر شمارشی (Enum)
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`Field '${field}' value '${value}' is not within allowable values [${rules.enum.join(', ')}].`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}