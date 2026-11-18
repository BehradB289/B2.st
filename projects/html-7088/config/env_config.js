```javascript
/**
 * ============================================
 * B2.st Studio - Environment Configuration
 * Mario Game - 10-Layer Debug Agent
 * ============================================
 * 
 * این ماژول مسئول:
 * 1. بارگذاری و اعتبارسنجی متغیرهای محیطی
 * 2. تنظیم مقادیر پیش‌فرض امن
 * 3. جلوگیری از نشت اطلاعات حساس
 * 4. ارائه config یکپارچه به کل پروژه
 */

(function () {
  'use strict';

  // ---- Layer 1: Detection - تشخیص محیط اجرا ----
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

  // ---- Layer 2: Node.js dotenv loader ----
  if (isNode) {
    try {
      require('dotenv').config();
    } catch (e) {
      // dotenv نصب نیست - از مقادیر پیش‌فرض استفاده می‌شود
      if (process.argv.includes('--validate')) {
        console.warn('[ENV_CONFIG] Warning: dotenv not installed. Using defaults.');
      }
    }
  }

  // ---- Layer 3: Schema Definition - تعریف اسکیمای متغیرها ----
  const ENV_SCHEMA = {
    PORT: {
      type: 'number',
      default: 3000,
      min: 1024,
      max: 65535,
      required: false,
      sensitive: false,
      description: 'Server port number'
    },
    HOST: {
      type: 'string',
      default: 'localhost',
      required: false,
      sensitive: false,
      description: 'Server host'
    },
    NODE_ENV: {
      type: 'enum',
      values: ['development', 'production', 'test', 'staging'],
      default: 'production',
      required: true,
      sensitive: false,
      description: 'Runtime environment'
    },
    GAME_TITLE: {
      type: 'string',
      default: 'Super Mario Bros',
      required: false,
      sensitive: false,
      description: 'Game window title'
    },
    GAME_VERSION: {
      type: 'semver',
      default: '1.0.0',
      required: false,
      sensitive: false,
      description: 'Game version'
    },
    GAME_DEBUG_MODE: {
      type: 'boolean',
      default: false,
      required: false,
      sensitive: false,
      description: 'Enable debug overlays and logging'
    },
    GAME_FPS: {
      type: 'number',
      default: 60,
      min: 15,
      max: 144,
      required: false,
      sensitive: false,
      description: 'Target frames per second'
    },
    GAME_CANVAS_WIDTH: {
      type: 'number',
      default: 800,
      min: 320,
      max: 3840,
      required: false,
      sensitive: false,
      description: 'Canvas width in pixels'
    },
    GAME_CANVAS_HEIGHT: {
      type: 'number',
      default: 600,
      min: 240,
      max: 2160,
      required: false,
      sensitive: false,
      description: 'Canvas height in pixels'
    },
    AUDIO_ENABLED: {
      type: 'boolean',
      default: true,
      required: false,
      sensitive: false,
      description: 'Enable game audio'
    },
    AUDIO_VOLUME: {
      type: 'number',
      default: 0.7,
      min: 0.0,
      max: 1.0,
      required: false,
      sensitive: false,
      description: 'Master audio volume (0.0 - 1.0)'
    },
    ALLOWED_ORIGINS: {
      type: 'csv',
      default: 'http://localhost:3000',
      required: false,
      sensitive: false,
      description: 'Comma-separated allowed CORS origins'
    },
    CSP_ENABLED: {
      type: 'boolean',
      default: true,
      required: false,
      sensitive: false,
      description: 'Enable Content Security Policy headers'
    },
    RATE_LIMIT_MAX: {
      type: 'number',
      default: 100,
      min: 10,
      max: 10000,
      required: false,
      sensitive: false,
      description: 'Max requests per window'
    },
    RATE_LIMIT_WINDOW_MS: {
      type: 'number',
      default: 900000,
      min: 60000,
      max: 86400000,
      required: false,
      sensitive: false,
      description: 'Rate limit window in milliseconds'
    },
    ANALYTICS_ENABLED: {
      type: 'boolean',
      default: false,
      required: false,
      sensitive: false,
      description: 'Enable analytics tracking'
    },
    ANALYTICS_ENDPOINT: {
      type: 'url',
      default: '',
      required: false,
      sensitive: true,
      description: 'Analytics API endpoint'
    },
    HIGHSCORE_API_URL: {
      type: 'url',
      default: '',
      required: false,
      sensitive: true,
      description: 'High score API URL'
    },
    HIGHSCORE_API_KEY: {
      type: 'string',
      default: '',
      required: false,
      sensitive: true,
      description: 'High score API authentication key'
    }
  };

  // ---- Layer 4: Raw Value Retrieval ----
  function getRawValue(key) {
    if (isNode && process.env[key] !== undefined) {
      return process.env[key];
    }
    if (isBrowser && window.__ENV__ && window.__ENV__[key] !== undefined) {
      return window.__ENV__[key];
    }
    return undefined;
  }

  // ---- Layer 5: Type Casting & Parsing ----
  function castValue(rawValue, schema) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return schema.default;
    }

    const raw = String(rawValue).trim();

    switch (schema.type) {
      case 'number': {
        const num = Number(raw);
        if (isNaN(num)) {
          console.error(`[ENV_CONFIG] Invalid number: "${raw}", using default: ${schema.default}`);
          return schema.default;
        }
        if (schema.min !== undefined && num < schema.min) {
          console.warn(`[ENV_CONFIG] Value ${num} below min ${schema.min}, clamping.`);
          return schema.min;
        }
        if (schema.max !== undefined && num > schema.max) {
          console.warn(`[ENV_CONFIG] Value ${num} above max ${schema.max}, clamping.`);
          return schema.max;
        }
        return num;
      }

      case 'boolean': {
        const lower = raw.toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(lower)) return true;
        if (['false', '0', 'no', 'off'].includes(lower)) return false;
        console.error(`[ENV_CONFIG] Invalid boolean: "${raw}", using default: ${schema.default}`);
        return schema.default;
      }

      case 'enum': {
        if (schema.values.includes(raw)) return raw;
        console.error(`[ENV_CONFIG] Invalid enum value: "${raw}", allowed: [${schema.values.join(', ')}], using default: ${schema.default}`);
        return schema.default;
      }

      case 'csv': {
        return raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }

      case 'url': {
        if (raw === '') return '';
        try {
          new URL(raw);
          return raw;
        } catch (e) {
          console.error(`[ENV_CONFIG] Invalid URL: "${raw}", using default.`);
          return schema.default;
        }
      }

      case 'semver': {
        if (/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(raw)) return raw;
        console.error(`[ENV_CONFIG] Invalid semver: "${raw}", using default: ${schema.default}`);
        return schema.default;
      }

      case 'string':
      default:
        return raw;
    }
  }

  // ---- Layer 6: Validation Engine ----
  function validateAll() {
    const errors = [];
    const warnings = [];
    const config = {};

    for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
      const raw = getRawValue(key);
      const value = castValue(raw, schema);

      if (schema.required && (value === undefined || value === null || value === '')) {
        errors.push(`Missing required env variable: ${key} - ${schema.description}`);
      }

      config[key] = value;
    }

    // Cross-field validations
    if (config.GAME_DEBUG_MODE && config.NODE_ENV === 'production') {
      warnings.push('GAME_DEBUG_MODE is enabled in production! This may expose sensitive data.');
    }

    if (config.ANALYTICS_ENABLED && !config.ANALYTICS_ENDPOINT) {
      warnings.push('ANALYTICS_ENABLED is true but ANALYTICS_ENDPOINT is empty.');
    }

    if (config.HIGHSCORE_API_URL && !config.HIGHSCORE_API_KEY) {
      warnings.push('HIGHSCORE_API_URL is set but HIGHSCORE_API_KEY is missing.');
    }

    return { config, errors, warnings };
  }

  // ---- Layer 7: Security Sanitization ----
  function sanitizeForClient(config) {
    const safe = {};
    for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
      if (!schema.sensitive) {
        safe[key] = config[key];
      }
    }
    return Object.freeze(safe);
  }

  // ---- Layer 8: Build Configuration Object ----
  const { config: rawConfig, errors, warnings } = validateAll();

  // Log validation results
  if (errors.length > 0) {
    console.error('╔══════════════════════════════════════════╗');
    console.error('║  [ENV_CONFIG] CRITICAL VALIDATION ERRORS ║');
    console.error('╚══════════════════════════════════════════╝');
    errors.forEach(e => console.error(`  ✖ ${e}`));
  }

  if (warnings.length > 0) {
    console.warn('╔══════════════════════════════════════════╗');
    console.warn('║  [ENV_CONFIG] VALIDATION WARNINGS        ║');
    console.warn('╚══════════════════════════════════════════╝');
    warnings.forEach(w => console.warn(`  ⚠ ${w}`));
  }

  // Structured config object
  const ENV_CONFIG = Object.freeze({
    server: {
      port: rawConfig.PORT,
      host: rawConfig.HOST,
      nodeEnv: rawConfig.NODE_ENV,
      isProduction: rawConfig.NODE_ENV === 'production',
      isDevelopment: rawConfig.NODE_ENV === 'development',
      isTest: rawConfig.NODE_ENV === 'test'
    },
    game: {
      title: rawConfig.GAME_TITLE,
      version: rawConfig.GAME_VERSION,
      debugMode: rawConfig.GAME_DEBUG_MODE,
      fps: rawConfig.GAME_FPS,
      canvas: {
        width: rawConfig.GAME_CANVAS_WIDTH,
        height: rawConfig.GAME_CANVAS_HEIGHT
      }
    },
    audio: {
      enabled: rawConfig.AUDIO_ENABLED,
      volume: rawConfig.AUDIO_VOLUME
    },
    security: {
      allowedOrigins: rawConfig.ALLOWED_ORIGINS,
      cspEnabled: rawConfig.CSP_ENABLED,
      rateLimit: {
        max: rawConfig.RATE_LIMIT_MAX,
        windowMs: rawConfig.RATE_LIMIT_WINDOW_MS
      }
    },
    analytics: {
      enabled: rawConfig.ANALYTICS_ENABLED,
      endpoint: rawConfig.ANALYTICS_ENDPOINT
    },
    highscore: {
      apiUrl: rawConfig.HIGHSCORE_API_URL,
      apiKey: rawConfig.HIGHSCORE_API_KEY
    },
    _meta: {
      loadedAt: new Date().toISOString(),
      validationErrors: errors.length,
      validationWarnings: warnings.length
    }
  });

  // ---- Layer 9: Export Strategy ----
  if (isNode) {
    module.exports = ENV_CONFIG;
    module.exports.schema = ENV_SCHEMA;
    module.exports.sanitizeForClient = () => sanitizeForClient(rawConfig);

    // CLI validation mode
    if (process.argv.includes('--validate')) {
      console.log('\n╔══════════════════════════════════════════╗');
      console.log('║  B2.st Studio - ENV Validation Report    ║');
      console.log('╚══════════════════════════════════════════╝');
      console.log(`  Environment : ${ENV_CONFIG.server.nodeEnv}`);
      console.log(`  Game Title  : ${ENV_CONFIG.game.title}`);
      console.log(`  Version     : ${ENV_CONFIG.game.version}`);
      console.log(`  Debug Mode  : ${ENV_CONFIG.game.debugMode}`);
      console.log(`  FPS Target  : ${ENV_CONFIG.game.fps}`);
      console.log(`  Canvas      : ${ENV_CONFIG.game.canvas.width}x${ENV_CONFIG.game.canvas.height}`);
      console.log(`  Audio       : ${ENV_CONFIG.audio.enabled ? 'ON' : 'OFF'} (vol: ${ENV_CONFIG.audio.volume})`);
      console.log(`  CSP         : ${ENV_CONFIG.security.cspEnabled ? 'Enabled' : 'Disabled'}`);
      console.log(`  Errors      : ${errors.length}`);
      console.log(`  Warnings    : ${warnings.length}`);
      console.log(`  Status      : ${errors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
      console.log('');
      process.exit(errors.length > 0 ? 1 : 0);
    }
  }

  if (isBrowser) {
    // فقط مقادیر غیرحساس در مرورگر قابل دسترسی هستند
    window.ENV_CONFIG = sanitizeForClient(rawConfig);
    window.GAME_CONFIG = Object.freeze({
      title: rawConfig.GAME_TITLE,
      version: rawConfig.GAME_VERSION,
      debugMode: rawConfig.GAME_DEBUG_MODE,
      fps: rawConfig.GAME_FPS,
      canvasWidth: rawConfig.GAME_CANVAS_WIDTH,
      canvasHeight: rawConfig.GAME_CANVAS_HEIGHT,
      audioEnabled: rawConfig.AUDIO_ENABLED,
      audioVolume: rawConfig.AUDIO_VOLUME
    });
  }

  // ---- Layer 10: Integrity Seal ----
  if (rawConfig.GAME_DEBUG_MODE) {
    console.log('[ENV_CONFIG] ✅ Configuration loaded successfully');
    console.log(`[ENV_CONFIG] Game: ${rawConfig.GAME_TITLE} v${rawConfig.GAME_VERSION}`);
    console.log(`[ENV_CONFIG] Canvas: ${rawConfig.GAME_CANVAS_WIDTH}x${rawConfig.GAME_CANVAS_HEIGHT} @ ${rawConfig.GAME_FPS}fps`);
  }

})();
```