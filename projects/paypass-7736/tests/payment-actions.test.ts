/**
 * تست‌های واحد Server Actionهای پرداخت و اعتبارسنجی کارمزد ۵٪ پی‌پاس
 * tests/payment-actions.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPaymentOrder, verifyPaymentWebhook } from '../src/app/actions/payment';
import { calculatePlatformSplit, PLATFORM_FEE_PERCENT } from '../src/lib/fee';
import { encryptSecret } from '../src/lib/crypto';
import { dbInstance } from '../src/lib/supabase';
import { paymentGateway } from '../src/lib/gateway';
import { PayPassItem } from '../src/types/paypass';

describe('PayPass Payment Actions & Financial Split (5% Fee)', () => {
  const MOCK_ITEM_ID = 'item_pack_premium_001';
  const RAW_SECRET_CONTENT = 'https://b2.st/vault/premium-asset-unlocked-token-x99';
  const ITEM_PRICE = 200_000; // دویست هزار تومان

  beforeEach(() => {
    dbInstance.reset();

    // ایجاد یک آیتم با محتوای رمز شده در دیتابیس
    const encryptedSecret = encryptSecret(RAW_SECRET_CONTENT);
    const mockItem: PayPassItem = {
      id: MOCK_ITEM_ID,
      title: 'بسته طراحی شیشه‌ای دیزاین سیستم لوکس B2.st',
      description: 'فایل کامل فیگما به همراه توکن‌های رنگی و استایل‌های سه‌بعدی',
      price: ITEM_PRICE,
      encrypted_content: encryptedSecret,
      seller_wallet: '0x1234567890123456789012345678901234567890',
      created_at: new Date().toISOString(),
    };

    dbInstance.insertItem(mockItem);
  });

  describe('محاسبات مالی و کسر ۵٪ کارمزد پلتفرم', () => {
    it('باید دقیقاً ۵٪ کارمزد پلتفرم و ۹۵٪ سهم فروشنده را برای مبالغ رند محاسبه کند', () => {
      const split = calculatePlatformSplit(100_000);
      expect(split.totalAmount).toBe(100_000);
      expect(split.platformFee).toBe(5_000); // 5%
      expect(split.sellerAmount).toBe(95_000); // 95%
      expect(split.platformFee + split.sellerAmount).toBe(split.totalAmount);
    });

    it('باید برای مبالغ دارای اعشار، کارمزد را بدون شکست محاسباتی گرد کند', () => {
      const split = calculatePlatformSplit(33_333);
      // 33333 * 0.05 = 1666.65 -> Math.round -> 1667
      expect(split.platformFee).toBe(1667);
      expect(split.sellerAmount).toBe(31666);
      expect(split.platformFee + split.sellerAmount).toBe(33_333);
    });

    it('باید در صورت دریافت مقادیر منفی، صفر یا نامعتبر استثنا صادر کند', () => {
      expect(() => calculatePlatformSplit(0)).toThrow('مبلغ تراکنش باید بزرگتر از صفر باشد.');
      expect(() => calculatePlatformSplit(-5000)).toThrow('مبلغ تراکنش باید بزرگتر از صفر باشد.');
      expect(() => calculatePlatformSplit(NaN)).toThrow('مبلغ تراکنش نامعتبر است.');
    });
  });

  describe('اکشن ۱: createPaymentOrder (ثبت سفارش و دریافت توکن)', () => {
    it('باید ایمیل نامعتبر را ریجکت کرده و خطای متناسب بازگرداند', async () => {
      const res = await createPaymentOrder(MOCK_ITEM_ID, 'invalid-email-address');
      expect(res.success).toBe(false);
      expect(res.error).toContain('آدرس ایمیل وارد شده نامعتبر است');
      expect(res.paymentUrl).toBeUndefined();
    });

    it('باید سفارش را در وضعیت pending ذخیره کرده و سهم ۵٪ را در دیتابیس بنشاند', async () => {
      const buyerEmail = 'buyer@b2.st';
      const result = await createPaymentOrder(MOCK_ITEM_ID, buyerEmail);

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(result.paymentUrl).toContain('https://gateway.paypass.b2.st/checkout/');

      const orderInDb = dbInstance.getOrder(result.orderId!);
      expect(orderInDb).toBeDefined();
      expect(orderInDb?.status).toBe('pending');
      expect(orderInDb?.buyer_email).toBe(buyerEmail);
      expect(orderInDb?.total_amount).toBe(200_000);
      expect(orderInDb?.platform_fee).toBe(10_000); // 5% of 200,000
      expect(orderInDb?.seller_amount).toBe(190_000); // 95% of 200,000
    });

    it('امنیت: پاسخ ایجاد سفارش نباید هرگز محتوای باز شده را فاش کند', async () => {
      const result = await createPaymentOrder(MOCK_ITEM_ID, 'client@luxury.io');
      expect((result as any).unlockedContent).toBeUndefined();
      expect((result as any).secret_content).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain(RAW_SECRET_CONTENT);
    });
  });

  describe('اکشن ۲: verifyPaymentWebhook (اعتبارسنجی پرداخت و بازگشایی محتوا)', () => {
    it('باید پس از تایید تراکنش درگاه، وضعیت را به completed تغییر داده و محتوا را رمزگشایی کند', async () => {
      // مرحله ۱: ایجاد سفارش اولیه
      const initRes = await createPaymentOrder(MOCK_ITEM_ID, 'user@domain.com');
      const orderId = initRes.orderId!;
      const order = dbInstance.getOrder(orderId)!;

      // مرحله ۲: وریفای موفقیت‌آمیز
      const verifyRes = await verifyPaymentWebhook(orderId, order.gateway_authority!);

      expect(verifyRes.success).toBe(true);
      expect(verifyRes.status).toBe('completed');
      expect(verifyRes.trackId).toMatch(/^TRK_/);
      expect(verifyRes.unlockedContent).toBe(RAW_SECRET_CONTENT);

      // بررسی وضعیت جدید در دیتابیس
      const updatedOrder = dbInstance.getOrder(orderId);
      expect(updatedOrder?.status).toBe('completed');
      expect(updatedOrder?.gateway_track_id).toBe(verifyRes.trackId);
    });

    it('باید در صورت تراکنش ناموفق درگاه، وضعیت سفارش را failed کرده و محتوا را لو ندهد', async () => {
      const initRes = await createPaymentOrder(MOCK_ITEM_ID, 'user@domain.com');
      const orderId = initRes.orderId!;

      // ارسال توکن نامعتبر شبیه‌سازی خطا
      const verifyRes = await verifyPaymentWebhook(orderId, 'INVALID_AUTHORITY_TOKEN');

      expect(verifyRes.success).toBe(false);
      expect(verifyRes.status).toBe('failed');
      expect(verifyRes.unlockedContent).toBeUndefined();

      const failedOrder = dbInstance.getOrder(orderId);
      expect(failedOrder?.status).toBe('failed');
    });

    it('Idempotency: فراخوانی مکرر وریفای برای سفارش completed نباید خطا دهد و محتوا را بازگرداند', async () => {
      const initRes = await createPaymentOrder(MOCK_ITEM_ID, 'user@domain.com');
      const orderId = initRes.orderId!;
      const order = dbInstance.getOrder(orderId)!;

      // بار اول
      const firstRes = await verifyPaymentWebhook(orderId, order.gateway_authority!);
      expect(firstRes.success).toBe(true);
      expect(firstRes.status).toBe('completed');

      // بار دوم (مثلاً کاربر صفحه را رفرش کرده است)
      const secondRes = await verifyPaymentWebhook(orderId, order.gateway_authority!);
      expect(secondRes.success).toBe(true);
      expect(secondRes.status).toBe('completed');
      expect(secondRes.unlockedContent).toBe(RAW_SECRET_CONTENT);
    });

    it('باید در صورت ارسال شناسه سفارش ناموجود خطای متناسب برگرداند', async () => {
      const verifyRes = await verifyPaymentWebhook('non-existent-order', 'auth_123');
      expect(verifyRes.success).toBe(false);
      expect(verifyRes.status).toBe('failed');
      expect(verifyRes.error).toContain('سفارش یافت نشد');
    });
  });
});