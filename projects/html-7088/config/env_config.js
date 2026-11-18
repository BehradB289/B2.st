```javascript
/**
 * ============================================
 * B2.st Studio - Environment Configuration
 * Mario Game - Centralized Config Manager
 * ============================================
 * 
 * ماژول مرکزی مدیریت متغیرهای محیطی
 * شامل: اعتبارسنجی، مقادیر پیش‌فرض، تبدیل نوع، حفاظت امنیتی
 */

(function (root, factory) {
    // سازگاری با CommonJS / AMD / Browser Global
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.EnvConfig = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

    'use strict';

    // ──────────────────────────────────────────
    // Layer 1: Raw Environment Parser
    // ──────────────────────────────────────────
    const RawParser = {
        _cache: null,

        /**
         * پارس فایل .env از متن خام
         */
        parseEnvString(envContent) {
            const result = {};
            if (!envContent || typeof envContent !== 'string') return result;

            const lines = envContent.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // رد کردن خطوط خالی و کامنت‌ها
                if (!line || line.startsWith('#') || line.startsWith('//')) continue;

                const eqIndex = line.indexOf('=');
                if (eqIndex === -1) continue;

                const key = line.substring(0, eqIndex).trim();
                let value = line.substring(eqIndex + 1).trim();

                // حذف کوتیشن‌ها
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                // حذف کامنت‌های inline
                const commentIndex = value.indexOf(' #');
                if (commentIndex > -1) {
                    value = value.substring(0, commentIndex).trim();
                }

                if (key && /^[A-Z_][A-Z0-9_]*$/i.test(key)) {
                    result[key] = value;
                }
            }
            return result;
        },

        /**
         * بارگذاری async فایل .env (برای محیط مرورگر)
         */
        async loadFromFile(path) {
            if (this._cache) return this._cache;
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    console.warn(`[EnvConfig] فایل ${path} یافت نشد. از مقادیر پیش‌فرض استفاده می‌شود.`);
                    return {};
                }
                const text = await response.text();
                this._cache = this.parseEnvString(text);
                return this._cache;
            } catch (e) {
                console.warn('[EnvConfig] خطا در بارگذاری .env:', e.message);
                return {};
            }
        },

        clearCache() {
            this._cache = null;
        }
    };

    // ──────────────────────────────────────────
    // Layer 2: Type Converter & Validator
    // ──────────────────────────────────────────
    const TypeConverter = {
        toNumber(value, fallback) {
            if (value === undefined || value === null || value === '') return fallback;
            const num = Number(value);
            return isNaN(num) ? fallback : num;
        },

        toBoolean(value, fallback) {
            if (value === undefined || value === null || value === '') return fallback;
            if (typeof value === 'boolean') return value;
            const str = String(value).toLowerCase().trim();
            if (['true', '1', 'yes', 'on'].includes(str)) return true;
            if (['false', '0', 'no', 'off'].includes(str)) return false;
            return fallback;
        },

        toString(value, fallback) {
            if (value === undefined || value === null) return fallback;
            return String(value);
        },

        toArray(value, fallback, separator) {
            if (value === undefined || value === null || value === '') return fallback;
            return String(value).split(separator || ',').map(s => s.trim()).filter(Boolean);
        },

        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }
    };

    // ──────────────────────────────────────────
    // Layer 3: Security Sanitizer
    // ──────────────────────────────────────────
    const SecuritySanitizer = {
        /**
         * پاکسازی رشته از کاراکترهای خطرناک
         */
        sanitizeString(value) {
            if (typeof value !== 'string') return value;
            return value
                .replace(/[<>]/g, '')           // XSS basic
                .replace(/javascript:/gi, '')    // Protocol injection
                .replace(/on\w+\s*=/gi, '')     // Event handler injection
                .replace(/\x00/g, '')           // Null byte
                .trim();
        },

        /**
         * اعتبارسنجی مسیر فایل (جلوگیری از Path Traversal)
         */
        sanitizePath(value) {
            if (typeof value !== 'string') return value;
            return value
                .replace(/\.\.\//g, '')         // Directory traversal
                .replace(/\.\.\\/g, '')
                .replace(/[;|&$`]/g, '')        // Command injection chars
                .replace(/\x00/g, '')
                .trim();
        },

        /**
         * اعتبارسنجی URL
         */
        isValidOrigin(value) {
            if (value === '*') return true;
            try {
                new URL(value);
                return true;
            } catch {
                return /^https?:\/\/[\w.-]+(:\d+)?$/.test(value);
            }
        },

        /**
         * فریز عمیق آبجکت برای جلوگیری از تغییر در runtime
         */
        deepFreeze(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            Object.freeze(obj);
            Object.getOwnPropertyNames(obj).forEach(prop => {
                const val = obj[prop];
                if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
                    this.deepFreeze(val);
                }
            });
            return obj;
        }
    };

    // ──────────────────────────────────────────
    // Layer 4: Schema Definition
    // ──────────────────────────────────────────
    const CONFIG_SCHEMA = {
        // ── General ──
        NODE_ENV: {
            type: 'string',
            default: 'development',
            allowed: ['development', 'production', 'test', 'staging'],
            description: 'محیط اجرا'
        },
        APP_NAME: {
            type: 'string',
            default: 'mario-game-b2st',
            description: 'نام اپلیکیشن'
        },
        APP_VERSION: {
            type: 'string',
            default: '1.0.0',
            pattern: /^\d+\.\d+\.\d+$/,
            description: 'نسخه اپلیکیشن'
        },
        APP_PORT: {
            type: 'number',
            default: 8080,
            min: 1024,
            max: 65535,
            description: 'پورت سرور'
        },
        APP_HOST: {
            type: 'string',
            default: 'localhost',
            description: 'هاست سرور'
        },

        // ── Game Settings ──
        GAME_CANVAS_WIDTH: {
            type: 'number',
            default: 768,
            min: 320,
            max: 3840,
            description: 'عرض کنواس بازی'
        },
        GAME_CANVAS_HEIGHT: {
            type: 'number',
            default: 720,
            min: 240,
            max: 2160,
            description: 'ارتفاع کنواس بازی'
        },
        GAME_FPS: {
            type: 'number',
            default: 60,
            min: 24,
            max: 144,
            description: 'فریم بر ثانیه'
        },
        GAME_GRAVITY: {
            type: 'number',
            default: 0.7,
            min: 0.1,
            max: 5.0,
            description: 'شتاب گرانش'
        },
        GAME_FRICTION: {
            type: 'number',
            default: 0.8,
            min: 0.0,
            max: 1.0,
            description: 'ضریب اصطکاک'
        },
        GAME_DEBUG_MODE: {
            type: 'boolean',
            default: false,
            description: 'حالت دیباگ'
        },
        GAME_SHOW_FPS: {
            type: 'boolean',
            default: false,
            description: 'نمایش FPS'
        },
        GAME_SHOW_HITBOX: {
            type: 'boolean',
            default: false,
            description: 'نمایش Hitbox'
        },
        GAME_MUTE_AUDIO: {
            type: 'boolean',
            default: false,
            description: 'بی‌صدا کردن'
        },
        GAME_MASTER_VOLUME: {
            type: 'number',
            default: 0.7,
            min: 0.0,
            max: 1.0,
            description: 'حجم صدای اصلی'
        },
        GAME_INITIAL_LIVES: {
            type: 'number',
            default: 3,
            min: 1,
            max: 99,
            description: 'جان‌های اولیه'
        },
        GAME_MAX_LEVEL: {
            type: 'number',
            default: 8,
            min: 1,
            max: 100,
            description: 'حداکثر مراحل'
        },
        GAME_TILE_SIZE: {
            type: 'number',
            default: 16,
            min: 8,
            max: 128,
            description: 'اندازه تایل'
        },
        GAME_SCALE_FACTOR: {
            type: 'number',
            default: 2,
            min: 1,
            max: 8,
            description: 'ضریب بزرگنمایی'
        },

        // ── Player Physics ──
        PLAYER_SPEED: {
            type: 'number',
            default: 3.5,
            min: 0.5,
            max: 20.0,
            description: 'سرعت بازیکن'
        },
        PLAYER_JUMP_FORCE: {
            type: 'number',
            default: -12,
            min: -30,
            max: -1,
            description: 'نیروی پرش'
        },
        PLAYER_MAX_FALL_SPEED: {
            type: 'number',
            default: 8,
            min: 1,
            max: 30,
            description: 'حداکثر سرعت سقوط'
        },
        PLAYER_ACCELERATION: {
            type: 'number',
            default: 0.5,
            min: 0.05,
            max: 5.0,
            description: 'شتاب بازیکن'
        },
        PLAYER_DECELERATION: {
            type: 'number',
            default: 0.3,
            min: 0.05,
            max: 5.0,
            description: 'کاهش شتاب بازیکن'
        },
        PLAYER_INVINCIBILITY_DURATION: {
            type: 'number',
            default: 2000,
            min: 500,
            max: 10000,
            description: 'مدت شکست‌ناپذیری (ms)'
        },

        // ── Asset Paths ──
        ASSETS_BASE_PATH: {
            type: 'path',
            default: './assets',
            description: 'مسیر پایه دارایی‌ها'
        },
        ASSETS_SPRITES_PATH: {
            type: 'path',
            default: './assets/sprites',
            description: 'مسیر اسپرایت‌ها'
        },
        ASSETS_AUDIO_PATH: {
            type: 'path',
            default: './assets/audio',
            description: 'مسیر فایل‌های صوتی'
        },
        ASSETS_LEVELS_PATH: {
            type: 'path',
            default: './assets/levels',
            description: 'مسیر فایل‌های مراحل'
        },
        ASSETS_FONTS_PATH: {
            type: 'path',
            default: './assets/fonts',
            description: 'مسیر فونت‌ها'
        },

        // ── Security ──
        SECURITY_CSP_ENABLED: {
            type: 'boolean',
            default: true,
            description: 'فعال‌سازی CSP'
        },
        SECURITY_CORS_ORIGIN: {
            type: 'string',
            default: '*',
            description: 'مبدأ CORS'
        },
        SECURITY_RATE_LIMIT: {
            type: 'number',
            default: 100,
            min: 10,
            max: 10000,
            description: 'محدودیت نرخ درخواست'
        },
        SECURITY_XSS_PROTECTION: {
            type: 'boolean',
            default: true,
            description: 'محافظت XSS'
        },

        // ── Analytics ──
        ANALYTICS_ENABLED: {
            type: 'boolean',
            default: false,
            description: 'فعال‌سازی آنالیتیکس'
        },
        ANALYTICS_TRACKING_ID: {
            type: 'string',
            default: '',
            description: 'شناسه ردیابی'
        },
        ANALYTICS_ENDPOINT: {
            type: 'string',
            default: '',
            description: 'آدرس سرور آنالیتیکس'
        },

        // ── Build ──
        BUILD_MINIFY: {
            type: 'boolean',
            default: true,
            description: 'فشرده‌سازی خروجی'
        },
        BUILD_SOURCEMAP: {
            type: 'boolean',
            default: false,
            description: 'تولید sourcemap'
        },
        BUILD_OUTPUT_DIR: {
            type: 'path',
            default: './dist',
            description: 'مسیر خروجی بیلد'
        },
        BUILD_CACHE_BUST: {
            type: 'boolean',
            default: true,
            description: 'شکستن کش مرورگر'
        }
    };

    // ──────────────────────────────────────────
    // Layer 5: Config Builder & Validator
    // ──────────────────────────────────────────
    class ConfigBuilder {
        constructor() {
            this._raw = {};
            this._errors = [];
            this._warnings = [];
        }

        /**
         * ساخت کانفیگ از منابع مختلف
         */
        build(rawEnv) {
            this._raw = rawEnv || {};
            this._errors = [];
            this._warnings = [];

            const config = {};

            for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
                const rawValue = this._raw[key];
                const resolved = this._resolveValue(key, rawValue, schema);
                this._setNestedKey(config, key, resolved);
            }

            return {
                config,
                errors: [...this._errors],
                warnings: [...this._warnings],
                isValid: this._errors.length === 0
            };
        }

        _resolveValue(key, rawValue, schema) {
            let value;

            switch (schema.type) {
                case 'number':
                    value = TypeConverter.toNumber(rawValue, schema.default);
                    if (schema.min !== undefined && schema.max !== undefined) {
                        const clamped = TypeConverter.clamp(value, schema.min, schema.max);
                        if (clamped !== value) {
                            this._warnings.push(
                                `[${key}] مقدار ${value} خارج از محدوده [${schema.min}, ${schema.max}] بود. تصحیح به ${clamped}`
                            );
                            value = clamped;
                        }
                    }
                    break;

                case 'boolean':
                    value = TypeConverter.toBoolean(rawValue, schema.default);
                    break;

                case 'path':
                    value = TypeConverter.toString(rawValue, schema.default);
                    value = SecuritySanitizer.sanitizePath(value);
                    break;

                case 'string':
                default:
                    value = TypeConverter.toString(rawValue, schema.default);
                    value = SecuritySanitizer.sanitizeString(value);

                    if (schema.allowed && !schema.allowed.includes(value)) {
                        this._errors.push(
                            `[${key}] مقدار "${value}" مجاز نیست. مقادیر مجاز: ${schema.allowed.join(', ')}`
                        );
                        value = schema.default;
                    }

                    if (schema.pattern && !schema.pattern.test(value)) {
                        this._warnings.push(
                            `[${key}] مقدار "${value}" با الگوی مورد انتظار مطابقت ندارد. از پیش‌فرض استفاده شد.`
                        );
                        value = schema.default;
                    }
                    break;
            }

            return value;
        }

        /**
         * تبدیل GAME_CANVAS_WIDTH به config.game.canvasWidth
         */
        _setNestedKey(obj, envKey, value) {
            const parts = envKey.toLowerCase().split('_');
            const category = parts[0];

            if (!obj[category]) obj[category] = {};

            const propName = parts.slice(1).map((p, i) =>
                i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)
            ).join('');

            obj[category][propName] = value;
        }
    }

    // ──────────────────────────────────────────
    // Layer 6: Runtime Config Manager (Singleton)
    // ──────────────────────────────────────────
    class EnvConfig {
        constructor() {
            if (EnvConfig._instance) {
                return EnvConfig._instance;
            }

            this._config = null;
            this._initialized = false;
            this._builder = new ConfigBuilder();
            this._listeners = new Map();
            this._initTimestamp = Date.now();

            EnvConfig._instance = this;
        }

        /**
         * مقداردهی اولیه - sync با مقادیر پیش‌فرض
         */
        initSync(overrides) {
            const rawEnv = Object.assign({}, overrides || {});
            const result = this._builder.build(rawEnv);

            this._handleBuildResult(result);
            this._config = SecuritySanitizer.deepFreeze(result.config);
            this._initialized = true;

            console.log('[EnvConfig] ✅ مقداردهی اولیه sync انجام شد');
            return this;
        }

        /**
         * مقداردهی اولیه - async با بارگذاری فایل .env
         */
        async init(envFilePath, overrides) {
            const fileEnv = await RawParser.loadFromFile(envFilePath || './.env');
            const rawEnv = Object.assign({}, fileEnv, overrides || {});
            const result = this._builder.build(rawEnv);

            this._handleBuildResult(result);
            this._config = SecuritySanitizer.deepFreeze(result.config);
            this._initialized = true;

            console.log('[EnvConfig] ✅ مقداردهی اولیه async انجام شد');
            return this;
        }

        /**
         * دریافت مقدار کانفیگ با dot notation
         * مثال: get('game.canvasWidth')
         */
        get(path, fallback) {
            this._ensureInitialized();

            if (!path) return this._config;

            const parts = path.split('.');
            let current = this._config;

            for (const part of parts) {
                if (current === null || current === undefined || typeof current !== 'object') {
                    return fallback;
                }
                current = current[part];
            }

            return current !== undefined ? current : fallback;
        }

        /**
         * دریافت کل کانفیگ
         */
        getAll() {
            this._ensureInitialized();
            return this._config;
        }

        /**
         * دریافت کانفیگ یک دسته
         */
        getCategory(category) {
            this._ensureInitialized();
            return this._config[category] || {};
        }

        /**
         * بررسی محیط
         */
        isDev() {
            return this.get('node.env') === 'development';
        }

        isProd() {
            return this.get('node.env') === 'production';
        }

        isDebug() {
            return this.get('game.debugMode', false);
        }

        /**
         * اعتبارسنجی مستقل (برای CLI)
         */
        validate(rawEnv) {
            const result = this._builder.build(rawEnv || {});
            return {
                isValid: result.isValid,
                errors: result.errors,
                warnings: result.warnings
            };
        }

        /**
         * تولید گزارش وضعیت
         */
        getReport() {
            this._ensureInitialized();
            return {
                initialized: this._initialized,
                timestamp: this._initTimestamp,
                environment: this.get('node.env'),
                version: this.get('app.version'),
                debug: this.isDebug(),
                configKeys: this._countKeys(this._config),
                memoryUsage: this._estimateMemory()
            };
        }

        /**
         * خروجی مناسب برای game engine
         */
        toGameConfig() {
            this._ensureInitialized();
            return {
                canvas: {
                    width: this.get('game.canvasWidth'),
                    height: this.get('game.canvasHeight'),
                    scale: this.get('game.scaleFactor')
                },
                physics: {
                    gravity: this.get('game.gravity'),
                    friction: this.get('game.friction'),
                    tileSize: this.get('game.tileSize')
                },
                player: {
                    speed: this.get('player.speed'),
                    jumpForce: this.get('player.jumpForce'),
                    maxFallSpeed: this.get('player.maxFallSpeed'),
                    acceleration: this.get('player.acceleration'),
                    deceleration: this.get('player.deceleration'),
                    invincibilityDuration: this.get('player.invincibilityDuration')
                },
                display: {
                    fps: this.get('game.fps'),
                    showFps: this.get('game.showFps'),
                    showHitbox: this.get('game.showHitbox')
                },
                audio: {
                    muted: this.get('game.muteAudio'),
                    masterVolume: this.get('game.masterVolume')
                },
                gameplay: {
                    initialLives: this.get('game.initialLives'),
                    maxLevel: this.get('game.maxLevel')
                },
                assets: {
                    base: this.get('assets.basePath'),
                    sprites: this.get('assets.spritesPath'),
                    audio: this.get('assets.audioPath'),
                    levels: this.get('assets.levelsPath'),
                    fonts: this.get('assets.fontsPath')
                },
                debug: this.isDebug()
            };
        }

        // ── Private Methods ──

        _ensureInitialized() {
            if (!this._initialized) {
                console.warn('[EnvConfig] ⚠️ هنوز مقداردهی نشده. initSync فراخوانی می‌شود...');
                this.initSync();
            }
        }

        _handleBuildResult(result) {
            if (result.warnings.length > 0) {
                console.warn('[EnvConfig] ⚠️ هشدارها:');
                result.warnings.forEach(w => console.warn('  →', w));
            }
            if (result.errors.length > 0) {
                console.error('[EnvConfig] ❌ خطاها:');
                result.errors.forEach(e => console.error('  →', e));
            }
        }

        _countKeys(obj, count) {
            count = count || 0;
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    count++;
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        count = this._countKeys(obj[key], count);
                    }
                }
            }
            return count;
        }

        _estimateMemory() {
            try {
                return new Blob([JSON.stringify(this._config)]).size + ' bytes';
            } catch {
                return 'N/A';
            }
        }

        /**
         * ریست Singleton (فقط برای تست)
         */
        static _reset() {
            EnvConfig._instance = null;
        }
    }

    EnvConfig._instance = null;

    // ──────────────────────────────────────────
    // Layer 7: CSP Header Generator
    // ──────────────────────────────────────────
    const CSPGenerator = {
        generate(config) {
            if (!config || !config.get('security.cspEnabled')) return '';

            const directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "media-src 'self' blob:",
                "font-src 'self'",
                "connect-src 'self'",
                "frame-src 'none'",
                "object-src 'none'",
                "base-uri 'self'"
            ];

            return directives.join('; ');
        },

        applyToDocument(config) {
            if (typeof document === 'undefined') return;

            const csp = this.generate(config);
            if (!csp) return;

            let meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('http-equiv', 'Content-Security-Policy');
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', csp);
        }
    };

    // ──────────────────────────────────────────
    // Layer 8: CLI Validator (Node.js only)
    // ──────────────────────────────────────────
    if (typeof process !== 'undefined' && process.argv && process.argv.includes('--validate')) {
        (function runCLIValidation() {
            const fs = require('fs');
            const path = require('path');

            console.log('╔══════════════════════════════════════════╗');
            console.log('║  B2.st Studio - Env Config Validator     ║');
            console.log('╚══════════════════════════════════════════╝');
            console.log('');

            const envPath = path.resolve(process.cwd(), '.env');
            const examplePath = path.resolve(process.cwd(), '.env.example');

            // بررسی وجود .env
            if (!fs.existsSync(envPath)) {
                console.error('❌ فایل .env یافت نشد!');
                if (fs.existsSync(examplePath)) {
                    console.log('💡 از دستور زیر استفاده کنید:');
                    console.log('   cp .env.example .env');
                }
                process.exit(1);
            }

            const envContent = fs.readFileSync(envPath, 'utf-8');
            const rawEnv = RawParser.parseEnvString(envContent);

            const instance = new EnvConfig();
            EnvConfig._reset();
            const newInstance = new EnvConfig();
            const result = newInstance.validate(rawEnv);

            console.log(`📋 کلیدهای یافت‌شده: ${Object.keys(rawEnv).length}`);
            console.log(`📋 کلیدهای اسکیما: ${Object.keys(CONFIG_SCHEMA).length}`);
            console.log('');

            // بررسی کلیدهای گمشده
            const missingKeys = Object.keys(CONFIG_SCHEMA).filter(k => !(k in rawEnv));
            if (missingKeys.length > 0) {
                console.warn(`⚠️  کلیدهای گمشده (از پیش‌فرض استفاده می‌شود):`);
                missingKeys.forEach(k => {
                    console.warn(`   → ${k} = ${CONFIG_SCHEMA[k].default}`);
                });
                console.log('');
            }

            // بررسی کلیدهای اضافی
            const extraKeys = Object.keys(rawEnv).filter(k => !(k in CONFIG_SCHEMA));
            if (extraKeys.length > 0) {
                console.warn(`⚠️  کلیدهای ناشناخته (نادیده گرفته می‌شوند):`);
                extraKeys.forEach(k => console.warn(`   → ${k}`));
                console.log('');
            }

            if (result.warnings.length > 0) {
                console.warn('⚠️  هشدارها:');
                result.warnings.forEach(w => console.warn(`   → ${w}`));
                console.log('');
            }

            if (result.errors.length > 0) {
                console.error('❌ خطاها:');
                result.errors.forEach(e => console.error(`   → ${e}`));
                console.log('');
                process.exit(1);
            }

            console.log('✅ اعتبارسنجی با موفقیت انجام شد!');
            process.exit(0);
        })();
    }

    // ──────────────────────────────────────────
    // Layer 9: Auto-Init for Browser
    // ──────────────────────────────────────────
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', function () {
            const config = new EnvConfig();
            if (!config._initialized) {
                config.initSync();
                CSPGenerator.applyToDocument(config);
            }
            window.GameConfig = config;
            window.GAME = config.toGameConfig();

            if (config.isDebug()) {
                console.log('[EnvConfig] 🎮 Game Config:', window.GAME);
                console.log('[EnvConfig] 📊 Report:', config.getReport());
            }
        });
    }

    // ──────────────────────────────────────────
    // Layer 10: Public API Export
    // ──────────────────────────────────────────
    return {
        EnvConfig,
        ConfigBuilder,
        RawParser,
        TypeConverter,
        SecuritySanitizer,
        CSPGenerator,
        CONFIG_SCHEMA,

        // Shortcut factory
        create(overrides) {
            const instance = new EnvConfig();
            instance.initSync(overrides);
            return instance;
        },

        async createAsync(envPath, overrides) {
            const instance = new EnvConfig();
            await instance.init(envPath, overrides);
            return instance;
        }
    };
});
```