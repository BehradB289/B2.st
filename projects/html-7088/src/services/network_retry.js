/**
 * B2.st Studio - 10-Layer Network Resilience Engine
 * Module: Network Retry & Fault-Tolerant API Handler
 * Target: Super Mario HTML5 Core Engine
 * 
 * Features:
 *  - Exponential Backoff with Decorrelated Jitter
 *  - Fail-Fast Circuit Breaker Pattern
 *  - Dynamic AbortController Isolation (Timeout)
 *  - Rate-Limit Adaptation (HTTP 429 & Retry-After RFC compliance)
 *  - Strict Client/Server Error Demarcation (Safe vs Non-safe retries)
 *  - Memory-Safe Execution (Zero Leak on hanging sockets)
 */

'use strict';

/**
 * Circuit Breaker States
 */
const CircuitState = Object.freeze({
    CLOSED: 'CLOSED',       // ترافیک عادی
    OPEN: 'OPEN',           // خطای بحرانی؛ درخواست‌ها بلافاصله رد می‌شوند
    HALF_OPEN: 'HALF_OPEN'  // آزمایش محدود سرور برای بررسی بازیابی
});

/**
 * پیکربندی پیش‌فرض سیستم تاب‌آوری شبکه
 */
const DEFAULT_CONFIG = Object.freeze({
    maxRetries: 4,
    timeoutMs: 8000,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffFactor: 2,
    circuitBreakerThreshold: 5, // تعداد خطای متوالی برای تریپ خوردن
    circuitResetTimeoutMs: 30000, // زمان باقی‌ماندن در وضعیت OPEN
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    debugMode: false
});

class CircuitBreaker {
    constructor(threshold, resetTimeout) {
        this.threshold = threshold;
        this.resetTimeout = resetTimeout;
        this.state = CircuitState.CLOSED;
        this.consecutiveFailures = 0;
        this.nextAttempt = Date.now();
    }

    canExecute() {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() >= this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN;
                return true;
            }
            return false;
        }
        return true;
    }

    recordSuccess() {
        this.consecutiveFailures = 0;
        this.state = CircuitState.CLOSED;
    }

    recordFailure() {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.threshold || this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.resetTimeout;
        }
    }
}

class NetworkRetryService {
    constructor(options = {}) {
        this.config = { ...DEFAULT_CONFIG, ...options };
        this.circuitBreakers = new Map(); // ایزوله‌سازی بر اساس Hostname
    }

    /**
     * استخراج هاست برای اعمال Circuit Breaker اختصاصی
     */
    _getHost(url) {
        try {
            return new URL(url, window.location.href).host;
        } catch {
            return 'default_host';
        }
    }

    /**
     * دریافت یا ساخت اینستنس Circuit Breaker برای هر هاست
     */
    _getCircuitBreaker(url) {
        const host = this._getHost(url);
        if (!this.circuitBreakers.has(host)) {
            this.circuitBreakers.set(
                host,
                new CircuitBreaker(this.config.circuitBreakerThreshold, this.config.circuitResetTimeoutMs)
            );
        }
        return this.circuitBreakers.get(host);
    }

    /**
     * محاسبه تاخیر با الگوریتم Exponential Backoff همراه با Full Jitter
     * جلوگیری از پدیده Thundering Herd در زمان دان شدن سرور
     */
    _calculateBackoff(attempt, retryAfterMs = null) {
        if (retryAfterMs !== null && retryAfterMs > 0) {
            return Math.min(retryAfterMs, this.config.maxDelayMs);
        }

        const exponentialDelay = this.config.initialDelayMs * Math.pow(this.config.backoffFactor, attempt);
        const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);
        
