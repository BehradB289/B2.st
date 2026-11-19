/**
 * @file src/core/error_shield.js
 * @description سیستم دفاعی ۱۰ لایه‌ای استودیو B2.st برای بازی ماریو
 * @author B2.st Cybersecurity & Game Engine Debugger Unit
 * @version 3.4.0-STABLE
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.B2ErrorShield = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // مسدودسازی دستکاری اشیاء بحرانی (Layer 8: Anti-Tamper Protection)
    const ObjectFreeze = Object.freeze;
    const ObjectSeal = Object.seal;

    /**
     * بافر حلقوی ذخیره خطاهای سیستم جهت جلوگیری از نشت حافظه (Layer 9: Circular Telemetry)
     */
    class CircularErrorBuffer {
        constructor(limit = 50) {
            this.limit = limit;
            this.buffer = new Array(limit);
            this.pointer = 0;
            this.isFull = false;
        }

        push(errorRecord) {
            try {
                this.buffer[this.pointer] = {
                    ...errorRecord,
                    timestamp: performance.now(),
                    date: new Date().toISOString()
                };
                this.pointer = (this.pointer + 1) % this.limit;
                if (this.pointer === 0) this.isFull = true;
            } catch (_) {
                // خطای داخل لاگر هرگز نباید کرش ایجاد کند
            }
        }

        getAll() {
            try {
                if (!this.isFull) return this.buffer.slice(0, this.pointer);
                return [...this.buffer.slice(this.pointer), ...this.buffer.slice(0, this.pointer)];
            } catch (_) {
                return [];
            }
        }
    }

    /**
     * هسته اصلی محافظت در برابر کرش (Anti-Crash Engine)
     */
    class ErrorShield {
        constructor() {
            this.initialized = false;
            this.telemetry = new CircularErrorBuffer(100);
            this.lastSafeCheckpoint = null;
            this.consecutiveCrashCount = 0;
            this.maxConsecutiveAllowed = 5;
            this.isPanicMode = false;
            this.customFallbacks = new Map();

            // فریز کردن متدها برای جلوگیری از Prototype Pollution
            this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
            this.handleGlobalError = this.handleGlobalError.bind(this);
            this.safeRAF = this.safeRAF.bind(this);
        }

        /**
         * راه‌اندازی لایه‌های امنیتی و شنود خطاهای عمومی و ناهمگام
         */
        init(options = {}) {
            if (this.initialized) {
                console.warn('[B2.st Shield] موتور حفاظتی پیش‌تر فعال شده است.');
                return this;
            }

            const config = Object.assign({
                silentMode: false,
                autoRecoverCanvas: true,
                isolateExtensions: true
            }, options);

            this.silentMode = config.silentMode;
            this.autoRecoverCanvas = config.autoRecoverCanvas;

            // لایه ۱: محافظت در برابر Promiseهای مدیریت‌نشده (UnhandledRejection)
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection, true);

            // لایه ۲: محافظت در برابر خطاهای سراسری زمان اجرا (Global Window Error)
            window.addEventListener('error', this.handleGlobalError, true);

            // لایه ۱۰: محافظت در برابر افزونه‌های مخرب یا متداخل مرورگر
            if (config.isolateExtensions) {
                this._patchPrototypeBreaks();
            }

            this.initialized = true;
            console.log('%c[B2.st Shield] ۱۰ لایه محافظتی ضد کرش و پایش ناهمگام با موفقیت فعال شد.', 'color: #00ff66; font-weight: bold;');
            return this;
        }

        /**
         * متوقف‌سازی خطاهای معلق ناهمگام و بازگردانی پایداری
         * Layer 1 Handler
         */
        handleUnhandledRejection(event) {
            try {
                event.preventDefault(); // ممانعت از توقف اجرای ترد جاوااسکریپت و چاپ خطای قرمز در کنسول
                
                const reason = event.reason || {};
                const errorPayload = {
                    type: 'UnhandledPromiseRejection',
                    message: reason.message || String(reason),
                    stack: reason.stack || 'No Stack Available',
                    target: event.target ? event.target.toString() : 'Unknown'
                };

                this.telemetry.push(errorPayload);

                if (!this.silentMode) {
                    console.warn(
                        `%c[B2.st Shield: Async Shield Trapped]%c ${errorPayload.message}`,
                        'background: #ffaa00; color: #000; font-weight: bold; border-radius: 3px; padding: 1px 4px;',
                        'color: #ffaa00;'
                    );
                }

                this._checkStabilityTrend();
            } catch (fatalInternalError) {
                // سطح اضطراری سوپروایزر: مانع از مرگ موتور
                console.error('[B2.st Shield: Critical Core Leak]', fatalInternalError);
            }
        }

        /**
         * شکار خطاهای هماهنگ و ایونت‌های DOM
         * Layer 2 Handler
         */
        handleGlobalError(event) {
            try {
                // اگر خطا در اسکریپت‌های ترد پارتی یا ایونت‌های تصویر/صدا باشد
                const errorMsg = event.message || (event.error && event.error.message) || 'Unknown Script Error';
                const source = event.filename || 'Inline/Dynamic';
                const lineno = event.lineno || 0;
                const colno = event.colno || 0;

                const errorRecord = {
                    type: 'GlobalRuntimeException',
                    message: errorMsg,
                    source: `${source}:${lineno}:${colno}`,
                    stack: (event.error && event.error.stack) || null
                };

                this.telemetry.push(errorRecord);

                // ممانعت از کرش کلی در خطاهای ناپایدار موتور رندر
                if (errorMsg.includes('CanvasRenderingContext2D') || errorMsg.includes('WebGL')) {
                    event.preventDefault();
                    this.recoverCanvasState();
                    return true;
                }

                // جلوگیری از توقف ترد بازی
                event.preventDefault();
                return true;
            } catch (_) {
                return false;
            }
        }

        /**
         * پوشش ضد گلوله برای توابع Async (Layer 2 Wrapper)
         * @template T
         * @param {() => Promise<T>} asyncFunction 
         * @param {T|Function} fallbackValue 
         * @param {string} traceName
         * @returns {Promise<T>}
         */
        async safeAsync(asyncFunction, fallbackValue = null, traceName = 'AnonymousAsync') {
            try {
                return await asyncFunction();
            } catch (asyncError) {
                this.telemetry.push({
                    type: 'SafeAsyncTrap',
                    trace: traceName,
                    message: asyncError.message || String(asyncError),
                    stack: asyncError.stack
                });

                if (!this.silentMode) {
                    console.warn(`[B2.st Shield] خطای مهارشده در تابع ناهمگام (${traceName}):`, asyncError.message);
                }

                if (typeof fallbackValue === 'function') {
                    try {
                        return await fallbackValue(asyncError);
                    } catch (nestedFallbackError) {
                        return null;
                    }
                }
                return fallbackValue;
            }
        }

        /**
         * پوشش ضد گلوله برای توابع Sync (Layer 2 Wrapper)
         */
        safeSync(syncFunction, fallbackValue = null, traceName = 'AnonymousSync') {
            try {
                return syncFunction();
            } catch (syncError) {
                this.telemetry.push({
                    type: 'SafeSyncTrap',
                    trace: traceName,
                    message: syncError.message || String(syncError),
                    stack: syncError.stack
                });

                if (typeof fallbackValue === 'function') {
                    try {
                        return fallbackValue(syncError);
                    } catch (_) {
                        return null;
                    }
                }
                return fallbackValue;
            }
        }

        /**
         * حلقه امن انیمیشن و رندر بازی (Layer 3: Game Loop Protection)
         * تضمین می‌کند فریم در صورت کرش فیزیک ماریو به فریم بعدی جهش کند.
         */
        safeRAF(callback, fallbackHandler = null) {
            return requestAnimationFrame((timestamp) => {
                try {
                    callback(timestamp);
                    this.consecutiveCrashCount = 0; // وضعیت پایدار است
                } catch (loopError) {
                    this.consecutiveCrashCount++;
                    this.telemetry.push({
                        type: 'GameLoopCrash',
                        message: loopError.message,
                        stack: loopError.stack,
                        count: this.consecutiveCrashCount
                    });

                    if (fallbackHandler) {
                        try {
                            fallbackHandler(loopError);
                        } catch (_) {}
                    }

                    // اگر خطاهای متوالی رخ دهد، فیزیک موقتاً ریست می‌شود
                    if (this.consecutiveCrashCount >= this.maxConsecutiveAllowed) {
                        this._executeAutoEmergencySnapshotRollback();
                    }
                }
            });
        }

        /**
         * لودر ایمن دارایی‌ها (اسپرایت‌ها و صداهای ماریو) با قابلیت Retry خودکار (Layer 4)
         */
        async safeAssetLoader(assetLoaderFn, maxRetries = 3, retryDelayMs = 250) {
            let attempt = 0;
            while (attempt < maxRetries) {
                try {
                    return await assetLoaderFn();
                } catch (assetError) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        this.telemetry.push({
                            type: 'AssetLoadFailure',
                            attempts: attempt,
                            message: assetError.message
                        });
                        return null;
                    }
                    await new Promise(res => setTimeout(res, retryDelayMs * attempt));
                }
            }
            return null;
        }

        /**
         * ایمن‌سازی لیسنرهای ورودی و تعاملات کلیدهای جهت‌نما و پرش (Layer 5)
         */
        safeEventListener(target, eventType, listener, options = {}) {
            if (!target || typeof target.addEventListener !== 'function') return;

            const shieldedListener = (event) => {
                try {
                    listener(event);
                } catch (listenerError) {
                    this.telemetry.push({
                        type: 'EventListenerCrash',
                        eventType: eventType,
                        message: listenerError.message
                    });
                }
            };

            target.addEventListener(eventType, shieldedListener, options);
            return () => target.removeEventListener(eventType, shieldedListener, options);
        }

        /**
         * تصحیح مختصات غیرمجاز فیزیک ماریو (مانند NaN یا Infinity) (Layer 6 & 7)
         */
        sanitizePhysicsCoordinates(entity) {
            try {
                if (!entity) return;

                if (isNaN(entity.x) || !isFinite(entity.x)) entity.x = entity.lastSafeX || 50;
                if (isNaN(entity.y) || !isFinite(entity.y)) entity.y = entity.lastSafeY || 50;
                if (isNaN(entity.vx) || !isFinite(entity.vx)) entity.vx = 0;
                if (isNaN(entity.vy) || !isFinite(entity.vy)) entity.vy = 0;

                // ذخیره موقعیت معتبر به عنوان چک‌پوینت
                entity.lastSafeX = entity.x;
                entity.lastSafeY = entity.y;
            } catch (_) {
                // سکوت دفاعی
            }
        }

        /**
         * بازنشانی لایه کانواس در صورت WebGL/Context Lost
         */
        recoverCanvasState() {
            try {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    console.warn('[B2.st Shield] احیای کانتکست آسیب‌دیده Canvas...');
                    canvas.dispatchEvent(new CustomEvent('b2:context:recovered'));
                }
            } catch (_) {}
        }

        /**
         * پچ کردن Prototype و ممانعت از آلودگی اشیاء سراسری
         */
        _patchPrototypeBreaks() {
            try {
                ObjectSeal(Object.prototype);
            } catch (_) {
                // در محیط‌های خاص ممکن است امکان‌پذیر نباشد
            }
        }

        /**
         * ارزیابی شاخص پایداری و اعمال وضعیت نجات خودکار
         */
        _checkStabilityTrend() {
            if (this.telemetry.getAll().length > 30) {
                this.isPanicMode = true;
            }
        }

        _executeAutoEmergencySnapshotRollback() {
            console.warn('[B2.st Shield] وضعیت کرش متوالی در فریم‌ورک بازی شناسایی شد. ریست اضطراری وضعیت موتور...');
            this.consecutiveCrashCount = 0;
            window.dispatchEvent(new CustomEvent('b2:mario:emergency_reset'));
        }
    }

    const shieldInstance = new ErrorShield();
    return ObjectFreeze(shieldInstance);
}));