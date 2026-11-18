/**
 * WhiteAudit - Security Headers & SSL Analysis Engine
 * Studio: B2.st
 * Description: Low-overhead Axios and Node.js TLS handshake inspector for server security profiling.
 */

import tls from 'node:tls';
import { URL } from 'node:url';
import axios, { AxiosResponse } from 'axios';
import {
  SecurityAuditResult,
  SslCertificateAudit,
  SecurityGrade,
  AuditStatus,
  HstsAuditDetail,
  CspAuditDetail,
  SecurityHeaderDetail,
  CompressionAudit,
} from '@/types/audit';

const TIMEOUT_MS = 10000;
const USER_AGENT = 'WhiteAuditBot/1.0 (+https://whiteaudit.b2.st; Security Auditor)';

/**
 * Direct TLS handshake connection to extract peer certificate metadata
 */
export async function inspectSslCertificate(
  hostname: string,
  port = 443,
  timeoutMs = 8000
): Promise<SslCertificateAudit> {
  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          valid: false,
          authorized: false,
          authorizationError: 'ETIMEDOUT: برقراری اتصال امن با پورت ۴۴۳ منقضی شد.',
          protocol: null,
          issuer: {},
          subject: {},
          validFrom: null,
          validTo: null,
          daysRemaining: null,
          subjectAltNames: [],
          status: 'fail',
          score: 0,
        });
      }
    }, timeoutMs);

    try {
      const socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname,
          rejectUnauthorized: false, // Allows inspecting expired or self-signed certs without throwing immediately
        },
        () => {
          if (settled) {
            socket.destroy();
            return;
          }
          settled = true;
          clearTimeout(timer);

          try {
            const cert = socket.getPeerCertificate(true);
            const protocol = socket.getProtocol();
            const authorized = socket.authorized;
            const authorizationError = socket.authorizationError ? String(socket.authorizationError) : null;

            if (!cert || Object.keys(cert).length === 0) {
              socket.destroy();
              resolve({
                valid: false,
                authorized: false,
                authorizationError: 'گواهی معتبر SSL/TLS از سمت سرور بازگردانده نشد.',
                protocol,
                issuer: {},
                subject: {},
                validFrom: null,
                validTo: null,
                daysRemaining: null,
                subjectAltNames: [],
                status: 'fail',
                score: 0,
              });
              return;
            }

            const validToDate = cert.valid_to ? new Date(cert.valid_to) : null;
            const validFromDate = cert.valid_from ? new Date(cert.valid_from) : null;
            const now = Date.now();

            let daysRemaining: number | null = null;
            let isValidDate = false;

            if (validToDate && validFromDate) {
              const remainingMs = validToDate.getTime() - now;
              daysRemaining = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
              isValidDate = now >= validFromDate.getTime() && now <= validToDate.getTime();
            }

            const subjectAltNames: string[] = cert.subjectaltname
              ? cert.subjectaltname
                  .split(',')
                  .map((entry) => entry.trim().replace(/^DNS:/i, ''))
                  .filter(Boolean)
              : [];

            const isOverallValid = authorized && isValidDate && (daysRemaining !== null ? daysRemaining > 0 : false);

            let score = 100;
            let status: AuditStatus = 'pass';

            if (!isOverallValid) {
              score = 0;
              status = 'fail';
            } else if (daysRemaining !== null && daysRemaining <= 14) {
              score = 40;
              status = 'warn';
            } else if (daysRemaining !== null && daysRemaining <= 30) {
              score = 75;
              status = 'warn';
            }

            socket.destroy();

            resolve({
              valid: isOverallValid,
              authorized,
              authorizationError,
              protocol,
              issuer: {
                organization: cert.issuer?.O,
                commonName: cert.issuer?.CN,
                country: cert.issuer?.C,
              },
              subject: {
                organization: cert.subject?.O,
                commonName: cert.subject?.CN,
              },
              validFrom: cert.valid_from || null,
              validTo: cert.valid_to || null,
              daysRemaining,
              subjectAltNames,
              fingerprint256: cert.fingerprint256,
              status,
              score,
            });
          } catch (innerErr) {
            socket.destroy();
            resolve({
              valid: false,
              authorized: false,
              authorizationError: innerErr instanceof Error ? innerErr.message : 'خطای پردازش گواهی SSL',
              protocol: null,
              issuer: {},
              subject: {},
              validFrom: null,
              validTo: null,
              daysRemaining: null,
              subjectAltNames: [],
              status: 'fail',
              score: 0,
            });
          }
        }
      );

      socket.on('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          socket.destroy();
          resolve({
            valid: false,
            authorized: false,
            authorizationError: `خطای هندشیک TLS: ${err.message}`,
            protocol: null,
            issuer: {},
            subject: {},
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            subjectAltNames: [],
            status: 'fail',
            score: 0,
          });
        }
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({
          valid: false,
          authorized: false,
          authorizationError: err instanceof Error ? err.message : 'عدم امکان راه‌اندازی سوکت TLS',
          protocol: null,
          issuer: {},
          subject: {},
          validFrom: null,
          validTo: null,
          daysRemaining: null,
          subjectAltNames: [],
          status: 'fail',
          score: 0,
        });
      }
    }
  });
}

