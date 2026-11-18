'use server';

import { redirect } from 'next/navigation';
import { ENV } from '../../../config/env';
import { decryptSensitiveContent } from '../../lib/crypto';
import { ZarinPalGateway } from '../../lib/payment/zarinpal';
import { getSupabaseAdmin } from '../../lib/supabase/server';
import {
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  VerifyPaymentResult,
} from '../../types/payment';
import { ItemRecord, OrderRecord } from '../../types/database';

/**
 * سرور اکشن ۱: ایجاد جلسه پرداخت، کسر کارمزد ۵٪ پلتفرم و دریافت آدرس درگاه
 */
export async function createPaymentSession(
  input: CreatePaymentSessionInput
): Promise<CreatePaymentSessionResult> {
  const { itemId, buyerEmail, buyerPhone } = input;

  if (!itemId) {
    return { success: false, error: '⚠️ شناسه آیتم برای ایجاد سفارش الزامی است.' };
  }

  const supabase = getSupabaseAdmin();

  // ۱. واکشی آیتم و اطمینان از فعال بودن آن
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, title, price, currency, is_active')
    .eq('id', itemId)
    .single<Pick<ItemRecord, 'id' | 'title' | 'price' | 'currency' | 'is_active'>>();

  if (itemError || !item) {
    return {
      success: false,
      error: '❌ آیتم مورد نظر یافت نشد یا غیرفعال شده است.',
    };
  }

  if (!item.is_active) {
    return {
      success: false,
      error: '⛔ این محتوا در حال حاضر برای فروش در دسترس نمی‌باشد.',
    };
  }

  const amount = Number(item.price);

  // ۲. محاسبه محاسبات مالی: ۵٪ کارمزد پلتفرم پی‌پاس و ۹۵٪ سهم خالق اثر
  const platformFee = Math.round(amount * (ENV.PLATFORM_FEE_PERCENT / 100));
  const creatorAmount = amount - platformFee;

  // ۳. ایجاد اولیه رکورد در جدول سفارشات (وضعیت: pending)
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      item_id: item.id,
      amount,
      platform_fee: platformFee,
      creator_amount: creatorAmount,
      currency: item.currency || 'IRT',
      buyer_email: buyerEmail || null,
      buyer_phone: buyerPhone || null,
      status: 'pending',
    })
    .select('id')
    .single<Pick<OrderRecord, 'id'>>();

  if (orderError || !newOrder) {
    console.error('[PayPass Error] ناتوانی در ثبت رکورد سفارش:', orderError);
    return {
      success: false,
      error: '💥 خطای سیستمی در ایجاد سفارش خرید. لطفاً دقایقی دیگر تلاش فرمایید.',
    };
  }

  // ۴. دریافت توکن پرداخت (Authority) از درگاه شاپرک
  const callbackUrl = `${ENV.APP_URL}/checkout/verify`;

  let gatewayResult;
  try {
    gatewayResult = await ZarinPalGateway.requestPayment({
      amount,
      description: `خرید محتوای پی‌پاس: ${item.title}`,
      callbackUrl,
      mobile: buyerPhone,
      email: buyerEmail,
    });
  } catch (err: any) {
    console.error('[PayPass Error] خطا در دریافت توکن درگاه:', err);

    // به‌روزرسانی سفارش به وضعیت رد شده به دلیل خطای شبکه
    await supabase.from('orders').update({ status: 'failed' }).eq('id', newOrder.id);

    return {
      success: false,
      error: err.message || 'خطا در ارتباط با درگاه شاپرک.',
    };
  }

  // ۵. پیوست دادن شناسه پرداخت Authority به سفارش مربوطه
  await supabase
    .from('orders')
    .update({ authority: gatewayResult.authority })
    .eq('id', newOrder.id);

  return {
    success: true,
    paymentUrl: gatewayResult.paymentUrl,
    authority: gatewayResult.authority,
    orderId: newOrder.id,
  };
}

/**
 * سرور اکشن ۲: وب‌هوک و کالبک تایید تراکنش، کسر کارمزد قطعی، رمزگشایی AES-256 و آنلاک محتوا
 */
