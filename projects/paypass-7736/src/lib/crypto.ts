import crypto from 'node:crypto';
import { ENV } from '../../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // ۱۲ بایت برای استاندارد GCM
const AUTH_TAG_LENGTH = 16;

/**
 * دریافت کلید ۳۲ بایتی نرمالایز شده از متغیر محیطی
 */
function getCipherKey(): Buffer {
  const hexKey = ENV.ENCRYPTION_SECRET_KEY;
  if (hexKey.length === 64) {
    return Buffer.from(hexKey, 'hex');
  }
  // در صورت عبور رشته متنی، تولید هش ۳۲ بایتی SHA-256
  return crypto.createHash('sha256').update(hexKey).digest();
}

/**
 * رمزنگاری محتوای حساس با الگوریتم AES-256-GCM
 * فرمت خروجی: iv:authTag:encryptedPayload
 */
export function encryptSensitiveContent(plainText: string): string {
  if (!plainText) {
    throw new Error('محتوای ورودی جهت رمزنگاری نمی‌تواند خالی باشد.');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getCipherKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * رمزگشایی محتوای حساس و تایید صحت امضای احراز هویت (Auth Tag)
 */
export function decryptSensitiveContent(cipherPayload: string): string {
  if (!cipherPayload || !cipherPayload.includes(':')) {
    throw new Error('قالب دیتای رمزنگاری شده نامعتبر است.');
  }

  const [ivHex, authTagHex, encryptedHex] = cipherPayload.split(':');

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('اجزای بلاک رمزنگاری شده ناقص است.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getCipherKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}