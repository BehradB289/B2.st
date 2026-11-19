/**
 * @file network_retry.js
 * @module B2Studio/NetworkResilience
 * @author B2.st 10-Layer Debugger & CyberSec Agent
 * @description موتور پایداری ارتباطات شبکه، مکانیزم تاب‌آوری API، جلوگیری از Thundering Herd و هندلینگ اتصالات ناپایدار در بازی ماریو.
 */

/**
 * وضعیت‌های ماشین حالت Circuit Breaker
 */
const CircuitState = Object.freeze({
    CLOSED: 'CLOSED',       // وضعیت عادی: ارتباط برقرار است
    OPEN: 'OPEN',           // وضعیت قطع مدار: خطاها بالا رفته و درخواست‌ها مسدود می‌شوند
    HALF_OPEN: 'HALF_OPEN'  // وضعیت آزمایشی: بررسی احیای سرویس‌دهنده
});

/**
 * تنظیمات پیش‌فرض امنیتی و تایم‌اوت شبکه
 */
const DEFAULT_CONFIG = Object.freeze({
    maxRetries: 4,
    initialDelayMs: 600,
    maxDelayMs: 8000,
    backoffFactor: 2.0,
    jitterFactor: 0.25,      // نوسان تصادفی برای جلوگیری از حملات همگام‌سازی ناخواسته
    perAttemptTimeoutMs: 5000,
    totalTimeoutMs: 20000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeoutMs: 15000,
        successThreshold: 2
    }
});

/**
 * خطای سفارشی شبکه با متادیتای غنی
 */
export class NetworkResilienceError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'NetworkResilienceError';
        this.status = details.status || null;
        this.attempt = details.attempt || 0;
        this.isTimeout = Boolean(details.isTimeout);
        this.circuitOpen = Boolean(details.circuitOpen);
        this.originalError = details.originalError || null;
        this.timestamp = Date.now();
    }
}

/**
 * پیاده‌سازی Circuit Breaker برای جلوگیری از تخریب سرور و قفل شدن تِرِد مرورگر
 */
class CircuitBreaker {
    constructor(config) {
        this.failureThreshold = config.failureThreshold;
        this.recoveryTimeoutMs = config.recoveryTimeoutMs;
        this.successThreshold = config.successThreshold;

        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = Date.now();
    }

    canExecute() {
        if (this.state === CircuitState.CLOSED) {
            return true;
        }
        if (this.state === CircuitState.OPEN) {
            if (Date.now() >= this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
                return true;
            }
            return false;
        }
        if (this.state === CircuitState.HALF_OPEN) {
            return true;
        }
        return false;
    }

    onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.failureCount = 0;
            }
        } else if (this.state === CircuitState.CLOSED) {
            this.failureCount = 0;
        }
    }

    onFailure() {
        this.failureCount++;
        if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.recoveryTimeoutMs;
        }
    }
}

const globalCircuitBreaker = new CircuitBreaker(DEFAULT_CONFIG.circuitBreaker);

/**
 * تاخیر با پشتیبانی از سیگنال Abort برای لغو اضطراری
 * @param {number} ms 
 * @param {AbortSignal} [signal] 
 * @returns {Promise<void>}
 */
const sleep = (ms, signal) => {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            return reject(new DOMException('Operation aborted during backoff delay', 'AbortError'));
        }

        const timer = setTimeout(() => {
            if (signal) signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);

        const onAbort = () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
            reject(new DOMException('Operation aborted during backoff delay', 'AbortError'));
        };

        if (signal) {
            signal.addEventListener('abort', onAbort, { once: true });
        }
    });
};

/**
 * محاسبه تأخیر با الگوریتم Exponential Backoff با Full Jitter
 * @param {number} attempt 
 * @param {typeof DEFAULT_CONFIG} config 
 * @returns {number}
 */
const calculateDelay = (attempt, config) => {
    const exponential = Math.min(
        config.maxDelayMs,
        config.initialDelayMs * Math.pow(config.backoffFactor, attempt)
    );
    // Decorrelated Full Jitter جهت پخش یکنواخت بار در شبکه
    const jitter = exponential * config.jitterFactor * (Math.random() * 2 - 1);
    return Math.max(config.initialDelayMs, Math.floor(exponential + jitter));
};

