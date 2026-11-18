/**
 * تست‌های واحد رمزنگاری و عدم نشت داده پی‌پاس (PayPass)
 * tests/crypto.test.ts
 */

import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from '../src/lib/crypto';
import crypto from 'crypto';

describe('AES-256-GCM Symmetric Cryptography Engine', () => {
  const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const SAMPLE_SECRET = 'https://drive.google.com/file/d/B2ST_ULTRA_LUXURY_ASSET/view?usp=sharing';
  const PERSIAN_SECRET = 'لینک دسترسی وبینار استودیو B2.st + کد تخفیف: LUX-2025';

  it('باید محتوا را به درستی رمزنگاری و بدون تغییر بازگرداند', () => {
    const encrypted = encryptSecret(SAMPLE_SECRET, TEST_KEY);
    const decrypted = decryptSecret(encrypted, TEST_KEY);

    expect(decrypted).toBe(SAMPLE_SECRET);
  });

  it('باید از کاراکترهای چندزبانه، فارسی، ایموجی و علائم نگارشی بدون هیچ‌گونه تخریب UTF-8 پشتیبانی کند', () => {
    const complexSecret = '🔥 محتوای فوق‌محرمانه پی‌پاس! 🚀 شامل لینک: https://b2.st/vip?key=100%20%D8%AE';
    const encrypted = encryptSecret(complexSecret, TEST_KEY);
    const decrypted = decryptSecret(encrypted, TEST_KEY);

    expect(decrypted).toBe(complexSecret);
  });

  it('عدم نشت داده خام (Data Leakage Protection): نباید هیچ اثری از متن خام در پی‌لود رمز شده موجود باشد', () => {
    const secret = 'TOP_SECRET_PASSWORD_B2_STUDIO_9988';
    const encryptedPayload = encryptSecret(secret, TEST_KEY);

    // بررسی عدم وجود متن کامل
    expect(encryptedPayload).not.toContain(secret);

    // بررسی عدم وجود زیررشته‌های معنادار ۳ کاراکتری یا بیشتر
    const parts = secret.split('_');
    for (const part of parts) {
      expect(encryptedPayload.toLowerCase()).not.toContain(part.toLowerCase());
    }
  });

  it('باید برای ورودی‌های یکسان، به دلیل IV تصادفی، سایفرتکست‌های کاملاً متمایز تولید کند', () => {
    const text = 'SAME_INPUT_PAYLOAD';
    const enc1 = encryptSecret(text, TEST_KEY);
    const enc2 = encryptSecret(text, TEST_KEY);

    expect(enc1).not.toBe(enc2);

    const [iv1] = enc1.split(':');
    const [iv2] = enc2.split(':');
    expect(iv1).not.toBe(iv2);

    // با این حال هر دو به همان متن اصلی دیکریپت شوند
    expect(decryptSecret(enc1, TEST_KEY)).toBe(text);
    expect(decryptSecret(enc2, TEST_KEY)).toBe(text);
  });

  it('مقاومت در برابر دستکاری (Anti-Tampering): با تغییر حتی یک کاراکتر در دیتای رمز شده باید استثنا پرتاب کند', () => {
    const encrypted = encryptSecret(PERSIAN_SECRET, TEST_KEY);
    const [iv, tag, cipher] = encrypted.split(':');

    // دستکاری در آخرین کاراکتر سایفر
    const tamperedChar = cipher[cipher.length - 1] === 'a' ? 'b' : 'a';
    const tamperedCipher = cipher.slice(0, -1) + tamperedChar;
    const tamperedPayload = `${iv}:${tag}:${tamperedCipher}`;

    expect(() => decryptSecret(tamperedPayload, TEST_KEY)).toThrow(
      /خطای احراز اصالت: داده رمز شده دستکاری شده/
    );
  });

  it('مقاومت در برابر دستکاری تگ احراز اصالت (Auth Tag Tampering)', () => {
    const encrypted = encryptSecret(PERSIAN_SECRET, TEST_KEY);
    const [iv, tag, cipher] = encrypted.split(':');

    // دستکاری در تگ اعتبارسنجی
    const tamperedTag = 'ff' + tag.slice(2);
    const tamperedPayload = `${iv}:${tamperedTag}:${cipher}`;

    expect(() => decryptSecret(tamperedPayload, TEST_KEY)).toThrow(
      /خطای احراز اصالت: داده رمز شده دستکاری شده/
    );
  });

  it('باید در صورت فرمت نامعتبر پی‌لود خطا دهد', () => {
    expect(() => decryptSecret('invalid-payload-without-colons', TEST_KEY)).toThrow(
      /فرمت پی‌لود رمزنگاری استاندارد نیست/
    );
    expect(() => decryptSecret('iv:tag', TEST_KEY)).toThrow(/فرمت پی‌لود رمزنگاری استاندارد نیست/);
    expect(() => decryptSecret('', TEST_KEY)).toThrow(/پی‌لود رمزنگاری نامعتبر است/);
  });

  it('باید در صورت کلید نامعتبر (کمتر یا بیشتر از ۶۴ کاراکتر هگز) خطا دهد', () => {
    const shortKey = '1234abcd';
    expect(() => encryptSecret('test', shortKey)).toThrow(/کلید رمزنگاری نامعتبر است/);
    expect(() => decryptSecret('aa:bb:cc', shortKey)).toThrow(/کلید رمزنگاری نامعتبر است/);
  });
});