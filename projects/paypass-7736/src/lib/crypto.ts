import crypto from 'node:crypto';

/**
 * B2.st Studio | PayPass Cryptographic Core Module
 * ماژول رمزنگاری امن محتوای قفل‌شده مبتنی بر AES-256-GCM (Authenticated Encryption).
 * 
 * ساختار بسته رمزگذاری‌شده:
 * [Base64URL(IV: 12-bytes)] . [Base64URL(AuthTag: 16-bytes)] . [Base64URL(Ciphertext)]
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // ۱۲ بایت بر اساس استاندارد NIST SP 800-38D برای GCM
const AUTH_TAG_LENGTH_BYTES = 16; // ۱۶ بایت (۱۲۸ بیت) برای تضمین اصالت و عدم دستکاری

export class CryptoError extends Error {
  constructor(message: string, public readonly code: string) {
    super(`[PayPass Crypto] ${message}`);
    this.name = 'CryptoError';
  }
}

/**
 * دریافت و اعتبارسنجی کلید متقارن ۲۵۶ بیتی از متغیرهای محیطی
 */
function resolveMasterKey(): Buffer {
  const rawKey = process.env.PAYPASS_MASTER_KEY || process.env.ENCRYPTION_KEY;

  if (!rawKey) {
    throw new CryptoError(
      'متغیر محیطی PAYPASS_MASTER_KEY تعریف نشده است. جهت حفظ امنیت، کلید ۳۲ بایتی الزامی است.',
      'KEY_MISSING'
    );
  }

  // ۱. در صورتی که کلید به فرمت هگز ۶۴ کاراکتری (۳۲ بایت) باشد
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  // ۲. در صورتی که کلید به فرمت Base64 با طول ۳۲ بایت باشد
  if (rawKey.length === 44 && rawKey.endsWith('=')) {
    const buf = Buffer.from(rawKey, 'base64');
    if (buf.length === 32) return buf;
  }

  // ۳. در صورتی که رشته با طول دقیق ۳۲ نویسه باشد
  if (Buffer.byteLength(rawKey, 'utf8') === 32) {
    return Buffer.from(rawKey, 'utf8');
  }

  // ۴. در غیر این صورت، استخراج کلید امن ۳۲ بایتی با توزیع شبه‌تصادفی SHA-256
  return crypto.createHash('sha256').update(rawKey, 'utf8').digest();
}

/**
 * رمزنگاری محتوای حساس پیش از ذخیره‌سازی در پایگاه‌داده
 * @param plainText محتوای خام فروشنده (لینک، کلید، سند یا پیام اختصاصی)
 * @returns رشته محصور شده امن به فرمت iv.tag.ciphertext
 */
export function encryptContent(plainText: string): string {
  if (typeof plainText !== 'string' || plainText.length === 0) {
    throw new CryptoError('محتوای ورودی جهت رمزنگاری نمی‌تواند خالی باشد.', 'INVALID_INPUT');
  }

  try {
    const key = resolveMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH_BYTES);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });

    const encryptedChunks: Buffer[] = [];
    encryptedChunks.push(cipher.update(plainText, 'utf8'));
    encryptedChunks.push(cipher.final());

    const ciphertext = Buffer.concat(encryptedChunks);
    const authTag = cipher.getAuthTag();

    // بسته‌بندی در قالبی سبک، فشرده و امن برای URL و JSON
    return [
      iv.toString('base64url'),
      authTag.toString('base64url'),
      ciphertext.toString('base64url'),
    ].join('.');
  } catch (error) {
    if (error instanceof CryptoError) throw error;
    throw new CryptoError(
      `خطای غیرمنتظره در روال رمزنگاری: ${(error as Error).message}`,
      'ENCRYPTION_FAILED'
    );
  }
}

/**
 * رمزگشایی محتوای قفل‌شده صرفاً پس از تایید موفقیت تراکنش در سمت سرور
 * @param encryptedPayload بسته رمز شده دریافتی از دیتابیس
 * @returns متن اصلی رمزگشایی شده
 */
export function decryptContent(encryptedPayload: string): string {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') {
    throw new CryptoError('بسته رمز معتبر نیست.', 'INVALID_PAYLOAD');
  }

  const parts = encryptedPayload.split('.');
  if (parts.length !== 3) {
    throw new CryptoError(
      'ساختار داده رمزنگاری‌شده نامعتبر است (نیازمند فرمت سه‌بخشی IV.TAG.CIPHER).',
      'CORRUPTED_PAYLOAD'
    );
  }

  const [ivRaw, authTagRaw, cipherRaw] = parts;

  try {
    const key = resolveMasterKey();
    const iv = Buffer.from(ivRaw, 'base64url');
    const authTag = Buffer.from(authTagRaw, 'base64url');
    const ciphertext = Buffer.from(cipherRaw, 'base64url');

    if (iv.length !== IV_LENGTH_BYTES) {
      throw new CryptoError('طول بردار مقداردهی اولیه (IV) نامعتبر است.', 'INVALID_IV');
    }

    if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new CryptoError('طول تگ اصالت (Authentication Tag) نامعتبر است.', 'INVALID_AUTH_TAG');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    if (error instanceof CryptoError) throw error;
    // خطای Authentication failure در صورت دستکاری دیتابیس یا کلید اشتباه
    throw new CryptoError(
      'تایید اصالت محتوا شکست خورد. محتوا دستکاری شده یا کلید رمزنگاری نامعتبر است.',
      'TAMPERING_DETECTED'
    );
  }
}

/**
 * ابزار تولید کلید امن تصادفی ۲۵۶ بیتی مناسب استقرار پروژه
 */
export function generateRandomMasterKeyHex(): string {
  return crypto.randomBytes(32).toString('hex');
}