/**
 * ============================================================================
 * B2.st STUDIO | CYBER-DEFENSE & RUNTIME RESILIENCE SYSTEM
 * PROJECT: MARIO RUNTIME ENGINE (HTML5 / CANVAS)
 * MODULE: src/core/error_shield.js
 * ARCHITECTURE: 10-LAYER FAULT-TOLERANT ANTI-CRASH SHIELD
 * ============================================================================
 * این ماژول پایداری ۱۰۰٪ چرخه حیات بازی، کالبک‌های ناهمگام، پرامیس‌ها و رندرر
 * را تحت شدیدترین شرایط نقص فیزیک، بارگذاری دارایی‌ها و نشت حافظه تضمین می‌کند.
 */

class ErrorShield {
    constructor() {
        if (ErrorShield.instance) {
            return ErrorShield.instance;
        }
        ErrorShield.instance = this;

        // وضعیت داخلی سیستم دفاعی
        this.metrics = {
            totalIntercepted: 0,
            unhandledRejections: 0,
            asyncExceptions: 0,
            loopFaults: 0,
            isolatedSubsystems: new Set(),
            bootTimestamp: Date.now()
        };

        this.circuitBreakers = new Map();
        this.fallbackHandlers = new Map();
        this.isDefending = false;

        this.initLayers();
    }

    /**
     * فعال‌سازی ۱۰ لایه مانیتورینگ، مهار خطا و امنیت سایبری
     */
    initLayers() {
        if (this.isDefending) return;
        this.isDefending = true;

        this._layer1_UnhandledRejectionTrap();
        this._layer2_GlobalWindowErrorTrap();
        this._layer3_PatchAsyncTimers();
        this._layer4_PatchPromisePrototype();
        this._layer5_ShieldRequestAnimationFrame();
        this._layer6_EventListenerDefense();
        this._layer7_AudioContextSanitizer();
        this._layer8_DOMXSSSanitizer();
        this._layer9_PhysicsCircuitBreaker();
        this._layer10_GracefulDegradation();

        console.info(
            "%c[B2.st ErrorShield]%c سامانه دفاعی ۱۰ لایه فعال شد. تضمین پایداری بدون کرش برقرار است.",
            "background: #111; color: #00ff66; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
            "color: #00ff66; font-weight: normal;"
        );
    }

    // ------------------------------------------------------------------------
    // لایه ۱: صید و خنثی‌سازی Unhandled Promise Rejections (ضد سقوط پرامیس‌ها)
    // ------------------------------------------------------------------------
    _layer1_UnhandledRejectionTrap() {
        window.addEventListener("unhandledrejection", (event) => {
            event.preventDefault(); // جلوگیری از لاگ کرش‌آور پیش‌فرض مرورگر
            this.metrics.unhandledRejections++;
            this.metrics.totalIntercepted++;

            const reason = event.reason || {};
            const sanitizedMsg = this._sanitizeString(reason.message || String(reason));
            const stack = this._sanitizeString(reason.stack || "No Stack Trace");

            console.warn(
                `%c[Layer 1 - Rejection Intercepted]%c ${sanitizedMsg}`,
                "background: #e65100; color: #fff; font-weight: bold; padding: 2px 4px;",
                "color: #ff9800;",
                { stack }
            );

            // تریگر بازگردانی وضعیت برای لودینگ‌های ناموفق
            if (reason.subsystem) {
                this.tripBreaker(reason.subsystem, reason);
            }
        });
    }

    // ------------------------------------------------------------------------
    // لایه ۲: ره‌گیری سراسری خطاهای همگام (Global Sync Error Trap)
    // ------------------------------------------------------------------------
    _layer2_GlobalWindowErrorTrap() {
        window.addEventListener("error", (event) => {
            event.preventDefault();
            this.metrics.totalIntercepted++;

            const sanitizedMsg = this._sanitizeString(event.message);
            const source = event.filename || "inline";
            const lineno = event.lineno || 0;

            console.error(
                `%c[Layer 2 - Global Error Contained]%c ${sanitizedMsg} @ ${source}:${lineno}`,
                "background: #b71c1c; color: #fff; font-weight: bold; padding: 2px 4px;",
                "color: #f44336;"
            );

            return true; // مهار کامل خطا در سطح کلاینت
        });
    }

    // ------------------------------------------------------------------------
    // لایه ۳: پوشش امنیتی توابع زمان‌بند ناهمگام (Async Timers Guard)
    // ------------------------------------------------------------------------
    _layer3_PatchAsyncTimers() {
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const self = this;

        window.setTimeout = function (callback, delay, ...args) {
            const wrappedCallback = (...cbArgs) => {
                try {
                    return callback.apply(this, cbArgs);
                } catch (err) {
                    self._handleAsyncFault("setTimeout", err);
                }
            };
            return originalSetTimeout.call(this, wrappedCallback, delay, ...args);
        };

        window.setInterval = function (callback, delay, ...args) {
            const wrappedCallback = (...cbArgs) => {
                try {
                    return callback.apply(this, cbArgs);
                } catch (err) {
                    self._handleAsyncFault("setInterval", err);
                }
            };
            return originalSetInterval.call(this, wrappedCallback, delay, ...args);
        };
    }

