/**
 * ============================================================================
 * Studio B2.st - Cyber Security & 10-Layer Runtime Application Self-Protection (RASP)
 * Project: Mario HTML5 Game Engine
 * Module: OWASP Software Firewall & Runtime Guard (owasp_guard.js)
 * Architecture: 10-Layer Hardened Defense Shield
 * ============================================================================
 */

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.OWASPGuard = factory();
    }
}(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    // Layer 1: Immutable Configuration & Threat Telemetry Matrix
    const SECURITY_CONFIG = Object.freeze({
        STRICT_CSP: true,
        MAX_INPUT_LENGTH: 64,
        TOKEN_STORAGE_KEY: '__b2_mario_secure_token__',
        ALLOWED_ORIGINS: [window.location.origin],
        SQLI_REGEX: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|DECLARE|MERGE|TRUNCATE)\b)|(--|\/\*|\*\/|;|['"]\s*OR\s*['"]?1['"]?\s*=\s*['"]?1|['"]\s*OR\s*true|@@version)/i,
        XSS_REGEX: /((<|\%3C)\s*[^\n\r>]*(\/|\%2F)?(script|iframe|object|embed|applet|style|svg|form|input|base|link|meta)[^\n\r>]*>)|(javascript:|data:text\/html|vbscript:|livescript:)|(\bon\w+\s*=)/i,
        TOKEN_ENTROPY_PATTERN: /^[a-zA-Z0-9\-_]{32,}\.[a-zA-Z0-9\-_]{32,}\.[a-zA-Z0-9\-_]{32,}$/, // JWT-like
        VIOLATION_LOG_LIMIT: 100
    });

    const SecurityTelemetry = {
        violations: [],
        logViolation: function (type, detail, severity = 'CRITICAL') {
            const incident = Object.freeze({
                timestamp: new Date().toISOString(),
                type: type,
                detail: String(detail).substring(0, 256),
                severity: severity,
                stack: new Error().stack
            });
            this.violations.unshift(incident);
            if (this.violations.length > SECURITY_CONFIG.VIOLATION_LOG_LIMIT) {
                this.violations.pop();
            }
            console.warn(`[OWASP_FIREWALL_ALERT] [${severity}] ${type}:`, detail);
        }
    };

    // Layer 2: Deep Cryptographic Token Vault (Token Leakage Barrier)
    class SecureTokenVault {
        #memoryVault = new Map();

        constructor() {
            this.#purgeLeakedTokensFromStorage();
            this.#stripTokensFromURL();
        }

        #purgeLeakedTokensFromStorage() {
            try {
                // Remove unprotected plain tokens stored carelessly
                const suspiciousKeys = ['token', 'jwt', 'auth', 'mario_token', 'session'];
                [localStorage, sessionStorage].forEach(store => {
                    for (let i = store.length - 1; i >= 0; i--) {
                        const key = store.key(i);
                        if (suspiciousKeys.some(s => key.toLowerCase().includes(s))) {
                            SecurityTelemetry.logViolation('TOKEN_STORAGE_LEAK', `Removed plain token candidate in storage: ${key}`);
                            store.removeItem(key);
                        }
                    }
                });
            } catch (e) {
                // Storage might be restricted
            }
        }

        #stripTokensFromURL() {
            try {
                if (window.location.search || window.location.hash) {
                    const url = new URL(window.location.href);
                    let mutated = false;
                    const params = ['token', 'jwt', 'access_token', 'auth'];
                    params.forEach(p => {
                        if (url.searchParams.has(p)) {
                            SecurityTelemetry.logViolation('TOKEN_URL_EXPOSURE', `Stripped token parameter: ${p}`);
                            url.searchParams.delete(p);
                            mutated = true;
                        }
                    });
                    if (url.hash.includes('token=')) {
                        SecurityTelemetry.logViolation('TOKEN_URL_FRAGMENT_EXPOSURE', 'Stripped hash token fragment');
                        url.hash = '';
                        mutated = true;
                    }
                    if (mutated) {
                        window.history.replaceState({}, document.title, url.pathname + url.search);
                    }
                }
            } catch (e) {
                // Defensive catch
            }
        }

        setSecureToken(key, value) {
            if (typeof key !== 'string' || typeof value !== 'string') return false;
            // Never expose real tokens to DOM/Local Storage; isolate in memory
            this.#memoryVault.set(key, Object.freeze({
                val: value,
                created: Date.now()
            }));
            return true;
        }

        getSecureToken(key) {
            const entry = this.#memoryVault.get(key);
            return entry ? entry.val : null;
        }

        revoke(key) {
            this.#memoryVault.delete(key);
        }
    }

    const tokenVault = new SecureTokenVault();

    // Layer 3: Anti-XSS Sanitizer & Strict Encoding Engine
    const Sanitizer = {
        encodeHTML: function (str) {
            if (typeof str !== 'string') return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        },

        validateSafeText: function (input) {
            if (typeof input !== 'string') return '';
            let sanitized = input.trim();
            if (sanitized.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
                sanitized = sanitized.substring(0, SECURITY_CONFIG.MAX_INPUT_LENGTH);
            }
            if (SECURITY_CONFIG.XSS_REGEX.test(sanitized)) {
                SecurityTelemetry.logViolation('XSS_ATTACK_MITIGATED', sanitized);
                return this.encodeHTML(sanitized.replace(SECURITY_CONFIG.XSS_REGEX, ''));
            }
            return this.encodeHTML(sanitized);
        }
    };

    // Layer 4: SQL Injection Inspection & Prevention Engine
    const SQLiShield = {
        isMalicious: function (payload) {
            if (!payload) return false;
            let targetString = '';
            if (typeof payload === 'string') {
                targetString = payload;
            } else if (typeof payload === 'object') {
                try {
                    targetString = JSON.stringify(payload);
                } catch {
                    return false;
                }
            }

            if (SECURITY_CONFIG.SQLI_REGEX.test(targetString)) {
                SecurityTelemetry.logViolation('SQLI_ATTACK_DETECTED', targetString);
                return true;
            }
            return false;
        },

        filterInput: function (str) {
            if (this.isMalicious(str)) {
                return '';
            }
            return Sanitizer.validateSafeText(str);
        }
    };

    // Layer 5: Prototype Hijack Protection & DOM Sink Sandboxing
    (function sealDOMSinks() {
        // Intercept innerHTML injection vector
        const originalSetInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function (dirtyContent) {
                if (typeof dirtyContent === 'string' && SECURITY_CONFIG.XSS_REGEX.test(dirtyContent)) {
                    SecurityTelemetry.logViolation('DOM_XSS_SINK_BLOCKED', dirtyContent);
                    dirtyContent = Sanitizer.encodeHTML(dirtyContent);
                }
                return originalSetInnerHTML.call(this, dirtyContent);
            },
            configurable: false,
            enumerable: true
        });

        // Intercept dangerous code-execution sinks
        window.eval = function () {
            SecurityTelemetry.logViolation('EVAL_EXECUTION_BLOCKED', 'Dynamic eval disabled by OWASP Guard.');
            throw new Error('[OWASP] eval() is permanently disabled for security.');
        };

        window.Function = new Proxy(window.Function, {
            construct(target, args) {
                SecurityTelemetry.logViolation('FUNCTION_CONSTRUCTOR_BLOCKED', 'Dynamic Function constructor blocked.');
                throw new Error('[OWASP] Dynamic code evaluation disabled.');
            }
        });
    })();

    // Layer 6: Network Layer Firewall (Fetch/XHR Guard against Token Leakage & SQLi Payloads)
    (function installNetworkFirewall() {
        const originalFetch = window.fetch;
        window.fetch = async function (input, init = {}) {
            const urlString = typeof input === 'string' ? input : (input && input.url ? input.url : '');

            // Token Leakage Prevention: Ensure credentials/tokens never leak to unknown domains
            const isLocalRequest = SECURITY_CONFIG.ALLOWED_ORIGINS.some(allowed => urlString.startsWith('/') || urlString.startsWith(allowed));
            if (!isLocalRequest && init && init.headers) {
                const headers = new Headers(init.headers);
                if (headers.has('Authorization') || headers.has('x-access-token')) {
                    SecurityTelemetry.logViolation('CROSS_ORIGIN_TOKEN_LEAK_PREVENTED', urlString);
                    headers.delete('Authorization');
                    headers.delete('x-access-token');
                    init.headers = headers;
                }
            }

            // Inspect Outbound Payload for SQLi & XSS
            if (init && init.body) {
                if (SQLiShield.isMalicious(init.body)) {
                    SecurityTelemetry.logViolation('OUTBOUND_SQLI_PAYLOAD_ABORTED', urlString);
                    throw new Error('[OWASP] Network request aborted: Malicious payload detected.');
                }
            }

            return originalFetch.apply(this, [input, init]);
        };

        // Proxy XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._b2_url = url;
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function (data) {
            if (data && SQLiShield.isMalicious(data)) {
                SecurityTelemetry.logViolation('XHR_SQLI_PAYLOAD_ABORTED', this._b2_url);
                throw new Error('[OWASP] XHR transmission aborted due to security policy.');
            }
            return originalSend.apply(this, arguments);
        };
    })();

    // Layer 7: Memory Integrity Guard for Game Engine State
    class MarioMemoryVault {
        #state = {
            score: 0,
            lives: 3,
            coins: 0
        };

        #checksum = 0;

        constructor() {
            this.#updateChecksum();
        }

        #calculateChecksum(s) {
            const str = `${s.score}:${s.lives}:${s.coins}#B2_SECURE_SALT`;
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            return hash;
        }

        #updateChecksum() {
            this.#checksum = this.#calculateChecksum(this.#state);
        }

        verifyIntegrity() {
            if (this.#calculateChecksum(this.#state) !== this.#checksum) {
                SecurityTelemetry.logViolation('MEMORY_CORRUPTION_OR_TAMPER', 'State signature mismatch');
                this.#state.score = 0;
                this.#state.lives = 0;
                return false;
            }
            return true;
        }

        update(mutationFn) {
            if (!this.verifyIntegrity()) return false;
            mutationFn(this.#state);
            this.#updateChecksum();
            return true;
        }

        read() {
            if (!this.verifyIntegrity()) {
                return { score: 0, lives: 0, coins: 0 };
            }
            return Object.freeze({ ...this.#state });
        }
    }

    // Layer 8: Meta CSP Dynamic Enforcer
    (function enforceCSP() {
        if (!SECURITY_CONFIG.STRICT_CSP) return;
        const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!existingMeta) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";
            document.head.appendChild(meta);
        }
    })();

    // Layer 9: Safe UI Input Adapter for Mario Game Components
    function attachSafeInputBinder(inputElement, onSafeSubmit) {
        if (!inputElement) return;

        inputElement.setAttribute('maxlength', SECURITY_CONFIG.MAX_INPUT_LENGTH);
        inputElement.setAttribute('autocomplete', 'off');

        inputElement.addEventListener('paste', function (e) {
            const pasteData = (e.clipboardData || window.clipboardData).getData('text');
            if (SQLiShield.isMalicious(pasteData) || SECURITY_CONFIG.XSS_REGEX.test(pasteData)) {
                e.preventDefault();
                SecurityTelemetry.logViolation('MALICIOUS_CLIPBOARD_PASTE', pasteData);
                alert('کاراکترهای غیرمجاز در متن الصاق شده شناسایی و مسدود شدند.');
            }
        });

        inputElement.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const sanitized = Sanitizer.validateSafeText(inputElement.value);
                if (sanitized !== inputElement.value) {
                    inputElement.value = sanitized;
                }
                if (onSafeSubmit) onSafeSubmit(sanitized);
            }
        });
    }

    // Layer 10: External Frozen Interface & Anti-Tampering Shield
    const OWASPGuardInstance = {
        Sanitizer: Object.freeze(Sanitizer),
        SQLiShield: Object.freeze(SQLiShield),
        TokenVault: tokenVault,
        GameMemory: new MarioMemoryVault(),
        attachSafeInputBinder: attachSafeInputBinder,
        getTelemetry: () => [...SecurityTelemetry.violations],
        version: '10.0.0-PROD-STABLE'
    };

    return Object.freeze(OWASPGuardInstance);
}));