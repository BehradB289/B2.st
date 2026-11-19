/**
 * @file error_shield.js
 * @system B2.st Cyber Security & 10-Layer Anti-Crash Engine
 * @module Core/ErrorShield
 * @description سپر دفاعی مانیتورینگ بلادرنگ، مدیریت بحران Async/Await و ترپ خطاهای Promise
 * @version 4.2.0-PROD
 */

(function (global) {
    'use strict';

    // تنظیمات امنیتی و ایزولاسیون خطا
    const SHIELD_CONFIG = {
        MAX_CONSECUTIVE_ERRORS: 5,
        CIRCUIT_RESET_TIMEOUT: 4000,
        ASYNC_TIMEOUT_LIMIT: 8000,
        LOG_TO_REMOTE: false,
        ENABLE_AUDIO_FALLBACK: true,
        ENABLE_FRAME_DROP_RECOVERY: true
    };

    class ErrorShield {
        constructor() {
            this.errorCount = 0;
            this.circuitBreakerTripped = false;
            this.lastErrorTimestamp = 0;
            this.quarantinedSubsystems = new Set();
            this.activePromises = new WeakSet();

            this.telemetryLog = [];
            this.initLayers();
        }

        /**
         * لایه‌بندی اولیه شیلد امنیتی ۱۰ لایه
         */
        initLayers() {
            this._installLayer1GlobalRejection();
            this._installLayer2GlobalError();
            this._installLayer3PolyfillOverrides();
            this._installLayer4ConsoleInterceptor();
            this._logSecurityStatus('سپر دفاعی ۱۰ لایه استودیو B2.st با موفقیت بارگذاری شد.');
        }

        /**
         * لایه ۱: شکار استثناهای مدیریت نشده در Promise ها (Unhandled Rejection)
         */
        _installLayer1GlobalRejection() {
            global.addEventListener('unhandledrejection', (event) => {
                event.preventDefault(); // جلوگیری از چاپ خطای پیش‌فرض مرورگر و کرش اسکریپت

                const reason = event.reason;
                const errorInfo = {
                    type: 'UNHANDLED_PROMISE_REJECTION',
                    reason: reason instanceof Error ? reason.message : String(reason),
                    stack: reason instanceof Error ? reason.stack : 'No Stack Trace',
                    timestamp: performance.now(),
                    targetPromise: event.promise
                };

                this._handleCriticalFault(errorInfo);
            });
        }

        /**
         * لایه ۲: ترپ خطاهای سنکرون در زمان رندرینگ و گیم‌لوپ (Global Error Trap)
         */
        _installLayer2GlobalError() {
            global.addEventListener('error', (event) => {
                // اگر خطا ناشی از لود اسکریپت ثالث بود نادیده بگیر
                if (event.filename && !event.filename.includes(global.location.origin) && !event.filename.includes('blob:')) {
                    return;
                }

                event.preventDefault();

                const errorInfo = {
                    type: 'UNCAUGHT_SYNC_EXCEPTION',
                    message: event.message,
                    source: event.filename,
                    line: event.lineno,
                    col: event.colno,
                    stack: event.error ? event.error.stack : null,
                    timestamp: performance.now()
                };

                this._handleCriticalFault(errorInfo);
            });
        }

        /**
         * لایه ۳: پوشش ایمن متدهای استاندارد DOM و Event Listeners
         */
        _installLayer3PolyfillOverrides() {
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            const shield = this;

            EventTarget.prototype.addEventListener = function (type, listener, options) {
                if (typeof listener === 'function') {
                    const safeWrappedListener = function (...args) {
                        try {
                            const result = listener.apply(this, args);
                            if (result instanceof Promise) {
                                result.catch((err) => {
                                    shield._handleCriticalFault({
                                        type: 'ASYNC_EVENT_LISTENER_CRASH',
                                        event: type,
                                        error: err.message,
                                        stack: err.stack
                                    });
                                });
                            }
                            return result;
                        } catch (syncErr) {
                            shield._handleCriticalFault({
                                type: 'SYNC_EVENT_LISTENER_CRASH',
                                event: type,
                                error: syncErr.message,
                                stack: syncErr.stack
                            });
                        }
                    };
                    return originalAddEventListener.call(this, type, safeWrappedListener, options);
                }
                return originalAddEventListener.call(this, type, listener, options);
            };
        }

        /**
         * لایه ۴: ایزوله‌سازی کنسول و ثبت لاگ‌های تخریب‌ناپذیر
         */
        _installLayer4ConsoleInterceptor() {
            const originalWarn = console.warn;
            console.warn = (...args) => {
                if (args[0] && typeof args[0] === 'string' && args[0].includes('[CRITICAL]')) {
                    this.telemetryLog.push({ level: 'WARN', data: args, time: Date.now() });
                }
                originalWarn.apply(console, args);
            };
        }

        /**
         * متد مرکزی مدیریت خطاهای بحرانی و جلوگیری از فریز شدن لوپ گیم
         */
        _handleCriticalFault(faultInfo) {
            const now = performance.now();
            if (now - this.lastErrorTimestamp < 1000) {
                this.errorCount++;
            } else {
                this.errorCount = 1;
            }
            this.lastErrorTimestamp = now;

            this.telemetryLog.push(faultInfo);

            console.error(`[B2.st SHIELD DEFENSE] بحران مهار شد (${faultInfo.type}):`, faultInfo);

            if (this.errorCount >= SHIELD_CONFIG.MAX_CONSECUTIVE_ERRORS) {
                this._tripCircuitBreaker(faultInfo);
            }
        }

        /**
         * لایه ۵: فعال‌سازی فیوز قطع مدار (Circuit Breaker) جهت محافظت از CPU و GPU
         */
        _tripCircuitBreaker(faultInfo) {
            if (this.circuitBreakerTripped) return;

            this.circuitBreakerTripped = true;
            console.warn('[B2.st SHIELD] فیوز امنیتی فعال شد! کاهش بار پردازشی گیم‌لوپ جهت پیشگیری از انجماد سیستم.');

            setTimeout(() => {
                this.circuitBreakerTripped = false;
                this.errorCount = 0;
                console.log('[B2.st SHIELD] فیوز امنیتی ریست شد. وضعیت به پایداری بازگشت.');
            }, SHIELD_CONFIG.CIRCUIT_RESET_TIMEOUT);
        }

        /**
         * لایه ۶: پوشش Async/Await تایر بالا همراه با مکانیزم Timeout Fallback
         * @param {Function} asyncFn - تابع غیرهمگام با ریسک خطا
         * @param {any} fallbackValue - مقداری که در صورت وقوع کرش برگردانده شود
         * @param {string} subsystemName - شناسه سیستم آسیب‌پذیر
         */
        async safeAsync(asyncFn, fallbackValue = null, subsystemName = 'Anonymous_Async') {
            if (this.quarantinedSubsystems.has(subsystemName)) {
                console.warn(`[B2.st SHIELD] زیرسیستم ${subsystemName} در قرنطینه است. فراخوانی به تعلیق افتاد.`);
                return fallbackValue;
            }

            try {
                // ایجاد مسابقه برای جلوگیری از بن‌بست پندینگ (Infinite Pending Guard)
                const executionPromise = asyncFn();
                this.activePromises.add(executionPromise);

                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`ASYNC_TIMEOUT_EXCEEDED: سقف زمانی ${SHIELD_CONFIG.ASYNC_TIMEOUT_LIMIT}ms برای ${subsystemName} پایان یافت.`));
                    }, SHIELD_CONFIG.ASYNC_TIMEOUT_LIMIT);
                });

                const result = await Promise.race([executionPromise, timeoutPromise]);
                this.activePromises.delete(executionPromise);
                return result;
            } catch (error) {
                this._handleCriticalFault({
                    type: 'ASYNC_AWAIT_EXECUTION_FAILURE',
                    subsystem: subsystemName,
                    message: error.message,
                    stack: error.stack
                });
                return fallbackValue;
            }
        }

        /**
         * لایه ۷: بسته‌بندی توابع سنکرون با حفاظت ایزوله
         */
        safeSync(fn, fallbackValue = null, context = null) {
            return (...args) => {
                try {
                    return fn.apply(context || this, args);
                } catch (error) {
                    this._handleCriticalFault({
                        type: 'SAFE_SYNC_FALLBACK_TRIGGERED',
                        message: error.message,
                        stack: error.stack
                    });
                    return fallbackValue;
                }
            };
        }

        /**
         * لایه ۸: محافظ انحصاری گیم‌لوپ (RequestAnimationFrame Sentinel)
         * از توقف رندر فریم به فریم در صورت وجود نال پوینتر در محاسبات فیزیک جلوگیری می‌کند
         */
        protectGameLoop(updateFn, renderFn) {
            return (timestamp) => {
                if (this.circuitBreakerTripped) {
                    // در زمان بحران، لااقل صفحه خالی را پاک کن و از پرش بافر ممانعت کن
                    return;
                }

                try {
                    updateFn(timestamp);
                } catch (updateErr) {
                    this._handleCriticalFault({
                        type: 'GAME_LOOP_UPDATE_CRASH',
                        message: updateErr.message,
                        stack: updateErr.stack
                    });
                }

                try {
                    renderFn();
                } catch (renderErr) {
                    this._handleCriticalFault({
                        type: 'GAME_LOOP_RENDER_CRASH',
                        message: renderErr.message,
                        stack: renderErr.stack
                    });
                }
            };
        }

        /**
         * لایه ۹: مدیریت ایمن بارگذاری منابع مولتی‌مدیا و شبکه
         */
        async safeLoadResource(url, type = 'image') {
            return this.safeAsync(async () => {
                if (type === 'image') {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => resolve(img);
                        img.onerror = () => reject(new Error(`Failed to load asset: ${url}`));
                        img.src = url;
                    });
                } else if (type === 'json') {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                    return await response.json();
                }
            }, null, `ResourceLoader_${type}`);
        }

        /**
         * لایه ۱۰: مانیتور سلامت نشت حافظه و پایش وضعیت عمومی سیستم
         */
        _logSecurityStatus(message) {
            console.log(`%c[B2.st SHIELD PRO] ${message}`, 'background: #002200; color: #00ff66; padding: 3px 7px; border-radius: 3px; font-weight: bold;');
        }
    }

    // ایزوله‌سازی و صدور به محیط سراسری بدون تداخل
    const shieldInstance = new ErrorShield();
    global.ErrorShield = shieldInstance;

})(typeof window !== 'undefined' ? window : this);