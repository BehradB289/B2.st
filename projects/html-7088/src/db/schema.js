/**
 * B2.st Mario Retro Game Engine - Schema & Sanitization Engine
 * Strict type validation, anti-tampering rules, prototype pollution defense.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MarioDbSchema = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  /**
   * Custom Validation Error with descriptive error context
   */
  class ValidationError extends Error {
    constructor(message, field = null, receivedValue = undefined) {
      super(message);
      this.name = 'ValidationError';
      this.field = field;
      this.receivedValue = receivedValue;
    }
  }

  /**
   * Data Sanitizer: Strips malicious payloads, prevents Prototype Pollution,
   * removes XSS tags from strings, and enforces data isolation.
   */
  class Sanitizer {
    static sanitizeString(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/<[^>]*>?/gm, '') // Strip HTML / script tags
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control chars
        .trim();
    }

    static sanitizeObject(obj) {
      if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') return Sanitizer.sanitizeString(obj);
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => Sanitizer.sanitizeObject(item));
      }

      // Safe clean object without prototype injection vulnerability
      const cleanObj = Object.create(null);
      for (const [key, value] of Object.entries(obj)) {
        // Block Prototype Pollution attempts
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        cleanObj[key] = Sanitizer.sanitizeObject(value);
      }
      return cleanObj;
    }

    static deepClone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      return JSON.parse(JSON.stringify(Sanitizer.sanitizeObject(obj)));
    }

    static deepFreeze(obj) {
      Object.keys(obj).forEach(prop => {
        if (typeof obj[prop] === 'object' && obj[prop] !== null && !Object.isFrozen(obj[prop])) {
          Sanitizer.deepFreeze(obj[prop]);
        }
      });
      return Object.freeze(obj);
    }
  }

  /**
   * Field Rule Specification
   */
  class FieldValidator {
    constructor(options = {}) {
      this.type = options.type || 'string';
      this.required = options.required ?? false;
      this.default = options.default;
      this.min = options.min;
      this.max = options.max;
      this.enum = options.enum;
      this.pattern = options.pattern;
      this.custom = options.custom;
    }

    validate(fieldName, value) {
      // Default value assignment if missing
      if (value === undefined || value === null) {
        if (this.default !== undefined) {
          return typeof this.default === 'function' ? this.default() : this.default;
        }
        if (this.required) {
          throw new ValidationError(`Field '${fieldName}' is required and cannot be null/undefined.`, fieldName, value);
        }
        return null;
      }

      // Type checks
      if (this.type === 'array') {
        if (!Array.isArray(value)) {
          throw new ValidationError(`Field '${fieldName}' must be an array.`, fieldName, typeof value);
        }
      } else if (typeof value !== this.type) {
        throw new ValidationError(`Field '${fieldName}' must be of type '${this.type}', received '${typeof value}'.`, fieldName, value);
      }

      // Number validations
      if (this.type === 'number') {
        if (Number.isNaN(value) || !Number.isFinite(value)) {
          throw new ValidationError(`Field '${fieldName}' must be a finite number.`, fieldName, value);
        }
        if (this.min !== undefined && value < this.min) {
          throw new ValidationError(`Field '${fieldName}' cannot be less than ${this.min}.`, fieldName, value);
        }
        if (this.max !== undefined && value > this.max) {
          throw new ValidationError(`Field '${fieldName}' cannot be greater than ${this.max}.`, fieldName, value);
        }
      }

      // String validations
      if (this.type === 'string') {
        const sanitized = Sanitizer.sanitizeString(value);
        if (this.min !== undefined && sanitized.length < this.min) {
          throw new ValidationError(`Field '${fieldName}' must have a minimum length of ${this.min}.`, fieldName, sanitized);
        }
        if (this.max !== undefined && sanitized.length > this.max) {
          throw new ValidationError(`Field '${fieldName}' exceeds maximum length of ${this.max}.`, fieldName, sanitized);
        }
        if (this.pattern && !this.pattern.test(sanitized)) {
          throw new ValidationError(`Field '${fieldName}' does not match required format.`, fieldName, sanitized);
        }
        value = sanitized;
      }

      // Enum checks
      if (this.enum && !this.enum.includes(value)) {
        throw new ValidationError(`Field '${fieldName}' must be one of [${this.enum.join(', ')}].`, fieldName, value);
      }

      // Custom validation logic
      if (typeof this.custom === 'function') {
        const customResult = this.custom(value);
        if (customResult !== true) {
          throw new ValidationError(
            typeof customResult === 'string' ? customResult : `Field '${fieldName}' failed custom validation.`,
            fieldName,
            value
          );
        }
      }

      return value;
    }
  }

  /**
   * Generic Schema validator
   */
  class Schema {
    constructor(fieldDefinitions) {
      this.fields = fieldDefinitions;
    }

    validate(input, isPartial = false) {
      if (input === null || typeof input !== 'object') {
        throw new ValidationError('Input payload must be an object.');
      }

      const sanitizedInput = Sanitizer.sanitizeObject(input);
      const validated = {};

      for (const [fieldName, validator] of Object.entries(this.fields)) {
        const val = sanitizedInput[fieldName];

        if (isPartial && val === undefined) {
          continue;
        }

        validated[fieldName] = validator.validate(fieldName, val);
      }

      return validated;
    }
  }

  // ==========================================
  // CONCRETE SCHEMAS FOR MARIO GAME SYSTEM
  // ==========================================

  const ProfileSchema = new Schema({
    id: new FieldValidator({
      type: 'string',
      required: true,
      min: 3,
      max: 64,
      pattern: /^[a-zA-Z0-9_-]+$/
    }),
    username: new FieldValidator({
      type: 'string',
      required: true,
      min: 2,
      max: 20,
      pattern: /^[a-zA-Z0-9_\s-]+$/
    }),
    avatar: new FieldValidator({
      type: 'string',
      required: false,
      enum: ['mario', 'luigi', 'toad', 'peach'],
      default: 'mario'
    }),
    createdAt: new FieldValidator({
      type: 'number',
      required: false,
      default: () => Date.now()
    }),
    updatedAt: new FieldValidator({
      type: 'number',
      required: false,
      default: () => Date.now()
    })
  });

  const SaveStateSchema = new Schema({
    id: new FieldValidator({
      type: 'string',
      required: true,
      pattern: /^save_[a-zA-Z0-9_-]+_\d+$/
    }),
    profileId: new FieldValidator({
      type: 'string',
      required: true,
      min: 3,
      max: 64
    }),
    slot: new FieldValidator({
      type: 'number',
      required: true,
      min: 1,
      max: 5
    }),
    world: new FieldValidator({
      type: 'number',
      required: true,
      min: 1,
      max: 8
    }),
    level: new FieldValidator({
      type: 'number',
      required: true,
      min: 1,
      max: 4
    }),
    score: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 9999990
    }),
    coins: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 99
    }),
    lives: new FieldValidator({
      type: 'number',
      required: true,
      min: 1,
      max: 99
    }),
    powerState: new FieldValidator({
      type: 'string',
      required: true,
      enum: ['small', 'super', 'fire', 'star'],
      default: 'small'
    }),
    checkpointX: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 200000,
      default: 40
    }),
    checkpointY: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 2000,
      default: 192
    }),
    timeRemaining: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 999,
      default: 400
    }),
    timestamp: new FieldValidator({
      type: 'number',
      required: false,
      default: () => Date.now()
    }),
    checksum: new FieldValidator({
      type: 'string',
      required: false,
      default: ''
    })
  });

  const HighScoreSchema = new Schema({
    id: new FieldValidator({
      type: 'string',
      required: true,
      min: 3,
      max: 64
    }),
    profileId: new FieldValidator({
      type: 'string',
      required: true,
      min: 3,
      max: 64
    }),
    playerName: new FieldValidator({
      type: 'string',
      required: true,
      min: 2,
      max: 20
    }),
    score: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 9999990
    }),
    world: new FieldValidator({
      type: 'number',
      required: true,
      min: 1,
      max: 8
    }),
    level: new FieldValidator({
      type: 'number',
      required: true,
      min: 1,
      max: 4
    }),
    timeRemaining: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 999
    }),
    achievedAt: new FieldValidator({
      type: 'number',
      required: false,
      default: () => Date.now()
    }),
    signature: new FieldValidator({
      type: 'string',
      required: false,
      default: ''
    })
  });

  const SettingsSchema = new Schema({
    id: new FieldValidator({
      type: 'string',
      required: true,
      default: 'system_settings'
    }),
    masterVolume: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      default: 80
    }),
    bgmVolume: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      default: 70
    }),
    sfxVolume: new FieldValidator({
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      default: 90
    }),
    crtFilter: new FieldValidator({
      type: 'boolean',
      required: true,
      default: true
    }),
    scanlines: new FieldValidator({
      type: 'boolean',
      required: true,
      default: true
    }),
    curvature: new FieldValidator({
      type: 'boolean',
      required: true,
      default: false
    }),
    fpsLimit: new FieldValidator({
      type: 'number',
      required: true,
      enum: [30, 60],
      default: 60
    }),
    keybindings: new FieldValidator({
      type: 'object',
      required: true,
      custom: val => {
        const requiredKeys = ['left', 'right', 'down', 'jump', 'run', 'pause'];
        for (const k of requiredKeys) {
          if (typeof val[k] !== 'string' || !val[k]) return `Missing keybinding '${k}'`;
        }
        return true;
      }
    }),
    updatedAt: new FieldValidator({
      type: 'number',
      required: false,
      default: () => Date.now()
    })
  });

  const AuditLogSchema = new Schema({
    id: new FieldValidator({
      type: 'string',
      required: true
    }),
    event: new FieldValidator({
      type: 'string',
      required: true,
      min: 3,
      max: 60
    }),
    details: new FieldValidator({
      type: 'object',
      required: true
    }),
    timestamp: new FieldValidator({
      type: 'number',
      required: false,
      default: () => Date.now()
    })
  });

  const MigrationRecordSchema = new Schema({
    version: new FieldValidator({
      type: 'number',
      required: true,
      min: 1
    }),
    name: new FieldValidator({
      type: 'string',
      required: true
    }),
    appliedAt: new FieldValidator({
      type: 'number',
      required: false,
      default: () => Date.now()
    }),
    executionTimeMs: new FieldValidator({
      type: 'number',
      required: true,
      min: 0
    }),
    status: new FieldValidator({
      type: 'string',
      required: true,
      enum: ['SUCCESS', 'FAILED']
    })
  });

  return {
    ValidationError,
    Sanitizer,
    FieldValidator,
    Schema,
    ProfileSchema,
    SaveStateSchema,
    HighScoreSchema,
    SettingsSchema,
    AuditLogSchema,
    MigrationRecordSchema
  };
});