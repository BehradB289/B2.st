/**
 * @file src/core/error_shield.js
 * @description سپر دفاعی ضد کرش، مانیتورینگ امنیتی و مدیریت خطاهای آسنکرون ۱۰ لایه
 * @author B2.st Studio - Cyber Security & Game Engine Core Team
 */

class ErrorShield {
    constructor() {
        this.initialized = false;
        this.errorLog = [];
        this.maxLogSize = 100;
        this.circuitBreakers = new Map();
        this.fallbackStates = new Map();
        this.subsystemThresholds = {
            AUDIO: 3,
            RENDER: 5,
            PHYSICS: 3,
            ASSETS: 10,
            INPUT: 5
        };

        // لایه ۱: ایزوله‌سازی کانتکست بایندینگ
        this.handleGlobalError = this.handleGlobalError.bind(this);
        this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    }

    /**
     * فعال‌سازی سپر دفاعی و اتصال هوک‌های محافظتی سطح موتور جاوااسکریپت
     */
    init() {
        if (this.initialized) return;

        // لایه ۲: ره‌گیری Unhandled Rejections در اکوسیستم Promiseها
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

        // لایه ۳: ره‌گیری خطاهای عمومی و باگ‌های مدیریت‌نشده رانتایم
        window.addEventListener('error', this.handleGlobalError);

        this.initialized = true;
        console.info('[B2.st ErrorShield] ۱۰ لایه مانیتورینگ و آنتی‌کرش با موفقیت فعال شد.');
    }

    /**
     * هوک اختصاصی مدیریت Unhandled Promise Rejections
     * جلوگیری از توقف ترد انیمیشن و لاگ حملات/خطاهای لودینگ
     */
    handleUnhandledRejection(event) {
        event.preventDefault(); // جلوگیری از توقف موتور مرورگر و چاپ ارور قرمز کریتیکال

        const reason = event.reason || {};
        const errorData = {
            layer: 'PROMISE_DEFENSE_LAYER',
            type: 'UnhandledRejection',
            message: reason.message || String(reason),
            stack: reason.stack || 'No Stack Trace',
            timestamp: performance.now(),
            origin: event.target
        };

        this.logIncident(errorData);
        this.resolveRejectionSafely(reason);
    }

    /**
     * هوک اختصاصی مدیریت خطاهای سراسری (Window Errors)
     */
    handleGlobalError(event) {
        // جلوگیری از توقف رندر و مسدودسازی ورودی کاربر
        event.preventDefault();

        const errorData = {
            layer: 'RUNTIME_EXECUTION_LAYER',
            type: 'GlobalRuntimeError',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error ? event.error.stack : null,
            timestamp: performance.now()
        };

        this.logIncident(errorData);
    }

    /**
     * لایه ۴: پوشش امنیتی توابع آسنکرون (Async/Await Protector)
     * @param {Function} asyncFn - تابع آسنکرون مورد نظر
     * @param {*} fallbackValue - مقدار بازگشتی جایگزین در صورت شکست
     * @param {string} subsystem - زیرسیستم مربوطه (AUDIO, ASSETS, ...)
     * @returns {Promise<*>}
     */
    async safeAsync(asyncFn, fallbackValue = null, subsystem = 'GENERAL') {
        if (this.isCircuitOpen(subsystem)) {
            console.warn(`[ErrorShield] زیرسیستم ${subsystem} مسدود شده است. عملیات لغو شد.`);
            return fallbackValue;
        }

        try {
            return await asyncFn();
        } catch (error) {
            this.tripCircuit(subsystem);
            this.logIncident({
                layer: 'ASYNC_WRAPPER_LAYER',
                subsystem,
                message: error.message,
                stack: error.stack,
                timestamp: performance.now()
            });
            return fallbackValue;
        }
    }

    /**
     * لایه ۵: پوشش امنیتی متدهای سنکرون (Sync Shield)
     * @param {Function} fn - تابع سنکرون
     * @param {*} fallbackValue - مقدار جایگزین
     * @param {string} subsystem - نام زیرسیستم
     * @returns {*}
     */
    safeSync(fn, fallbackValue = null, subsystem = 'GENERAL') {
        if (this.isCircuitOpen(subsystem)) return fallbackValue;

        try {
            return fn();
        } catch (error) {
            this.tripCircuit(subsystem);
            this.logIncident({
                layer: 'SYNC_WRAPPER_LAYER',
                subsystem,
                message: error.message,
                stack: error.stack,
                timestamp: performance.now()
            });
            return fallbackValue;
        }
    }