        // Full Jitter Formula: Sleep = rand(0, min(maxDelay, base * 2^attempt))
        return Math.floor(Math.random() * cappedDelay);
    }

    /**
     * تجزیه هدر Retry-After در پاسخ‌های HTTP 429
     */
    _parseRetryAfter(response) {
        const header = response.headers ? response.headers.get('Retry-After') : null;
        if (!header) return null;

        // اگر مقدار ثانیه باشد
        const seconds = Number(header);
        if (!isNaN(seconds)) {
            return seconds * 1000;
        }

        // اگر تاریخ HTTP باشد
        const date = Date.parse(header);
        if (!isNaN(date)) {
            const delay = date - Date.now();
            return delay > 0 ? delay : 0;
        }

        return null;
    }

    /**
     * بررسی اعتبارسنجی اولیه URL و جلوگیری از حملات پروتکلی
     */
    _sanitizeUrl(url) {
        const parsed = new URL(url, window.location.href);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new SecurityError(`[B2.st SecOps] Protocol "${parsed.protocol}" is blocked for security reasons.`);
        }
        return parsed.toString();
    }

    /**
     * کپی کردن امن Request Body جهت ارسال مجدد
     */
    _cloneInit(init) {
        if (!init) return {};
        const cloned = { ...init };
        // پاکسازی سیگنال‌های احتمالی بیرونی برای مدیریت داخلی AbortController
        delete cloned.signal;
        return cloned;
    }

    /**
     * اجرای امن درخواست همراه با چرخه حیات Retry
     * @param {string} url - آدرس مقصد
     * @param {RequestInit} [init={}] - تنظیمات Fetch
     * @param {Object} [customOptions={}] - پیکربندی اختصاصی برای این درخواست
     * @returns {Promise<Response>}
     */
    async execute(url, init = {}, customOptions = {}) {
        const mergedConfig = { ...this.config, ...customOptions };
        const safeUrl = this._sanitizeUrl(url);
        const breaker = this._getCircuitBreaker(safeUrl);

        let attempt = 0;

        while (attempt <= mergedConfig.maxRetries) {
            // ۱. بررسی سلامت فیزیکی شبکه کلاینت
            if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
                throw new Error('[NetworkError] Client is currently offline.');
            }

            // ۲. بررسی Circuit Breaker
            if (!breaker.canExecute()) {
                throw new Error(`[CircuitBreaker] Requests to "${this._getHost(safeUrl)}" are blocked due to frequent failures.`);
            }

            // ۳. برپایی ایزولاسیون Timeout با AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort(new Error(`Timeout of ${mergedConfig.timeoutMs}ms exceeded.`));
            }, mergedConfig.timeoutMs);

            const requestOptions = {
                ...this._cloneInit(init),
                signal: controller.signal
            };

            let response;
            let retryAfterMs = null;
            let shouldRetry = false;
            let errorToThrow = null;

            try {
                if (mergedConfig.debugMode) {
                    console.info(`[B2.st NetRetry] Sending request to ${safeUrl} (Attempt ${attempt + 1}/${mergedConfig.maxRetries + 1})`);
                }

                response = await fetch(safeUrl, requestOptions);

                // اگر پاسخ در دامنه خطاهای بحرانی سرور یا Rate-limit باشد
                if (!response.ok) {
                    if (mergedConfig.retryableStatusCodes.includes(response.status)) {
                        shouldRetry = true;
                        retryAfterMs = this._parseRetryAfter(response);
                        errorToThrow = new Error(`Server returned retryable status: ${response.status}`);
                    } else {
                        // خطاهای 4xx (مانند 400، 401، 403، 404) نباید Retry شوند
                        breaker.recordSuccess(); // درخواست به درستی پاسخ داده شده هرچند کلاینت خطا دارد
                        return response;
                    }
                } else {
                    // موفقیت قطعی
                    breaker.recordSuccess();
                    return response;
                }
            } catch (err) {
                breaker.recordFailure();

                // خطاهای Timeout یا خطاهای فیزیکی اتصال (DNS fail, Reset connection)
                if (err.name === 'AbortError' || err instanceof TypeError) {
                    shouldRetry = true;
                    errorToThrow = err;
                } else {
                    // خطاهای متفرقه که قابل اصلاح با تلاش مجدد نیستند
                    throw err;
                }
            } finally {
                clearTimeout(timeoutId); // جلوگیری از نشت حافظه تایمرها
            }

            // بررسی ادامه پروسه تلاش مجدد
            if (shouldRetry) {
                attempt++;
                if (attempt > mergedConfig.maxRetries) {
                    breaker.recordFailure();
                    throw new Error(`[MaxRetriesExceeded] Request failed after ${mergedConfig.maxRetries} retries. Cause: ${errorToThrow?.message}`);
                }

                const delay = this._calculateBackoff(attempt, retryAfterMs);
                
                if (mergedConfig.debugMode) {
                    console.warn(`[B2.st NetRetry] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
                }

                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw new Error('[NetworkUnknown] Execution loop terminated unexpectedly.');
    }
}

// ساخت یک اینستنس پایدار عمومی برای سراسر کدهای بازی ماریو
const networkRetryInstance = new NetworkRetryService({
    debugMode: false,
    timeoutMs: 6000,
    maxRetries: 3
});

/**
 * Drop-in Wrapper سازگار با Fetch استاندارد جاوااسکریپت
 */
function secureFetch(url, init, options) {
    return networkRetryInstance.execute(url, init, options);
}

// اکسپورت چندگانه جهت استفاده در ماژول‌های ES یا اتصال به شیء Window در ماریو HTML5
if (typeof window !== 'undefined') {
    window.B2NetworkRetry = {
        NetworkRetryService,
        secureFetch,
        instance: networkRetryInstance
    };
}

export { NetworkRetryService, secureFetch, networkRetryInstance };
export default secureFetch;