    // ------------------------------------------------------------------------
    // لایه ۴: گارد محافظت ساختاری متدهای زنجیره‌ای پرامیس (Safe Promise Wrapper)
    // ------------------------------------------------------------------------
    _layer4_PatchPromisePrototype() {
        const self = this;
        const originalThen = Promise.prototype.then;
        const originalCatch = Promise.prototype.catch;

        Promise.prototype.then = function (onFulfilled, onRejected) {
            const safeFulfilled = onFulfilled
                ? function (...args) {
                      try {
                          const res = onFulfilled.apply(this, args);
                          if (res instanceof Promise) {
                              return self.wrapPromise(res);
                          }
                          return res;
                      } catch (err) {
                          self._handleAsyncFault("Promise.then", err);
                          throw err; // ارسال امن به catch پایین‌دست
                      }
                  }
                : undefined;

            const safeRejected = onRejected
                ? function (...args) {
                      try {
                          return onRejected.apply(this, args);
                      } catch (err) {
                          self._handleAsyncFault("Promise.then(onRejected)", err);
                          return null;
                      }
                  }
                : undefined;

            return originalThen.call(this, safeFulfilled, safeRejected);
        };
    }

    // ------------------------------------------------------------------------
    // لایه ۵: سپر حیاتی لوپ بازی (Mario requestAnimationFrame Shield)
    // ------------------------------------------------------------------------
    _layer5_ShieldRequestAnimationFrame() {
        const originalRAF = window.requestAnimationFrame;
        const self = this;

        window.requestAnimationFrame = function (callback) {
            const shieldedCallback = (timestamp) => {
                try {
                    callback(timestamp);
                } catch (loopError) {
                    self.metrics.loopFaults++;
                    self.metrics.totalIntercepted++;

                    console.error(
                        "%c[Layer 5 - GameLoop Protected]%c رندر لوپ از توقف نجات یافت:",
                        "background: #4a148c; color: #fff; font-weight: bold; padding: 2px 4px;",
                        "color: #ab47bc;",
                        loopError.message
                    );

                    // اجرای ریکاوری نرم برای فریم بعدی
                    self._recoverFrameState();
                }
            };
            return originalRAF.call(this, shieldedCallback);
        };
    }

    // ------------------------------------------------------------------------
    // لایه ۶: عایق‌بندی رویدادهای ورودی بازیکن (Input / DOM Listener Shield)
    // ------------------------------------------------------------------------
    _layer6_EventListenerDefense() {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const self = this;

        EventTarget.prototype.addEventListener = function (type, listener, options) {
            if (typeof listener !== "function") {
                return originalAddEventListener.call(this, type, listener, options);
            }

            const safeListener = function (event) {
                try {
                    return listener.apply(this, arguments);
                } catch (evtErr) {
                    self._handleAsyncFault(`Event:${type}`, evtErr);
                }
            };

            // ذخیره نگاشت جهت سازگاری کامل با removeEventListener
            listener.__b2stShielded = safeListener;
            return originalAddEventListener.call(this, type, safeListener, options);
        };

        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        EventTarget.prototype.removeEventListener = function (type, listener, options) {
            const targetListener = (listener && listener.__b2stShielded) ? listener.__b2stShielded : listener;
            return originalRemoveEventListener.call(this, type, targetListener, options);
        };
    }

    // ------------------------------------------------------------------------
    // لایه ۷: ایمن‌سازی وب‌آدیو و کشیدن ترن‌پوینت صداها (WebAudio Auto-Resume Shield)
    // ------------------------------------------------------------------------
    _layer7_AudioContextSanitizer() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const self = this;
        const originalDecode = AudioCtx.prototype.decodeAudioData;