/**
 * Parses and audits Strict-Transport-Security (HSTS)
 */
function auditHsts(headerVal: string | undefined): HstsAuditDetail {
  const name = 'Strict-Transport-Security';
  if (!headerVal) {
    return {
      name,
      present: false,
      value: null,
      status: 'fail',
      score: 0,
      importance: 'critical',
      recommendation: 'فعال‌سازی HSTS با حداقل max-age=31536000 و includeSubDomains ضروری است.',
    };
  }

  const normalized = headerVal.toLowerCase();
  const maxAgeMatch = normalized.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : null;
  const includeSubDomains = normalized.includes('includesubdomains');
  const preload = normalized.includes('preload');

  let score = 50;
  let status: AuditStatus = 'warn';

  // Standard recommendation: >= 1 year (31,536,000 seconds)
  if (maxAge && maxAge >= 31536000) {
    score = 80;
    if (includeSubDomains) score += 15;
    if (preload) score += 5;
    status = 'pass';
  } else if (maxAge && maxAge >= 2592000) {
    score = 65;
    status = 'warn';
  }

  return {
    name,
    present: true,
    value: headerVal,
    status,
    score: Math.min(100, score),
    importance: 'critical',
    parsed: {
      maxAge,
      includeSubDomains,
      preload,
    },
    recommendation:
      status === 'pass'
        ? undefined
        : 'حداقل مقدار max-age برای HSTS باید برابر یک سال (31536000) تعیین شود.',
  };
}

/**
 * Parses and audits Content-Security-Policy (CSP)
 */
function auditCsp(headerVal: string | undefined): CspAuditDetail {
  const name = 'Content-Security-Policy';
  if (!headerVal) {
    return {
      name,
      present: false,
      value: null,
      status: 'fail',
      score: 0,
      importance: 'critical',
      recommendation: 'پیکربندی CSP جهت جلوگیری از حملات XSS و Data Injection الزامی است.',
    };
  }

  const normalized = headerVal.toLowerCase();
  const directives = headerVal.split(';').map((d) => d.trim()).filter(Boolean);
  const hasDefaultSrc = normalized.includes('default-src');
  const hasScriptSrc = normalized.includes('script-src');
  const hasUnsafeInline = normalized.includes("'unsafe-inline'");
  const hasUnsafeEval = normalized.includes("'unsafe-eval'");

  let score = 60;
  let status: AuditStatus = 'warn';

  if (hasDefaultSrc || hasScriptSrc) {
    score += 20;
  }
  if (!hasUnsafeInline) {
    score += 10;
  }
  if (!hasUnsafeEval) {
    score += 10;
  }

  if (score >= 80) {
    status = 'pass';
  }

  return {
    name,
    present: true,
    value: headerVal,
    status,
    score,
    importance: 'critical',
    parsed: {
      directivesCount: directives.length,
      hasDefaultSrc,
      hasScriptSrc,
      hasUnsafeInline,
      hasUnsafeEval,
    },
    recommendation:
      hasUnsafeInline || hasUnsafeEval
        ? 'استفاده از عبارات unsafe-inline یا unsafe-eval آسیب‌پذیری احتمالی ایجاد می‌کند.'
        : undefined,
  };
}

