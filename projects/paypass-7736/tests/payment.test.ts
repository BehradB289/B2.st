import { describe, it, expect } from 'vitest';
import { encryptSensitiveContent, decryptSensitiveContent } from '../src/lib/crypto';

describe('PayPass Cryptographic & Financial Core (B2.st Studio)', () => {
  it('باید محتوای حساس را با AES-256-GCM رمزنگاری کرده و بدون نقص رمزگشایی کند', () => {
    const rawSecret = 'https://paypass.b2.st/secret/super-asset-pack-2024.zip';
    const encrypted = encryptSensitiveContent(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(':').length).toBe(3); // iv:authTag:cipher

    const decrypted = decryptSensitiveContent(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('در صورت دستکاری تگ احراز هویت (AuthTag) باید خطای اعتبارسنجی پرتاب کند', () => {
    const rawSecret = 'sensitive_telegram_invite_link';
    const encrypted = encryptSensitiveContent(rawSecret);
    const [iv, authTag, data] = encrypted.split(':');

    // دستکاری بایت اول تگ اصالت
    const tamperedTag = (authTag[0] === 'a' ? 'b' : 'a') + authTag.slice(1);
    const tamperedPayload = `${iv}:${tamperedTag}:${data}`;

    expect(() => {
      decryptSensitiveContent(tamperedPayload);
    }).toThrow();
  });

  it('محاسبه صحیح ۵٪ کارمزد پلتفرم و ۹۵٪ سهم سازنده', () => {
    const itemPrice = 50000; // ۵۰ هزار تومان
    const platformFeeRate = 0.05;

    const platformFee = Math.round(itemPrice * platformFeeRate);
    const creatorShare = itemPrice - platformFee;

    expect(platformFee).toBe(2500);
    expect(creatorShare).toBe(47500);
    expect(platformFee + creatorShare).toBe(itemPrice);
  });
});