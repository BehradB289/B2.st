/**
 * B2.st Studio - Cyber Security & Core Engine Division
 * 10-Layer Debugger & Network Resilience Engine
 * Module: Network Retry & Fault Tolerance Subsystem
 * Target: Mario Game Engine (Assets, Telemetry, Leaderboards, Save States)
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.NetworkGuard = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ==========================================
    // LAYER 1: ERROR MODELS & CONSTANTS
    // ==========================================
    class NetworkException extends Error {
        constructor(message, details = {}) {
            super(message);
            this.name = 'NetworkException';
            this.timestamp = Date.now();
            this.details = details;
        }
    }

    class CircuitBreakerOpenException extends NetworkException {
        constructor(message = 'Circuit Breaker is OPEN. Network requests blocked.') {
            super(message, { code: 'CIRCUIT_OPEN' });
            this.name = 'CircuitBreakerOpenException';
        }
    }

    class TimeoutException extends NetworkException {
        constructor(message = 'Request timed out.') {
            super(message, { code: 'ETIMEDOUT' });
            this.name = 'TimeoutException';
        }
    }

    const CIRCUIT_STATE = {
        CLOSED: 'CLOSED',
        OPEN: 'OPEN',
        HALF_OPEN: 'HALF_OPEN'
    };

    const DEFAULT_CONFIG = {
        maxRetries: 4,
        baseDelayMs: 600,
        maxDelayMs: 10000,
        timeoutMs: 8000,
        circuitThreshold: 5,
        circuitResetTimeoutMs: 25000,
        jitter: true,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        idempotencyHeaderKey: 'X-Idempotency-Key',
        scrubHeaders: ['authorization', 'cookie', 'x-api-key', 'token']
    };

    // ==========================================
    // LAYER 2: SECURITY & CRYPTO-JITTER HELPERS
    // ==========================================
    function getSecureRandom() {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const buf = new Uint32Array(1);
            crypto.getRandomValues(buf);
            return buf[0] / (0xffffffff + 1);
        }
        return Math.random();
    }

    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'mario-req-xxxxxxxx-4xxx-yxxx'.replace(/[xy]/g, function (c) {
            const r = (getSecureRandom() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    function sanitizeHeaders(headers = {}) {
        const sanitized = {};
        const entries = headers instanceof Headers ? [...headers.entries()] : Object.entries(headers);

        for (const [key, value] of entries) {
            const lowerKey = key.toLowerCase();
            if (DEFAULT_CONFIG.scrubHeaders.includes(lowerKey)) {
                sanitized[key] = '***[REDACTED_BY_B2ST_SECURITY]***';
            } else {
                // Prevent CRLF Injection in custom headers
                sanitized[key] = String(value).replace(/[\r\n]/g, '');
            }
        }
        return sanitized;
    }

    // ==========================================
    // LAYER 3: CIRCUIT BREAKER PATTERN
    // ==========================================
    class CircuitBreaker {
        constructor(threshold, resetTimeout) {
            this.threshold = threshold;
            this.resetTimeout = resetTimeout;
            this.state = CIRCUIT_STATE.CLOSED;
            this.failureCount = 0;
            this.lastFailureTime = 0;
            this.successCount = 0;
        }

        canExecute() {
            const now = Date.now();
            if (this.state === CIRCUIT_STATE.OPEN) {
                if (now - this.lastFailureTime > this.resetTimeout) {
                    this.state = CIRCUIT_STATE.HALF_OPEN;
                    return true;
                }
                return false;
            }
            return true;
        }

        recordSuccess() {
            if (this.state === CIRCUIT_STATE.HALF_OPEN) {
                this.successCount++;
                if (this.successCount >= 2) {
                    this.reset();
                }
            } else {
                this.failureCount = 0;
            }
        }

        recordFailure() {
            this.failureCount++;
            this.lastFailureTime = Date.now();
            if (this.state === CIRCUIT_STATE.HALF_OPEN || this.failureCount >= this.threshold) {
                this.state = CIRCUIT_STATE.OPEN;
            }
        }

        reset() {
            this.state = CIRCUIT_STATE.CLOSED;
            this.failureCount = 0;
            this.successCount = 0;
            this.lastFailureTime = 0;
        }
    }

    // ==========================================
    // LAYER 4-10: SMART RESILIENT ENGINE CORE
    // ==========================================
    class NetworkGuardService {
        constructor(customConfig = {}) {
            this.config = Object.assign({}, DEFAULT_CONFIG, customConfig);
            this.circuitBreaker = new CircuitBreaker(
                this.config.circuitThreshold,
                this.config.circuitResetTimeoutMs
            );
            this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
            this._setupNetworkListeners();
        }

        _setupNetworkListeners() {
            if (typeof window !== 'undefined' && window.addEventListener) {
                window.addEventListener('online', () => {
                    this.isOnline = true;
                    this.circuitBreaker.reset();
                });
                window.addEventListener('offline', () => {
                    this.isOnline = false;
                });
            }
        }

        _calculateBackoff(attempt) {
            // Full Jitter Formula: V = Random(0, Min(MaxDelay, BaseDelay * 2 ^ Attempt))
            const exponentialMultiplier = Math.pow(2, attempt);
            const calculatedDelay = Math.min(
                this.config.maxDelayMs,
                this.config.baseDelayMs * exponentialMultiplier
            );

            if (!this.config.jitter) {
                return calculatedDelay;
            }
            return Math.floor(getSecureRandom() * calculatedDelay);
        }

        _isRetryableError(error, response) {
            if (!this.isOnline) return true; // Retry once connection comes back
            if (error) {
                if (error.name === 'AbortError' && error.isUserInitiated) {
                    return false; // User intentional cancel
                }
                return true; // Network drop, DNS resolution failure, socket hung up
            }
            if (response) {
                return this.config.retryableStatusCodes.includes(response.status);
            }
            return false;
        }

        _sleep(ms, signal) {
            return new Promise((resolve, reject) => {
                if (signal && signal.aborted) {
                    return reject(new NetworkException('Operation aborted during backoff delay'));
                }

                const timer = setTimeout(() => {
                    resolve();
                }, ms);

                if (signal) {
                    signal.addEventListener('abort', () => {
                        clearTimeout(timer);
                        reject(new NetworkException('Operation aborted during backoff delay'));
                    }, { once: true });
                }
            });
        }

        /**
         * Core resilient request execution with 10-layer defense
         * @param {string} url - Target URL
         * @param {RequestInit} options - Fetch Options
         * @param {Object} overrideConfig - Per-request configuration overrides
         */
        async execute(url, options = {}, overrideConfig = {}) {
            const reqConfig = Object.assign({}, this.config, overrideConfig);

            // Layer 1 Check: Circuit Breaker State
            if (!this.circuitBreaker.canExecute()) {
                throw new CircuitBreakerOpenException(
                    `B2.st Engine: Circuit breaker blocked request to [${url}]. Server unavailable.`
                );
            }

            // Layer 2 Check: Device Online Verification
            if (!this.isOnline) {
                throw new NetworkException('Client is currently OFFLINE. Request aborted preemptively.');
            }

            // Layer 3: Ensure Idempotency Header for Safe Retries on Mutating Methods
            const finalOptions = Object.assign({}, options);
            const method = (finalOptions.method || 'GET').toUpperCase();
            finalOptions.headers = new Headers(finalOptions.headers || {});

            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                if (!finalOptions.headers.has(reqConfig.idempotencyHeaderKey)) {
                    finalOptions.headers.set(reqConfig.idempotencyHeaderKey, generateUUID());
                }
            }

            let attempt = 0;
            let lastError = null;
            let lastResponse = null;

            while (attempt <= reqConfig.maxRetries) {
                // Layer 4: Independent Timeout Controller per Attempt
                const timeoutController = new AbortController();
                let isExplicitTimeout = false;
                let userSignal = finalOptions.signal;

                const timer = setTimeout(() => {
                    isExplicitTimeout = true;
                    timeoutController.abort();
                }, reqConfig.timeoutMs);

                // Chain with caller's AbortSignal if present
                const combinedAbortHandler = () => {
                    timeoutController.abort();
                };

                if (userSignal) {
                    if (userSignal.aborted) {
                        clearTimeout(timer);
                        throw new NetworkException('Request cancelled by caller before dispatch.');
                    }
                    userSignal.addEventListener('abort', combinedAbortHandler, { once: true });
                }

                try {
                    const fetchOptions = Object.assign({}, finalOptions, {
                        signal: timeoutController.signal
                    });

                    // Layer 5: Network Call Dispatch
                    const response = await fetch(url, fetchOptions);
                    clearTimeout(timer);

                    if (userSignal) {
                        userSignal.removeEventListener('abort', combinedAbortHandler);
                    }

                    // Layer 6: Response Validation & Status Check
                    if (response.ok) {
                        this.circuitBreaker.recordSuccess();
                        return response;
                    }

                    // Layer 7: Non-OK HTTP Evaluation
                    lastResponse = response;
                    if (!this._isRetryableError(null, response)) {
                        // 4xx errors (e.g. 401, 403, 404) that are deterministic and must not be retried
                        this.circuitBreaker.recordSuccess(); // Not an infrastructural network fault
                        return response;
                    }

                    lastError = new NetworkException(`HTTP Fault Response: ${response.status}`, {
                        status: response.status,
                        statusText: response.statusText
                    });

                } catch (err) {
                    clearTimeout(timer);
                    if (userSignal) {
                        userSignal.removeEventListener('abort', combinedAbortHandler);
                    }

                    if (isExplicitTimeout) {
                        lastError = new TimeoutException(`Request timeout after ${reqConfig.timeoutMs}ms on attempt ${attempt + 1}`);
                    } else if (err.name === 'AbortError' && userSignal && userSignal.aborted) {
                        const cancelErr = new NetworkException('Request intentionally aborted by game engine.');
                        cancelErr.isUserInitiated = true;
                        throw cancelErr;
                    } else {
                        lastError = err;
                    }

                    if (!this._isRetryableError(lastError, null)) {
                        this.circuitBreaker.recordFailure();
                        throw lastError;
                    }
                }

                // Layer 8: Failure Tracking & Circuit Breaker Update
                this.circuitBreaker.recordFailure();
                attempt++;

                if (attempt > reqConfig.maxRetries) {
                    break;
                }

                // Layer 9: Backoff Delay with Jitter & Cancellation Support
                const backoffDelay = this._calculateBackoff(attempt);
                try {
                    await this._sleep(backoffDelay, userSignal);
                } catch (abortSleepError) {
                    throw abortSleepError;
                }
            }

            // Layer 10: Final Exhaustion Trap
            const safeDiagnostics = {
                url,
                attempts: attempt,
                lastStatus: lastResponse ? lastResponse.status : 'NO_RESPONSE',
                errorDetails: lastError ? lastError.message : 'Unknown exhaustion error'
            };

            throw new NetworkException(
                `[B2.st-NET-EXHAUSTION] Retries exhausted for request after ${attempt} attempts.`,
                safeDiagnostics
            );
        }

        // ==========================================
        // CONVENIENCE SHORTCUTS FOR MARIO ENGINE
        // ==========================================
        async getJson(url, options = {}, config = {}) {
            const res = await this.execute(url, Object.assign({}, options, { method: 'GET' }), config);
            if (!res.ok) {
                throw new NetworkException(`Failed to fetch JSON. HTTP ${res.status}`, { status: res.status });
            }
            return await res.json();
        }

        async postJson(url, payload, options = {}, config = {}) {
            const headers = new Headers(options.headers || {});
            headers.set('Content-Type', 'application/json');
            
            const res = await this.execute(url, Object.assign({}, options, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            }), config);

            if (!res.ok) {
                throw new NetworkException(`Failed to post JSON. HTTP ${res.status}`, { status: res.status });
            }
            return await res.json();
        }

        async fetchAssetBlob(url, options = {}, config = {}) {
            const res = await this.execute(url, Object.assign({}, options, { method: 'GET' }), config);
            if (!res.ok) {
                throw new NetworkException(`Asset stream failed. HTTP ${res.status}`, { status: res.status });
            }
            return await res.blob();
        }

        getCircuitState() {
            return this.circuitBreaker.state;
        }

        resetCircuit() {
            this.circuitBreaker.reset();
        }
    }

    // Default Singleton Instance for immediate plug-and-play in Mario Game
    const defaultInstance = new NetworkGuardService();

    return {
        NetworkGuardService,
        NetworkException,
        CircuitBreakerOpenException,
        TimeoutException,
        default: defaultInstance,
        fetch: defaultInstance.execute.bind(defaultInstance),
        getJson: defaultInstance.getJson.bind(defaultInstance),
        postJson: defaultInstance.postJson.bind(defaultInstance),
        fetchAssetBlob: defaultInstance.fetchAssetBlob.bind(defaultInstance),
        sanitizeHeaders
    };
}));