    /**
     * لایه ۶: محافظ حلقه اجرای بازی (Game Loop Shield)
     * ممانعت از کرش دائم requestAnimationFrame هنگام پرتاب Exception در فیزیک یا رندر
     * @param {Function} loopFn - تابع Tick حلقه بازی
     * @returns {Function}
     */
    wrapGameLoop(loopFn) {
        return (deltaTime) => {
            try {
                loopFn(deltaTime);
            } catch (fatalLoopError) {
                this.logIncident({
                    layer: 'GAME_LOOP_SHIELD',
                    message: fatalLoopError.message,
                    stack: fatalLoopError.stack,
                    timestamp: performance.now()
                });

                // ریکاوری سریع: متوقف نشدن فریم رندر، پاک‌سازی پوزیشن‌های ماریو از مقادیر نامعتبر NaN
                this.recoverLoopState();
            }
        };
    }

    /**
     * لایه ۷: بازیابی خودکار وضعیت‌های مسموم‌شده (Physics & State Sanitizer)
     * پاک‌سازی مقادیر NaN، Infinity یا مقادیر هک‌شده در موجودیت‌های بازی
     */
    sanitizeVector(vec, fallback = { x: 0, y: 0 }) {
        if (
            typeof vec?.x !== 'number' || isNaN(vec.x) || !isFinite(vec.x) ||
            typeof vec?.y !== 'number' || isNaN(vec.y) || !isFinite(vec.y)
        ) {
            this.logIncident({
                layer: 'STATE_SANITIZATION_LAYER',
                message: 'شناسایی و تصحیح بردار نامعتبر فیزیک (NaN/Infinite detected).',
                timestamp: performance.now()
            });
            return { x: fallback.x, y: fallback.y };
        }
        return vec;
    }

    /**
     * لایه ۸: معماری Circuit Breaker برای زیرسیستم‌های حساس
     */
    tripCircuit(subsystem) {
        const currentCount = (this.circuitBreakers.get(subsystem) || 0) + 1;
        this.circuitBreakers.set(subsystem, currentCount);

        const limit = this.subsystemThresholds[subsystem] || 5;
        if (currentCount >= limit) {
            console.error(`[ErrorShield Critical] Circuit Breaker زیرسیستم ${subsystem} قطع شد. ایزولاسیون فعال است.`);
        }
    }

    isCircuitOpen(subsystem) {
        const count = this.circuitBreakers.get(subsystem) || 0;
        const limit = this.subsystemThresholds[subsystem] || 5;
        return count >= limit;
    }

    resetCircuit(subsystem) {
        this.circuitBreakers.set(subsystem, 0);
    }

    /**
     * لایه ۹: ریکاوری خطاهای Rejection در لودینگ است‌ها و صداها
     */
    resolveRejectionSafely(reason) {
        if (typeof reason === 'string' && reason.includes('Audio')) {
            console.warn('[ErrorShield AudioSafety] مسدودسازی و ریست هندلر ساندترک/افکت صوتی ماریو.');
            this.resetCircuit('AUDIO');
        }
    }

    /**
     * لایه ۱۰: ریکاوری خودکار وضعیت ماریو در حلقه بازی
     */
    recoverLoopState() {
        if (window.MarioGameInstance) {
            const mario = window.MarioGameInstance.player;
            if (mario) {
                mario.vx = 0;
                mario.vy = 0;
                if (isNaN(mario.x) || isNaN(mario.y)) {
                    mario.x = mario.spawnX || 100;
                    mario.y = mario.spawnY || 100;
                }
            }
        }
    }

    /**
     * ثبت گزارش امنیتی و خطایابی بدون مصرف حافظه بی‌نهایت
     */
    logIncident(incident) {
        if (this.errorLog.length >= this.maxLogSize) {
            this.errorLog.shift();
        }
        this.errorLog.push(incident);

        // هشدار در کنسول امنیتی
        console.warn(`[Shield-Incident] [${incident.layer}]`, incident.message || incident);
    }

    /**
     * دریافت تاریخچه لاگ‌ها برای مقاصد Telemetry و دیباگ
     */
    getTelemetryReport() {
        return {
            totalErrors: this.errorLog.length,
            circuits: Object.fromEntries(this.circuitBreakers),
            logs: [...this.errorLog]
        };
    }
}

// صدور نمونه تکی (Singleton) جهت تضمین پایداری در کل رانتایم
export const errorShield = new ErrorShield();

// در صورت لود مستقیم اسکریپت بدون باندلر ماژولار:
if (typeof window !== 'undefined') {
    window.B2stErrorShield = errorShield;
    errorShield.init();
}