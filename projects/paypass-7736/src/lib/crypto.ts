/**
 * ماژول فوق‌امن رمزنگاری متقارن پی‌پاس (PayPass) - B2.st Studio
 * مبتنی بر الگوریتم استاندارد صنعتی AES-256-GCM
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const DEFAULT_KEY_HEX = process.env.PAYPASS_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/**
 * دریافت و اعتبارسنجی کلید رمزنگاری ۲۵۶ بیتی
 */
function getCipherKey(keyHex?: string): Buffer {
  const hex = keyHex || DEFAULT_KEY_HEX;
  if (!hex || hex.length !== 64) {
    throw new Error('کلید رمزنگاری نامعتبر است: کلید باید دقیقا ۶۴ کاراکتر هگزادسیمال (۲۵۶ بیت) باشد.');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * رمزنگاری متقارن متن حساس قبل از ذخیره‌سازی در پایگاه‌داده
 * خروجی: فرمت ساختاریافته "ivHex:authTagHex:cipherHex"
 */
export function encryptSecret(plainText: string, keyHex?: string): string {
  if (plainText === undefined || plainText === null) {
    throw new Error('ورودی متن جهت رمزنگاری نمی‌تواند تهی باشد.');
  }

  const key = getCipherKey(keyHex);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * رمزگشایی متن پس از تایید موفقیت تراکنش بانکی
 * بررسی صحت تگ احراز اصالت (Authentication Tag) برای جلوگیری از تامپرینگ
 */
export function decryptSecret(payload: string, keyHex?: string): string {
  if (!payload || typeof payload !== 'string') {
    throw new Error('پی‌لود رمزنگاری نامعتبر است.');
  }

  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('فرمت پی‌لود رمزنگاری استاندارد نیست (انتظار iv:tag:data).');
  }

  const [ivHex, authTagHex, cipherHex] = parts;

  if (!ivHex || !authTagHex || !cipherHex) {
    throw new Error('بخش‌های پی‌لود رمزنگاری ناقص است.');
  }

  const key = getCipherKey(keyHex);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error('طول بردار مقداردهی اولیه (IV) نامعتبر است.');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('خطای احراز اصالت: داده رمز شده دستکاری شده یا کلید نامعتبر است.');
  }
}