/**
 * اعتبارسنجی URL جهت مقابله با SSRF و رفتارهای غیرمجاز در کلاینت
 * @param {string} urlStr 
 */
const sanitizeAndValidateUrl = (urlStr) => {
    try {
        const parsed = new URL(urlStr, window.location.href);
        if (!['http:', 'https:', 'data:', 'blob:'].includes(parsed.protocol)) {
            throw new Error(`پروتکل غیرمجاز شناسایی شد: ${parsed.protocol}`);
        }
        return parsed.toString();
    } catch (e) {
        throw new NetworkResilienceError(`URL ارائه‌شده نامعتبر است: ${urlStr}`, { originalError: e });
    }
};

/**
 * خواندن امن مدت زمان انتظار اعلام شده از هدر Retry-After در پاسخ‌های 429
 * @param {Response} response 
 * @returns {number|null} تأخیر به میلی‌ثانیه یا null
 */
const parseRetryAfterHeader = (response) => {
    const retryAfter = response.headers.get('Retry-After');
    if (!retryAfter) return null;

    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
        return Math.max(0, seconds * 1000);
    }

    const dateParsed = Date.parse(retryAfter);
    if (!isNaN(dateParsed)) {
        return Math.max(0, dateParsed - Date.now());
    }

    return null;
};

/**
 * ماژول اصلی ارسال امن درخواست شبکه به همراه سیاست‌های تاب‌آوری ۱۰ لایه
 * 
 * @param {string} url - آدرس منبع (API لیدربورد، وضعیت بازی، لود است‌ها)
 * @param {RequestInit & { resilienceConfig?: Partial<typeof DEFAULT_CONFIG> }} [options={}]
 * @returns {Promise<Response>}
 */
export async function secureFetch(url, options = {}) {
    const validUrl = sanitizeAndValidateUrl(url);
    const config = { ...DEFAULT_CONFIG, ...(options.resilienceConfig || {}) };

    if (!globalCircuitBreaker.canExecute()) {
        throw new NetworkResilienceError('Circuit Breaker is OPEN. ارتباط با سرور به علت خطاهای متوالی قطع است.', {
            circuitOpen: true
        });
    }

    // کنترل کل مدت زمان درخواست (Total Deadline Controller)
    const masterController = new AbortController();
    const externalSignal = options.signal;

    if (externalSignal) {
        externalSignal.addEventListener('abort', () => masterController.abort(externalSignal.reason), { once: true });
    }

    const totalTimeoutId = setTimeout(() => {
        masterController.abort(new DOMException('Total resilience timeout exceeded', 'TimeoutError'));
    }, config.totalTimeoutMs);

    let lastError = null;

    try {
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            if (masterController.signal.aborted) {
                throw new DOMException('درخواست توسط تایم‌اوت سراسری یا کاربر لغو شد.', 'AbortError');
            }

            // کنترل تایم‌اوت تک‌تلاش (Per-attempt Timeout)
            const attemptController = new AbortController();
            const attemptTimeoutId = setTimeout(() => {
                attemptController.abort(new DOMException(`Request timed out after ${config.perAttemptTimeoutMs}ms`, 'TimeoutError'));
            }, config.perAttemptTimeoutMs);

            // اتصال سیگنال والد به سیگنال فرزند
            const onMasterAbort = () => attemptController.abort(masterController.signal.reason);
            masterController.signal.addEventListener('abort', onMasterAbort, { once: true });

            try {
                const requestInit = {
                    ...options,
                    signal: attemptController.signal
                };
                delete requestInit.resilienceConfig;

                const response = await fetch(validUrl, requestInit);

                // اگر پاسخ در کدهای خطای قابل تلاش مجدد بود
                if (!response.ok) {
                    if (config.retryableStatusCodes.includes(response.status)) {
                        globalCircuitBreaker.onFailure();

                        if (attempt < config.maxRetries) {
                            // بررسی اولویت هدر Retry-After در خطای 429
                            const retryAfterMs = parseRetryAfterHeader(response);
                            const delayMs = retryAfterMs !== null 
                                ? Math.min(retryAfterMs, config.maxDelayMs) 
                                : calculateDelay(attempt, config);

                            console.warn(`[B2.st Resilience] خطا در دریافت منبع (${response.status}). تلاش مجدد ${attempt + 1}/${config.maxRetries} پس از ${delayMs}ms`);
                            await sleep(delayMs, masterController.signal);
                            continue;
                        }
                    }

                    // خطای غیرقابل جبران کلاینت (مثلاً 400, 401, 403, 404)
                    globalCircuitBreaker.onFailure();
                    throw new NetworkResilienceError(`درخواست شبکه با کد ${response.status} شکست خورد.`, {
                        status: response.status,
                        attempt
                    });
                }

                // دریافت پاسخ موفقیت‌آمیز
                globalCircuitBreaker.onSuccess();
                return response;

            } catch (err) {
                lastError = err;

                const isAbort = err.name === 'AbortError' || err.name === 'TimeoutError';
                const isFinalAttempt = attempt === config.maxRetries;
                const isMasterAborted = masterController.signal.aborted;

                // در صورتی که تایم‌اوت سراسری یا انصراف دستی کاربر باشد، فوراً متوقف می‌شویم
                if (isMasterAborted && err.name !== 'TimeoutError') {
                    throw err;
                }

                globalCircuitBreaker.onFailure();

                if (isFinalAttempt) {
                    break;
                }

                const delayMs = calculateDelay(attempt, config);
                console.warn(`[B2.st Resilience] قطعی یا تایم‌اوت ارتباط (${err.message}). تلاش مجدد ${attempt + 1}/${config.maxRetries} پس از ${delayMs}ms`);
                
                await sleep(delayMs, masterController.signal);
            } finally {
                clearTimeout(attemptTimeoutId);
                masterController.signal.removeEventListener('abort', onMasterAbort);
            }
        }

        // خارج شدن از حلقه یعنی تمام تلاش‌ها با شکست مواجه شد
        throw new NetworkResilienceError(`تمام ${config.maxRetries + 1} تلاش ارتباط با شبکه شکست خوردند.`, {
            attempt: config.maxRetries,
            originalError: lastError,
            isTimeout: lastError?.name === 'TimeoutError'
        });

    } finally {
        clearTimeout(totalTimeoutId);
    }
}

