/**
 * سرور اکشن‌های اصلی تراکنش و آزادسازی محتوا در پی‌پاس (PayPass)
 * استودیو B2.st
 */

'use server';

import crypto from 'crypto';
import { calculatePlatformSplit } from '../../lib/fee';
import { decryptSecret } from '../../lib/crypto';
import { paymentGateway } from '../../lib/gateway';
import { dbInstance } from '../../lib/supabase';
import { InitiatePaymentResult, VerifyPaymentResult, PayPassOrder } from '../../types/paypass';

/**
 * سرور اکشن ۱: اعتبارسنجی ورودی، ثبت سفارش اولیه در وضعیت pending و کسر ۵٪ کارمزد پلتفرم
 */
export async function createPaymentOrder(
  itemId: string,
  buyerEmail: string
): Promise<InitiatePaymentResult> {
  try {
    // اعتبارسنجی ایمیل خریدار
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerEmail || !emailRegex.test(buyerEmail.trim())) {
      return { success: false, error: 'آدرس ایمیل وارد شده نامعتبر است.' };
    }

    // واکشی آیتم از دیتابیس
    const item = dbInstance.getItem(itemId);
    if (!item) {
      return { success: false, error: 'محتوای مورد نظر یافت نشد.' };
    }

    // محاسبه سهم ۵٪ پلتفرم و ۹۵٪ فروشنده
    const split = calculatePlatformSplit(item.price);

    const orderId = `ord_${crypto.randomUUID()}`;

    // درخواست توکن از درگاه پرداخت
    const gatewayRes = await paymentGateway.requestPayment({
      orderId,
      amount: item.price,
      buyerEmail: buyerEmail.trim(),
      callbackUrl: `https://paypass.b2.st/checkout/verify?order_id=${orderId}`,
    });

    if (!gatewayRes.success) {
      return { success: false, error: gatewayRes.error || 'خطا در ارتباط با درگاه بانکی.' };
    }

    // ثبت سفارش در وضعیت اولیه pending
    const newOrder: PayPassOrder = {
      id: orderId,
      item_id: item.id,
      buyer_email: buyerEmail.trim().toLowerCase(),
      total_amount: split.totalAmount,
      platform_fee: split.platformFee,
      seller_amount: split.sellerAmount,
      status: 'pending',
      gateway_track_id: null,
      gateway_authority: gatewayRes.authority,
      created_at: new Date().toISOString(),
    };

    dbInstance.insertOrder(newOrder);

    // توجه امنیتی: محتوای رمزنگاری شده هرگز به کلاینت پس داده نمی‌شود
    return {
      success: true,
      orderId,
      paymentUrl: gatewayRes.paymentUrl,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای غیرمنتظره در ثبت سفارش' };
  }
}

/**
 * سرور اکشن ۲: اعتبارسنجی امضای درگاه، نهایی‌سازی سفارش به completed و آزادسازی محتوای حساس
 */
export async function verifyPaymentWebhook(
  orderId: string,
  authority: string
): Promise<VerifyPaymentResult> {
  try {
    if (!orderId || !authority) {
      return { success: false, status: 'failed', error: 'پارامترهای اعتبارسنجی پرداخت ناقص است.' };
    }

    const order = dbInstance.getOrder(orderId);
    if (!order) {
      return { success: false, status: 'failed', error: 'سفارش یافت نشد.' };
    }

    // جلوگیری از پرداخت مجدد / Idempotency check
    if (order.status === 'completed') {
      const item = dbInstance.getItem(order.item_id);
      const unlockedContent = item ? decryptSecret(item.encrypted_content) : '';
      return {
        success: true,
        orderId: order.id,
        status: 'completed',
        trackId: order.gateway_track_id || 'ALREADY_COMPLETED',
        unlockedContent,
      };
    }

    // استعلام و وریفای از درگاه
    const verifyRes = await paymentGateway.verifyPayment(authority, order.total_amount);

    if (!verifyRes.success || verifyRes.status !== 'PAID') {
      dbInstance.updateOrder(orderId, { status: 'failed' });
      return {
        success: false,
        status: 'failed',
        orderId,
        error: verifyRes.error || 'تراکنش ناموفق بود یا توسط کاربر لغو شد.',
      };
    }

    // پرداخت موفقیت‌آمیز: به‌روزرسانی سفارش به completed
    dbInstance.updateOrder(orderId, {
      status: 'completed',
      gateway_track_id: verifyRes.trackId,
    });

    // بازیابی آیتم و رمزگشایی متقارن سمت سرور
    const item = dbInstance.getItem(order.item_id);
    if (!item) {
      return {
        success: false,
        status: 'completed',
        error: 'خطای سیستمی: آیتم متصل به سفارش پیدا نشد.',
      };
    }

    const unlockedContent = decryptSecret(item.encrypted_content);

    return {
      success: true,
      orderId: order.id,
      status: 'completed',
      trackId: verifyRes.trackId,
      unlockedContent,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'failed',
      orderId,
      error: err.message || 'خطای رمزگشایی یا تایید درگاه',
    };
  }
}