/**
 * Parses and audits X-Frame-Options
 */
function auditXFrameOptions(headerVal: string | undefined): SecurityHeaderDetail {
  const name = 'X-Frame-Options';
  if (!headerVal) {
    return {
      name,
      present: false,
      value: null,
      status: 'fail',
      score: 0,
      importance: 'high',
      recommendation: 'جهت محافظت در برابر حملات Clickjacking مقدار DENY یا SAMEORIGIN را تنظیم کنید.',
    };
  }

  const normalized = headerVal.trim().toUpperCase();
  const isOptimal = normalized === 'DENY' || normalized === 'SAMEORIGIN';

  return {
    name,
    present: true,
    value: headerVal,
    status: isOptimal ? 'pass' : 'warn',
    score: isOptimal ? 100 : 60,
    importance: 'high',
  };
}

/**
 * Parses and audits X-Content-Type-Options
 */
function auditXContentTypeOptions(headerVal: string | undefined): SecurityHeaderDetail {
  const name = 'X-Content-Type-Options';
  if (!headerVal) {
    return {
      name,
      present: false,
      value: null,
      status: 'fail',
      score: 0,
      importance: 'high',
      recommendation: 'مقدار nosniff برای مسدودسازی حملات MIME-confusion حیاتی است.',
    };
  }

  const isNosniff = headerVal.trim().toLowerCase() === 'nosniff';
  return {
    name,
    present: true,
    value: headerVal,
    status: isNosniff ? 'pass' : 'warn',
    score: isNosniff ? 100 : 50,
    importance: 'high',
  };
}

/**
 * Parses and audits Referrer-Policy
 */
function auditReferrerPolicy(headerVal: string | undefined): SecurityHeaderDetail {
  const name = 'Referrer-Policy';
  if (!headerVal) {
    return {
      name,
      present: false,
      value: null,
      status: 'warn',
      score: 40,
      importance: 'medium',
      recommendation: 'تنظیم strict-origin-when-cross-origin به حفظ حریم خصوصی ارجاع‌ها کمک می‌کند.',
    };
  }

  const safePolicies = [
    'strict-origin-when-cross-origin',
    'strict-origin',
    'no-referrer',
    'same-origin',
  ];

  const normalized = headerVal.trim().toLowerCase();
  const isSafe = safePolicies.some((p) => normalized.includes(p));

  return {
    name,
    present: true,
    value: headerVal,
    status: isSafe ? 'pass' : 'warn',
    score: isSafe ? 100 : 60,
    importance: 'medium',
  };
}

/**
 * Parses and audits Permissions-Policy
 */
function auditPermissionsPolicy(headerVal: string | undefined): SecurityHeaderDetail {
  const name = 'Permissions-Policy';
  if (!headerVal) {
    return {
      name,
      present: false,
      value: null,
      status: 'warn',
      score: 20,
      importance: 'medium',
      recommendation: 'تنظیم Permissions-Policy دسترسی‌های غیرضروری مرورگر مانند دوربین و میکروفون را محدود می‌کند.',
    };
  }

  return {
    name,
    present: true,
    value: headerVal,
    status: 'pass',
    score: 100,
    importance: 'medium',
  };
}

/**
 * Audits HTTP Compression (Brotli, Gzip, Deflate)
 */
function auditCompression(contentEncoding: string | undefined): CompressionAudit {
  if (!contentEncoding) {
    return {
      enabled: false,
      algorithm: 'none',
      headerValue: null,
      status: 'warn',
    };
  }

  const encoding = contentEncoding.trim().toLowerCase();

  if (encoding.includes('br')) {
    return {
      enabled: true,
      algorithm: 'br',
      headerValue: contentEncoding,
      status: 'pass',
    };
  }

  if (encoding.includes('gzip')) {
    return {
      enabled: true,
      algorithm: 'gzip',
      headerValue: contentEncoding,
      status: 'pass',
    };
  }

  if (encoding.includes('deflate')) {
    return {
      enabled: true,
      algorithm: 'deflate',
      headerValue: contentEncoding,
      status: 'pass',
    };
  }

  return {
    enabled: true,
    algorithm: 'unknown',
    headerValue: contentEncoding,
    status: 'warn',
  };
}