/**
 * متد کمکی دریافت ایمن داده‌های JSON با بررسی خودکار هدر Content-Type
 * @template T
 * @param {string} url 
 * @param {RequestInit} [options={}]
 * @returns {Promise<T>}
 */
export async function secureFetchJson(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    const response = await secureFetch(url, { ...options, headers });
    const contentType = response.headers.get('Content-Type') || '';

    if (!contentType.includes('application/json')) {
        throw new NetworkResilienceError('فرمت پاسخ دریافتی JSON معتبر نمی‌باشد.', {
            status: response.status
        });
    }

    try {
        return await response.json();
    } catch (e) {
        throw new NetworkResilienceError('خطا در تحلیل ساختار JSON پاسخ سرور.', {
            originalError: e,
            status: response.status
        });
    }
}

/**
 * متد بارگذاری ایمن است‌های بازی (Spriteها، شیت‌ها، صداها) با فرمت Blob
 * @param {string} assetUrl 
 * @param {RequestInit} [options={}]
 * @returns {Promise<Blob>}
 */
export async function secureFetchAsset(assetUrl, options = {}) {
    const response = await secureFetch(assetUrl, {
        ...options,
        resilienceConfig: {
            // برای دارایی‌های گرافیکی و صوتی می‌توان سیاست سخت‌گیرانه‌تری تعیین کرد
            maxRetries: 5,
            perAttemptTimeoutMs: 7000,
            ...options.resilienceConfig
        }
    });

    return await response.blob();
}

/**
 * دریافت وضعیت فعلی ماژول و کنترل سلامت (Health Check)
 */
export function getNetworkDiagnostics() {
    return {
        circuitBreakerState: globalCircuitBreaker.state,
        failureCount: globalCircuitBreaker.failureCount,
        nextAllowedAttempt: globalCircuitBreaker.nextAttempt
    };
}