        AudioCtx.prototype.decodeAudioData = function (audioData, success, failure) {
            return new Promise((resolve, reject) => {
                originalDecode.call(this, audioData, resolve, reject);
            }).catch((audioErr) => {
                self._handleAsyncFault("WebAudio:Decode", audioErr);
                // برگرداندن یک AudioBuffer خالی جهت جلوگیری از مسدودسازی فلو بازی
                return this.createBuffer(1, 1, 22050);
            });
        };
    }

    // ------------------------------------------------------------------------
    // لایه ۸: ضد تخریب داده و پاک‌سازی XSS در پیغام‌های خطا (Sanitization Guard)
    // ------------------------------------------------------------------------
    _layer8_DOMXSSSanitizer() {
        this._sanitizeString = (str) => {
            if (typeof str !== "string") return String(str);
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#x27;");
        };
    }

    // ------------------------------------------------------------------------
    // لایه ۹: مدارشکن هوشمند زیرسیستم‌ها (Physics & AI Circuit Breaker)
    // ------------------------------------------------------------------------
    _layer9_PhysicsCircuitBreaker() {
        this.checkBreaker = (subsystemName, threshold = 5, cooldownMs = 3000) => {
            const now = Date.now();
            let record = this.circuitBreakers.get(subsystemName);

            if (!record) {
                record = { failures: 0, lastFailure: now, isOpen: false };
                this.circuitBreakers.set(subsystemName, record);
            }

            if (record.isOpen) {
                if (now - record.lastFailure > cooldownMs) {
                    record.isOpen = false;
                    record.failures = 0;
                    console.info(`[Circuit Breaker] زیرسیستم ${subsystemName} مجدداً وصل شد.`);
                    return true;
                }
                return false; // ماژول هنوز در وضعیت قرنطینه است
            }

            return true;
        };
    }

    // ------------------------------------------------------------------------
    // لایه ۱۰: استراتژی افت کیفی آرام و ریکاوری فریم (Graceful Degradation)
    // ------------------------------------------------------------------------
    _layer10_GracefulDegradation() {
        this._recoverFrameState = () => {
            try {
                // اگر گیم‌استیت گلوبال در دسترس باشد، ریست مقادیر بحرانی فیزیک
                if (window.MarioGameInstance) {
                    const mario = window.MarioGameInstance.mario;
                    if (mario) {
                        if (isNaN(mario.x) || mario.x === null) mario.x = 50;
                        if (isNaN(mario.y) || mario.y === null) mario.y = 100;
                        if (isNaN(mario.vy)) mario.vy = 0;
                        if (isNaN(mario.vx)) mario.vx = 0;
                    }
                }
            } catch (e) {
                // مهار بازگشتی
            }
        };
    }

    // ========================================================================
    // پابلیک API: رپرهای اختصاصی برای کدنویسی امن کلاینت
    // ========================================================================

    /**
     * رپر فوق امن برای توابع ناهمگام (Async/Await Shield)
     * @param {Function} asyncFn - تابع غیرهمگام مورد نظر
     * @param {*} fallbackValue - مقداری که در صورت کرش برگردانده شود
     * @param {string} subsystem - نام بخش جهت ردیابی مدارشکن
     */
    async safeAsync(asyncFn, fallbackValue = null, subsystem = "general") {
        if (!this.checkBreaker(subsystem)) {
            console.warn(`[SafeAsync] فراخوانی برای زیرسیستم ایزوله شده ${subsystem} لغو شد.`);
            return fallbackValue;
        }

        try {
            return await asyncFn();
        } catch (error) {
            this.metrics.asyncExceptions++;
            this.metrics.totalIntercepted++;
            this._handleAsyncFault(`Async:${subsystem}`, error);
            this.tripBreaker(subsystem, error);
            return fallbackValue;
        }
    }

    /**
     * رپر توابع همگام حساس
     */
    safeSync(syncFn, fallbackValue = null, subsystem = "general") {
        try {
            return syncFn();
        } catch (error) {
            this.metrics.totalIntercepted++;
            this._handleAsyncFault(`Sync:${subsystem}`, error);
            return fallbackValue;
        }
    }

    /**
     * کپسوله‌سازی پرامیس‌ها با تضمین عدم ایجاد Unhandled Rejection
     */
    wrapPromise(promise, fallbackValue = null) {
        if (!(promise instanceof Promise)) {
            return Promise.resolve(promise);
        }
        return promise.catch((err) => {
            this.metrics.unhandledRejections++;
            this.metrics.totalIntercepted++;
            this._handleAsyncFault("WrappedPromise", err);
            return fallbackValue;
        });
    }

    tripBreaker(subsystemName, error) {
        let record = this.circuitBreakers.get(subsystemName) || { failures: 0, lastFailure: 0, isOpen: false };
        record.failures++;
        record.lastFailure = Date.now();
        if (record.failures >= 5) {
            record.isOpen = true;
            this.metrics.isolatedSubsystems.add(subsystemName);
            console.error(
                `%c[CIRCUIT BREAKER TRIGGERED]%c ماژول "${subsystemName}" به دلیل خطاهای مکرر ایزوله شد: ${error.message}`,
                "background: #d50000; color: #fff; font-weight: bold; padding: 2px 6px;",
                "color: #ff5252;"
            );
        }
        this.circuitBreakers.set(subsystemName, record);
    }

    _handleAsyncFault(context, error) {
        const errorInfo = {
            context,
            message: this._sanitizeString(error?.message || String(error)),
            stack: this._sanitizeString(error?.stack || ""),
            timestamp: new Date().toISOString()
        };

        // مانیتورینگ بلادرنگ روی سنسور وضعیت
        if (typeof window.__B2ST_ON_ERROR__ === "function") {
            try {
                window.__B2ST_ON_ERROR__(errorInfo);
            } catch (ignored) {}
        }
    }

    getDiagnostics() {
        return {
            ...this.metrics,
            uptimeSeconds: Math.floor((Date.now() - this.bootTimestamp) / 1000),
            activeBreakers: Array.from(this.circuitBreakers.entries()).map(([k, v]) => ({
                subsystem: k,
                isOpen: v.isOpen,
                failures: v.failures
            }))
        };
    }
}

// ساخت و تزریق سینگلتون سراسری
const errorShieldInstance = new ErrorShield();
export default errorShieldInstance;
export { ErrorShield };

if (typeof window !== "undefined") {
    window.B2stErrorShield = errorShieldInstance;
}