/**
 * Computes letter grade based on numeric score
 */
function scoreToGrade(score: number): SecurityGrade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Runs security & SSL header analysis
 */
export async function auditSecurity(rawUrl: string): Promise<SecurityAuditResult> {
  const parsedUrl = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  const hostname = parsedUrl.hostname;
  const targetUrl = parsedUrl.toString();

  // Parallel Execution: Fetch HTTP Headers + Perform TLS Certificate Handshake
  const [httpResponseResult, sslResult] = await Promise.allSettled([
    axios.get<string>(targetUrl, {
      timeout: TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    }),
    inspectSslCertificate(hostname, parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443),
  ]);

  let responseHeaders: Record<string, string | undefined> = {};
  let redirectsToHttps = false;

  if (httpResponseResult.status === 'fulfilled') {
    const res: AxiosResponse = httpResponseResult.value;
    responseHeaders = Object.entries(res.headers).reduce((acc, [k, v]) => {
      acc[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : (v as string | undefined);
      return acc;
    }, {} as Record<string, string | undefined>);

    // Detect if final URL was redirected to HTTPS
    if (res.request?.res?.responseUrl) {
      redirectsToHttps = res.request.res.responseUrl.startsWith('https://');
    } else {
      redirectsToHttps = targetUrl.startsWith('https://');
    }
  }

  const ssl =
    sslResult.status === 'fulfilled'
      ? sslResult.value
      : {
          valid: false,
          authorized: false,
          authorizationError: 'عدم موفقیت در اجرای ارزیابی SSL',
          protocol: null,
          issuer: {},
          subject: {},
          validFrom: null,
          validTo: null,
          daysRemaining: null,
          subjectAltNames: [],
          status: 'fail' as AuditStatus,
          score: 0,
        };

  // Inspect security headers
  const hsts = auditHsts(responseHeaders['strict-transport-security']);
  const csp = auditCsp(responseHeaders['content-security-policy']);
  const xFrameOptions = auditXFrameOptions(responseHeaders['x-frame-options']);
  const xContentTypeOptions = auditXContentTypeOptions(responseHeaders['x-content-type-options']);
  const referrerPolicy = auditReferrerPolicy(responseHeaders['referrer-policy']);
  const permissionsPolicy = auditPermissionsPolicy(
    responseHeaders['permissions-policy'] || responseHeaders['feature-policy']
  );
  const compression = auditCompression(responseHeaders['content-encoding']);

  const exposedServer = responseHeaders['server'] || null;
  const exposedPoweredBy = responseHeaders['x-powered-by'] || null;

  // Weighted Score Calculation (Total = 100)
  // SSL: 25%
  // HSTS: 25%
  // CSP: 20%
  // X-Frame-Options: 10%
  // X-Content-Type-Options: 10%
  // Referrer-Policy: 5%
  // Permissions-Policy: 5%
  let totalScore =
    (ssl.score * 0.25) +
    (hsts.score * 0.25) +
    (csp.score * 0.20) +
    (xFrameOptions.score * 0.10) +
    (xContentTypeOptions.score * 0.10) +
    (referrerPolicy.score * 0.05) +
    (permissionsPolicy.score * 0.05);

  // Penalize for leaking framework/server tech stack
  if (exposedPoweredBy) totalScore -= 5;
  if (exposedServer && exposedServer.length > 15) totalScore -= 3;

  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
  const grade = scoreToGrade(totalScore);

  return {
    url: targetUrl,
    hostname,
    score: totalScore,
    grade,
    timestamp: new Date().toISOString(),
    ssl,
    headers: {
      hsts,
      csp,
      xFrameOptions,
      xContentTypeOptions,
      referrerPolicy,
      permissionsPolicy,
      serverInfo: {
        exposedServer,
        exposedPoweredBy,
      },
    },
    compression,
    redirectsToHttps,
  };
}