export async function verifyPaymentWebhook(
  authority: string,
  status: string
): Promise<VerifyPaymentResult> {
  if (!authority) {
    return {
      success: false,
      message: '⚠️ پارامتر رهگیری درگاه (Authority) یافت نشد.',
      error: 'AUTHORITY_MISSING',
    };
  }

  const supabase = getSupabaseAdmin();

  // ۱. واکشی سفارش مرتبط با توکن پرداخت
  const { data: order, error: orderFetchErr } = await supabase
    .from('orders')
    .select('id, item_id, amount, status, authority')
    .eq('authority', authority)
    .single<Pick<OrderRecord, 'id' | 'item_id' | 'amount' | 'status' | 'authority'>>();

  if (orderFetchErr || !order) {
    return {
      success: false,
      message: '❌ سفارشی با مشخصات این توکن پرداخت یافت نشد.',
      error: 'ORDER_NOT_FOUND',
    };
  }

  // در صورتی که سفارش قبلاً با موفقیت تکمیل و آنلاک شده باشد (Idempotency)
  if (order.status === 'completed') {
    const { data: item } = await supabase
      .from('items')
      .select('id, title, content_type, encrypted_content')
      .eq('id', order.item_id)
      .single<Pick<ItemRecord, 'id' | 'title' | 'content_type' | 'encrypted_content'>>();

    if (item) {
      const unlockedContent = decryptSensitiveContent(item.encrypted_content);
      return {
        success: true,
        message: '⚡ محتوای این سفارش پیش‌تر با موفقیت فعال‌سازی شده است.',
        orderId: order.id,
        item: {
          id: item.id,
          title: item.title,
          contentType: item.content_type,
          unlockedContent,
        },
      };
    }
  }

  // ۲. بررسی انصراف یا لغو کاربر در صفحه درگاه
  if (status !== 'OK') {
    await supabase
      .from('orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return {
      success: false,
      message: '🛑 تراکنش بانکی توسط کاربر لغو شد یا ناموفق بود.',
      error: 'PAYMENT_CANCELLED_OR_FAILED',
    };
  }

  // ۳. استعلام و راستی‌آزمایی نهایی از درگاه شاپرک با مبلغ ثبت‌شده
  const verification = await ZarinPalGateway.verifyPayment({
    authority,
    amount: order.amount,
  });

  if (!verification.isSuccess) {
    await supabase
      .from('orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return {
      success: false,
      message: `⛔ تایید تراکنش در شاپرک رد شد: ${verification.message}`,
      error: 'VERIFICATION_FAILED',
      statusCode: verification.code,
    };
  }

  // ۴. به‌روزرسانی موفقیت‌آمیز وضعیت سفارش و درج اطلاعات وریفای
  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'completed',
      ref_id: verification.refId,
      card_pan: verification.cardPan || null,
      verified_at: now,
      updated_at: now,
    })
    .eq('id', order.id);

  if (updateErr) {
    console.error('[PayPass Error] خطا در نهایی‌سازی سفارش در دیتابیس:', updateErr);
  }

  // ۵. واکشی آیتم محرمانه، رمزگشایی سمت سرور با AES-256 و آزادسازی برای خریدار
  const { data: item, error: itemErr } = await supabase
    .from('items')
    .select('id, title, content_type, encrypted_content')
    .eq('id', order.item_id)
    .single<Pick<ItemRecord, 'id' | 'title' | 'content_type' | 'encrypted_content'>>();

  if (itemErr || !item) {
    return {
      success: true,
      message: '✨ پرداخت تایید شد اما در بارگذاری محتوا خطایی رخ داد. با پشتیبانی تماس بگیرید.',
      orderId: order.id,
      refId: verification.refId,
    };
  }

  let decryptedContent: string;
  try {
    decryptedContent = decryptSensitiveContent(item.encrypted_content);
  } catch (decryptionError) {
    console.error('[PayPass Security] خطای بحرانی در رمزگشایی دیتای آیتم:', decryptionError);
    return {
      success: true,
      message: '✨ پرداخت موفق بود اما رمزگشایی محتوا به مشکل امنیتی برخورد.',
      orderId: order.id,
      refId: verification.refId,
    };
  }

  return {
    success: true,
    message: '💎 پرداخت شما با موفقیت تایید و محتوای انحصاری آزاد شد 🚀',
    orderId: order.id,
    refId: verification.refId,
    item: {
      id: item.id,
      title: item.title,
      contentType: item.content_type,
      unlockedContent: decryptedContent,
    },
  };
}