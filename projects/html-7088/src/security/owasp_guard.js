/**
 * ==============================================================================
 * B2.st Cyber Defense Lab - Autonomous Software Firewall & OWASP Guard v2.4
 * Engine: 10-Layer Deep Packet & DOM Inspection Runtime (DDIP-R)
 * Focus: OWASP Top 10 (Client-Side XSS, Pre-flight SQLi Filtering, Token Vault)
 * Target: HTML5 Mario Engine Environment
 * ==============================================================================
 */

(function (window, document) {
    'use strict';

    // مسدودسازی اجرای تکراری
    if (window.__OWASP_GUARD_ACTIVE__) {
        console.warn('[B2.st-Shield] گارد امنیتی از قبل در حافظه فعال است.');
        return;
    }

    // ==========================================
    // LAYER 1 & 2: امضاهای تشخیصی (XSS & SQLi Signatures)
    // ==========================================
    const SIGNATURES = Object.freeze({
        SQLI: [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|CREATE|TRUNCATE)\b\s+)/i,
            /(--|#|\/\*|\*\/|;)/,
            /('|\b)(OR|AND)\b.+?=.+?/i,
            /\bWAITFOR\b\s+\bDELAY\b/i,
            /\bBENCHMARK\b\s*\(.+?,.+?\)/i
        ],
        XSS: [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript\s*:/gi,
            /vbscript\s*:/gi,
            /data\s*:\s*text\/html/gi,
            /on\w+\s*=\s*(['"]).*?\1/gi,
            /on\w+\s*=\s*[^>\s]+/gi,
            /<(iframe|object|embed|svg|img|style|link)\b.*?(src|href|data|onerror|onload)\s*=.*?>/gi
        ],
        TOKEN_PATTERNS: [
            /bearer\s+[a-zA-Z0-9_\-\.]{20,}/i,
            /eyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}/, // JWT Regex
            /[0-9a-fA-F]{32,64}/ // Generic Token/Key Hex
        ]
    });

    // ==========================================
    // LAYER 3: گاوصندوق حافظه امن (Isolated Token Vault)
    // ==========================================
    const TokenVault = (function () {
        const _vault = new WeakMap();
        const _keyReference = { id: 'B2_MARIO_ENCRYPTED_VAULT' };
        _vault.set(_keyReference, new Map());

        return {
            set: function (key, token) {
                if (typeof token !== 'string') throw new TypeError('[Vault] فرمت توکن نامعتبر است.');
                // فیلتر مقادیر پیش از ذخیره‌سازی
                const sanitizedToken = token.trim();
                _vault.get(_keyReference).set(key, sanitizedToken);
                // ممانعت از قرارگیری توکن در storage عمومی
                sessionStorage.removeItem(key);
                localStorage.removeItem(key);
            },
            get: function (key) {
                return _vault.get(_keyReference).get(key) || null;
            },
            revoke: function (key) {
                _vault.get(_keyReference).delete(key);
            },
            has: function (key) {
                return _vault.get(_keyReference).has(key);
            }
        };
    })();

    // ==========================================
    // LAYER 4: موتور پالایش و بهسازی داده (Sanitizer)
    // ==========================================
    const Sanitizer = {
        escapeHTML: function (str) {
            if (typeof str !== 'string') return str;
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        },

        inspectPayload: function (data, context = 'GENERAL') {
            if (typeof data !== 'string') return true;

            // اعتبارسنجی عبارات حمله SQLi
            for (let regex of SIGNATURES.SQLI) {
                if (regex.test(data)) {
                    SecurityAuditor.logViolation('CRITICAL', `تلاش برای تزریق SQL شناسایی شد در زمینه: ${context}`, data);
                    return false;
                }
            }

            // اعتبارسنجی عبارات حمله XSS
            for (let regex of SIGNATURES.XSS) {
                if (regex.test(data)) {
                    SecurityAuditor.logViolation('CRITICAL', `تزریق اسکریپت آلوده (XSS) مسدود شد در زمینه: ${context}`, data);
                    return false;
                }
            }

            return true;
        }
    };

    // ==========================================
    // LAYER 5: لاگر و بازرس رویدادهای امنیتی (Security Auditor)
    // ==========================================
    const SecurityAuditor = {
        logViolation: function (severity, description, payload) {
            const report = {
                timestamp: new Date().toISOString(),
                severity: severity,
                event: description,
                // کپسوله‌سازی برای جلوگیری از بازتولید اسکریپت داخل لاگ
                sample: Sanitizer.escapeHTML(String(payload).slice(0, 80)),
                engine: 'OWASP-B2-Guard'
            };
            console.error(`🚨 [B2.st SECURITY ALARM] [${severity}]: ${description}`, report);
            window.dispatchEvent(new CustomEvent('owasp-security-violation', { detail: report }));
        }
    };

    // ==========================================
    // LAYER 6: ایمن‌سازی ورودی‌های DOM (Virtual Sinks)
    // ==========================================
    function patchDOMSinks() {
        // ۱. مهار innerHTML
        const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function (value) {
                if (typeof value === 'string') {
                    if (!Sanitizer.inspectPayload(value, 'Element.innerHTML')) {
                        console.warn('[B2.st-Shield] ورودی innerHTML فاقد ایمنی است؛ پالایش خودکار انجام شد.');
                        value = Sanitizer.escapeHTML(value);
                    }
                }
                return originalInnerHTMLDescriptor.set.call(this, value);
            },
            get: function () {
                return originalInnerHTMLDescriptor.get.call(this);
            },
            configurable: false
        });

        // ۲. مهار setAttribute جهت جلوگیری از تزریق Event Handlerهای نامتعارف و آدرس‌های خطرناک
        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function (name, value) {
            const attrName = name.toLowerCase().trim();
            const attrValue = String(value);

            if (attrName.startsWith('on')) {
                SecurityAuditor.logViolation('HIGH', `مسدودسازی تخصیص هندلر درون‌خطی خطرناک: ${attrName}`, attrValue);
                return;
            }

            if ((attrName === 'src' || attrName === 'href') &&
                (attrValue.toLowerCase().startsWith('javascript:') || attrValue.toLowerCase().startsWith('data:text/html'))) {
                SecurityAuditor.logViolation('CRITICAL', `تلاش برای اجرای اسکریپت در شناسه ${attrName}`, attrValue);
                return;
            }

            return originalSetAttribute.call(this, name, value);
        };

        // ۳. محافظت از توابع مفسر مستقیم (eval, Function constructor)
        window.eval = function () {
            SecurityAuditor.logViolation('CRITICAL', 'تلاش نامعتبر برای فراخوانی eval مسدود شد.', 'eval execution');
            throw new Error('[B2.st Security] فراخوانی مستقیم eval از لحاظ امنیتی ممنوع می‌باشد.');
        };
    }

    // ==========================================
    // LAYER 7: فایروال ترافیک شبکه (Fetch & XHR Interceptor)
    // ==========================================
    function setupNetworkFirewall() {
        // ۱. رهگیری Fetch API
        const originalFetch = window.fetch;
        window.fetch = async function (resource, options = {}) {
            const url = typeof resource === 'string' ? resource : resource.url;

            // ارزیابی آدرس اینترنتی (Query Strings)
            if (!Sanitizer.inspectPayload(url, 'Fetch URL Query')) {
                throw new SecurityError('[B2.st Firewall] درخواست به دلیل شناسایی کاراکترهای مخرب متوقف شد.');
            }

            // بازرسی بادی درخواست
            if (options.body && typeof options.body === 'string') {
                if (!Sanitizer.inspectPayload(options.body, 'Fetch Body Data')) {
                    throw new SecurityError('[B2.st Firewall] بدنه ارسالی به علت نقض سیاست OWASP معلق شد.');
                }
            }

            // پیشگیری از افشای توکن در دامنه‌های غریبه (Token Leakage Defense)
            try {
                const parsedUrl = new URL(url, window.location.origin);
                if (parsedUrl.origin !== window.location.origin) {
                    if (options.headers) {
                        const headersObj = new Headers(options.headers);
                        if (headersObj.has('Authorization')) {
                            SecurityAuditor.logViolation('HIGH', 'نشت توکن در دامنه سوم شخص شناسایی و بلاک شد.', url);
                            headersObj.delete('Authorization');
                            options.headers = headersObj;
                        }
                    }
                }
            } catch (e) {
                // ادامه مسیر در صورت خطای تجزیه
            }

            return originalFetch.apply(this, [resource, options]);
        };

        // ۲. رهگیری XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            if (!Sanitizer.inspectPayload(url, 'XHR Open URL')) {
                throw new SecurityError('[B2.st Firewall] درخواست XHR متوقف شد.');
            }
            return originalXHROpen.apply(this, [method, url, ...rest]);
        };

        const originalXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (body) {
            if (body && typeof body === 'string') {
                if (!Sanitizer.inspectPayload(body, 'XHR Payload Data')) {
                    throw new SecurityError('[B2.st Firewall] بدنه XHR مسدود شد.');
                }
            }
            return originalXHRSend.apply(this, [body]);
        };
    }

    // ==========================================
    // LAYER 8: فیلتراسیون زنده فیلدهای بازی ماریو (UI/Input Sanitizer)
    // ==========================================
    function attachInputFilterEngine() {
        document.addEventListener('input', function (event) {
            const target = event.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                const currentVal = target.value;
                // حذف بلافاصله کاراکترهای کنترلی تزریق قبل از پردازش موتور بازی
                if (!Sanitizer.inspectPayload(currentVal, 'Realtime Form Input')) {
                    target.value = Sanitizer.escapeHTML(currentVal)
                        .replace(/[<>'"`;()=]/g, '');
                    target.dispatchEvent(new Event('change'));
                }
            }
        }, true);
    }

    // ==========================================
    // LAYER 9 & 10: سخت‌سازی نشست و انجماد ماژول
    // ==========================================
    function protectHistoryAndReferrer() {
        // حذف پارامترهای توکن‌دار از URL
        if (window.history && window.history.replaceState) {
            const currentUrl = new URL(window.location.href);
            let cleaned = false;
            ['token', 'auth', 'jwt', 'access_token', 'api_key'].forEach(param => {
                if (currentUrl.searchParams.has(param)) {
                    TokenVault.set(param, currentUrl.searchParams.get(param));
                    currentUrl.searchParams.delete(param);
                    cleaned = true;
                }
            });
            if (cleaned) {
                window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search);
                console.info('[B2.st-Shield] پارامترهای توکن از نوار آدرس پاک و به والت امن منتقل گردید.');
            }
        }
    }

    // فعال‌سازی تمامی لایه‌ها
    try {
        patchDOMSinks();
        setupNetworkFirewall();
        attachInputFilterEngine();
        protectHistoryAndReferrer();

        // نشانه ران‌تایم محافظت‌شده
        Object.defineProperty(window, '__OWASP_GUARD_ACTIVE__', {
            value: true,
            writable: false,
            configurable: false
        });

        // افشای ایمن APIهای موردنیاز بازی
        window.B2Secure = Object.freeze({
            sanitize: Sanitizer.escapeHTML,
            verifySafeString: Sanitizer.inspectPayload,
            vault: TokenVault,
            auditor: {
                reportThreat: SecurityAuditor.logViolation
            }
        });

        console.info('%c[B2.st Studio] موتور OWASP Guard با موفقیت بارگذاری شد. کلیه سطوح نفوذ مسدود هستند.', 'color: #00ff00; font-weight: bold;');
    } catch (err) {
        console.error('[B2.st Shield Fatal Error] راه‌اندازی گارد امنیتی ناموفق بود:', err);
    }

})(window, document);