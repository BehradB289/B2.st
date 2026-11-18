import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encryptContent,
  decryptContent,
  generateRandomMasterKeyHex,
  CryptoError,
} from '../src/lib/crypto';
import { calculatePlatformFee } from '../src/lib/fee';

describe('PayPass Cryptographic Engine (AES-256-GCM)', () => {
  const originalEnvKey = process.env.PAYPASS_MASTER_KEY;
  const testKeyHex = generateRandomMasterKeyHex();

  beforeEach(() => {
    process.env.PAYPASS_MASTER_KEY = testKeyHex;
  });

  afterEach(() => {
    process.env.PAYPASS_MASTER_KEY = originalEnvKey;
  });

  it('باید محتوای متنی فارسی و کاراکترهای یونیکد را به درستی رمزگذاری و رمزگشایی کند', () => {
    const rawSecret = 'لینک دانلود دوره خصوصی استودیو B2: https://b2.st/course/lux-2025?token=94819';
    const encrypted = encryptContent(rawSecret);

    expect(encrypted).toBeDefined();
    expect(encrypted).toContain('.');
    expect(encrypted.split('.')).toHaveLength(3);

    const decrypted = decryptContent(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('باید فرمت‌های مختلف محتوا مانند آبجکت JSON حاوی کلید لایسنس را پردازش کند', () => {
    const payload = JSON.stringify({
      licenseKey: 'B2-PAYPASS-8841-X992',
      maxDownloads: 5,
      expiresAt: '2026-01-01T00:00:00Z',
    });

    const encrypted = encryptContent(payload);
    const decrypted = decryptContent(encrypted);

    expect(JSON.parse(decrypted)).toEqual(JSON.parse(payload));
  });

  it('باید در صورت دستکاری متن رمزشده (Tampering Attack) خطا پرتاب کند', () => {
    const raw = 'اطلاعات محرمانه فایل';
    const encrypted = encryptContent(raw);

    const parts = encrypted.split('.');
    // دستکاری کاراکتر آخر سایفرتکست
    const tamperedCipher = parts[2].slice(0, -2) + (parts[2].endsWith('A') ? 'B' : 'A');
    const tamperedPayload = `${parts[0]}.${parts[1]}.${tamperedCipher}`;

    expect(() => decryptContent(tamperedPayload)).toThrowError(CryptoError);
    expect(() => decryptContent(tamperedPayload)).toThrowError(/تایید اصالت محتوا شکست خورد/);
  });

  it('باید در صورت کلید نامعتبر یا تغییر یافته خطا بدهد', () => {
    const raw = 'محتوای قفل شده پی‌پاس';
    const encrypted = encryptContent(raw);

    // تغییر کلید اصلی به یک کلید دیگر
    process.env.PAYPASS_MASTER_KEY = generateRandomMasterKeyHex();

    expect(() => decryptContent(encrypted)).toThrowError(/تایید اصالت محتوا شکست خورد/);
  });

  it('باید در صورت ورودی خالی خطا ایجاد کند', () => {
    expect(() => encryptContent('')).toThrowError(CryptoError);
  });
});

describe('PayPass Financial Platform Fee (5%)', () => {
  it('باید کارمزد ۵٪ را برای مبالغ صحیح به درستی محاسبه نماید', () => {
    const fee100k = calculatePlatformFee(100_000);
    expect(fee100k.platformFee).toBe(5_000);
    expect(fee100k.sellerPayout).toBe(95_000);
    expect(fee100k.totalAmount).toBe(100_000);

    const fee1M = calculatePlatformFee(1_000_000);
    expect(fee1M.platformFee).toBe(50_000);
    expect(fee1M.sellerPayout).toBe(950_000);
  });

  it('باید ورودی‌های منفی یا نامعتبر را ریجکت کند', () => {
    expect(() => calculatePlatformFee(-500)).toThrow();
    expect(() => calculatePlatformFee(0)).toThrow();
  });
});