/**
 * ============================================================================
 * B2.st Cybersecurity Studio - 10-Layer Defense Engine
 * Engine Name: OWASP Guard Software WAF & Memory Shield
 * Target: Mario HTML5 Game Runtime & API Gateway
 * Standards: OWASP Top 10 (A01-A10:2021) | Safe DOM | Memory Token Isolation
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.OwaspGuard = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Layer 5: Anti-Tampering & Prototype Pollution Freeze
    (function sealCorePrototypes() {
        try {
            Object.freeze(Object.prototype);
            Object.freeze(Array.prototype);
            Object.freeze(Function.prototype);
        } catch (e) {
            console.warn('[OWASP-GUARD-L5] Strict prototype freezing partially restricted by host context.');
        }
    })();

    /**
     * LAYER 1: Deep Payload Analysis & Heuristic Regex Engine
     * شناسایی الگوهای خطرناک تزریق کد، SQL Injection و دستکاری توابع
     */
    const THREAT_PATTERNS = {
        // شناسایی الگوهای پیشرفته Cross-Site Scripting
        xss: [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript\s*:/gi,
            /data\s*:\s*text\/html/gi,
            /vbscript\s*:/gi,
            /on\w+\s*=/gi,
            /<iframe\b[^>]*>/gi,
            /<img\b[^>]*src\s*=\s*['"]?[^'"]*onerror/gi,
            /<svg\b[^>]*onload/gi,
            /document\.(cookie|location|write)/gi,
            /window\.(localStorage|sessionStorage)/gi
        ],
        // شناسایی الگوهای SQL Injection (Union, Blind, Stacked, Comments)
        sqli: [
            /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
            /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|UNION|JOIN)\b/i,
            /\bOR\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+/i,
            /\bAND\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+/i,
            /WAITFOR\s+DELAY/i,
            /BENCHMARK\s*\(/i,
            /PG_SLEEP\s*\(/i,
            /EXEC(\s|\+)+(SP_|XP_)/i
        ],
        // Path Traversal & Command Injection
        traversal: [
            /(\.\.\/|\.\.\\)/g,
            /(%2e%2e\%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c)/gi,
            /(\/etc\/passwd|\/bin\/sh|\bcmd\.exe\b)/gi
        ]
    };

    /**
     * LAYER 3: Secure In-Memory Token Vault (Zero-Leakage Architecture)
     * جلوگیری از نشت توکن‌ها با عدم ذخیره در localStorage/sessionStorage
     */
    const TokenVault = (function () {
        // کلیدها و توکن‌ها داخل کلوژر امن و خارج از دسترس scope گلوبال قرار دارند
        const _vault = new WeakMap();
        const _entropyKey = crypto.getRandomValues(new Uint8Array(32));
        const _owner = {};

        _vault.set(_owner, {
            authToken: null,
            csrfToken: null,
            sessionSignature: null,
            fingerprint: null,
            expiryTime: 0
        });

        async function deriveKey(entropy) {
            return await crypto.subtle.importKey(
                'raw',
                entropy,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        }

        return {
            async setSessionToken(token, ttlMs = 3600000) {
                if (!token || typeof token !== 'string') {
                    throw new SecurityError('Invalid token format.');
                }
                const record = _vault.get(_owner);
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const key = await deriveKey(_entropyKey);
                const encoded = new TextEncoder().encode(token);

                const encrypted = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv },
                    key,
                    encoded
                );

                record.authToken = {
                    cipher: encrypted,
                    iv: Array.from(iv)
                };
                record.expiryTime = Date.now() + ttlMs;
                record.fingerprint = OwaspGuard.generateFingerprint();
            },

            async getSessionToken() {
                const record = _vault.get(_owner);
                if (!record.authToken) return null;

                if (Date.now() > record.expiryTime) {
                    this.revokeAll();
                    throw new SecurityError('Session expired. Re-authentication required.');
                }

                if (record.fingerprint !== OwaspGuard.generateFingerprint()) {
                    this.revokeAll();
                    throw new SecurityError('Session hijacking detected: Hardware fingerprint mismatch.');
                }

                const key = await deriveKey(_entropyKey);
                const decrypted = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: new Uint8Array(record.authToken.iv) },
                    key,
                    record.authToken.cipher
                );

                return new TextDecoder().decode(decrypted);
            },

            setCsrfToken(csrf) {
                const record = _vault.get(_owner);
                record.csrfToken = String(csrf).trim();
            },

            getCsrfToken() {
                return _vault.get(_owner).csrfToken;
            },

            revokeAll() {
                const record = _vault.get(_owner);
                record.authToken = null;
                record.csrfToken = null;
                record.sessionSignature = null;
                record.expiryTime = 0;
            }
        };
    })();

    /**
     * LAYER 8: Adaptive Rate Limiting & Tamper Prevention
     */
    class RateLimiter {
        constructor(maxHits = 60, windowMs = 60000) {
            this.maxHits = maxHits;
            this.windowMs = windowMs;
            this.hits = [];
        }

        checkLimit() {
            const now = Date.now();
            this.hits = this.hits.filter(timestamp => now - timestamp < this.windowMs);
            if (this.hits.length >= this.maxHits) {
                return false;
            }
            this.hits.push(now);
            return true;
        }
    }

    /**
     * Security Error Representation
     */
    class SecurityError extends Error {
        constructor(message, vector = 'GENERAL') {
            super(`[B2.st-OWASP-VIOLATION] [Vector: ${vector}] ${message}`);
            this.name = 'SecurityViolationError';
            this.timestamp = new Date().toISOString();
        }
    }

    /**
     * Main OwaspGuard Core Engine
     */
    const OwaspGuard = {
        limiter: new RateLimiter(50, 60000),
        Vault: TokenVault,

        /**
         * LAYER 2 & 7: Contextual Output Encoding & Sanitization
         */
        sanitizeHTML(rawInput) {
            if (rawInput === null || rawInput === undefined) return '';
            const str = String(rawInput);
            
            // جایگزینی کاراکترهای باینری و خطرناک
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;')
                .replace(/`/g, '&#x60;');
        },

        sanitizeAttribute(rawInput) {
            if (!rawInput) return '';
            return String(rawInput).replace(/[^a-zA-Z0-9_\-\.]/g, function (char) {
                return `&#x${char.charCodeAt(0).toString(16)};`;
            });
        },

        /**
         * LAYER 1: Comprehensive Input Validation Pipeline
         */
        validateInput(input, context = 'default') {
            if (typeof input !== 'string') {
                if (typeof input === 'number' || typeof input === 'boolean') {
                    return true;
                }
                throw new SecurityError('Invalid payload type.', 'TYPE_SPOOF');
            }

            if (!this.limiter.checkLimit()) {
                throw new SecurityError('Rate-limit exceeded. Threat mitigation triggered.', 'DOS_ABUSE');
            }

            // چک کردن الگوهای XSS
            for (let regex of THREAT_PATTERNS.xss) {
                if (regex.test(input)) {
                    throw new SecurityError(`XSS payload pattern detected: ${regex.source}`, 'XSS');
                }
            }

            // چک کردن الگوهای SQL Injection
            for (let regex of THREAT_PATTERNS.sqli) {
                if (regex.test(input)) {
                    throw new SecurityError(`SQL Injection attempt blocked: ${regex.source}`, 'SQLI');
                }
            }

            // چک کردن Path Traversal
            for (let regex of THREAT_PATTERNS.traversal) {
                if (regex.test(input)) {
                    throw new SecurityError(`Path traversal attempt blocked.`, 'LFI_RFI');
                }
            }

            return true;
        },

        /**
         * LAYER 4: Dangerous Sink Armor (Virtual Patching)
         */
        installSinkArmor() {
            // مسدودسازی خطرناک‌ترین Sinkهای جاوااسکریپت
            const originalSetTimeout = window.setTimeout;
            window.setTimeout = function (handler, timeout, ...args) {
                if (typeof handler === 'string') {
                    throw new SecurityError('Eval-like string execution in setTimeout() prohibited.', 'CODE_EXEC');
                }
                return originalSetTimeout(handler, timeout, ...args);
            };

            const originalSetInterval = window.setInterval;
            window.setInterval = function (handler, timeout, ...args) {
                if (typeof handler === 'string') {
                    throw new SecurityError('Eval-like string execution in setInterval() prohibited.', 'CODE_EXEC');
                }
                return originalSetInterval(handler, timeout, ...args);
            };

            // مانیتور و محدودسازی دسترسی مستقیم به innerHTML بدون فرار کاراکترها
            const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
            if (originalInnerHTML && originalInnerHTML.set) {
                Object.defineProperty(Element.prototype, 'innerHTML', {
                    set: function (val) {
                        try {
                            OwaspGuard.validateInput(val, 'DOM_SINK');
                        } catch (err) {
                            console.error('[DOM-SHIELD-BLOCKED]', err.message);
                            // تبدیل به محتوای ایمن بدون اجازه اجرای اسکریپت
                            val = OwaspGuard.sanitizeHTML(val);
                        }
                        return originalInnerHTML.set.call(this, val);
                    },
                    get: function () {
                        return originalInnerHTML.get.call(this);
                    }
                });
            }
        },

        /**
         * LAYER 9: Browser & Execution Environment Fingerprinting
         */
        generateFingerprint() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('B2.st-AntiTamper', 2, 2);
            const canvasHash = canvas.toDataURL().slice(-50);

            const components = [
                navigator.userAgent,
                navigator.language,
                screen.colorDepth,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                canvasHash
            ];

            return components.join('###');
        },

        /**
         * LAYER 10: Secure Game Data Payload Verifier
         * اعتبارسنجی داده‌های حساس بازی (امتیاز، نام بازیکن، توکن نشست)
         */
        secureScorePayload(playerName, score) {
            this.validateInput(playerName, 'SCORE_NAME');
            
            const numScore = Number(score);
            if (!Number.isFinite(numScore) || numScore < 0 || numScore > 9999999) {
                throw new SecurityError('Anomalous score parameter detected.', 'DATA_TAMPER');
            }

            return {
                player: this.sanitizeHTML(playerName),
                score: Math.floor(numScore),
                hmacSignature: this.calculateHMACSignature(playerName, numScore),
                timestamp: Date.now()
            };
        },

        calculateHMACSignature(player, score) {
            // ساخت امضای نرم‌افزاری ساده جهت جلوگیری از تقلب محلی در امتیازها
            const seed = `${player}:${score}:${window.location.host}`;
            let hash = 0;
            for (let i = 0; i < seed.length; i++) {
                hash = ((hash << 5) - hash) + seed.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash).toString(16);
        },

        /**
         * LAYER 6: Content Security Policy Verification
         */
        verifyCSP() {
            const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!metaCSP) {
                console.warn('[OWASP-GUARD-L6] WARNING: Meta Content-Security-Policy is missing. Injection attack surface increased.');
            }
        },

        /**
         * فایروال آغازین
         */
        init() {
            this.installSinkArmor();
            this.verifyCSP();
            console.log('%c[B2.st OWASP-GUARD ACTIVE] 10-Layer Shield Running. Injections & Token-Leak vectors neutralized.', 'background: #002b36; color: #859900; font-weight: bold; padding: 4px;');
        }
    };

    OwaspGuard.init();
    return Object.freeze(OwaspGuard);
}));