import { ENV } from '../../../config/env';
import { GatewayRequestResponse, GatewayVerifyResponse } from '../../types/payment';

const BASE_URL = ENV.PAYMENT_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/v4/payment'
  : 'https://api.zarinpal.com/pg/v4/payment';

const GATEWAY_PAY_URL = ENV.PAYMENT_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/StartPay/'
  : 'https://www.zarinpal.com/pg/StartPay/';

interface RequestPaymentParams {
  amount: number; // به تومان
  description: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
}

interface VerifyPaymentParams {
  authority: string;
  amount: number; // به تومان
}

/**
 * درایور پرداخت فوق سریع پی‌پاس سازگار با پروتکل استاندارد زرین‌پال v4
 */
export class ZarinPalGateway {
  /**
   * درخواست اولیه پرداخت و دریافت شناسه Authority
   */
  static async requestPayment(params: RequestPaymentParams): Promise<GatewayRequestResponse> {
    // در صورت حضور در محیط تست یا متغیرهای ماک، ساخت توکن مجازی برای توسعه بی‌وقفه
    if (ENV.PAYMENT_MERCHANT_ID === '00000000-0000-0000-0000-000000000000' && ENV.PAYMENT_SANDBOX) {
      const mockAuthority = `A00000000000000000000000000${Date.now()}`.slice(0, 36);
      return {
        authority: mockAuthority,
        paymentUrl: `${ENV.APP_URL}/checkout/verify?Authority=${mockAuthority}&Status=OK`,
        fee: Math.round(params.amount * (ENV.PLATFORM_FEE_PERCENT / 100)),
      };
    }

    const payload = {
      merchant_id: ENV.PAYMENT_MERCHANT_ID,
      amount: params.amount * 10, // تبدیل تومان به ریال برای API شاپرک
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: {
        mobile: params.mobile || undefined,
        email: params.email || undefined,
      },
    };

    const response = await fetch(`${BASE_URL}/request.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`[ZarinPal] خطا در برقراری ارتباط با درگاه شاپرک: کد ${response.status}`);
    }

    const data = await response.json();

    if (data.data?.code === 100 && data.data?.authority) {
      const authority = data.data.authority;
      return {
        authority,
        paymentUrl: `${GATEWAY_PAY_URL}${authority}`,
        fee: Math.round(params.amount * (ENV.PLATFORM_FEE_PERCENT / 100)),
      };
    }

    throw new Error(
      `[ZarinPal] صدور توکن پرداخت ناموفق بود: ${data.errors?.message || 'کد خطا ' + data.errors?.code}`
    );
  }

  /**
   * استعلام و راستی‌آزمایی تراکنش انجام شده در شاپرک
   */
  static async verifyPayment(params: VerifyPaymentParams): Promise<GatewayVerifyResponse> {
    // سناریوی توسعه سریع (Sandbox Mock)
    if (ENV.PAYMENT_MERCHANT_ID === '00000000-0000-0000-0000-000000000000' && ENV.PAYMENT_SANDBOX) {
      const isOk = params.authority.startsWith('A');
      return {
        isSuccess: isOk,
        refId: isOk ? `B2ST-${Date.now().toString().slice(-8)}` : undefined,
        cardPan: isOk ? '502229******1234' : undefined,
        code: isOk ? 100 : -101,
        message: isOk ? 'تراکنش با موفقیت در حالت سندباکس تایید شد.' : 'تراکنش رد شد.',
      };
    }

    const payload = {
      merchant_id: ENV.PAYMENT_MERCHANT_ID,
      amount: params.amount * 10, // ریال
      authority: params.authority,
    };

    const response = await fetch(`${BASE_URL}/verify.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        isSuccess: false,
        code: response.status,
        message: 'پاسخ نامعتبر از سرور پرداخت شاپرک',
      };
    }

    const data = await response.json();
    const code = data.data?.code;

    // ۱۰۰: تراکنش موفق، ۱۰۱: تراکنش قبلاً وریفای شده
    if (code === 100 || code === 101) {
      return {
        isSuccess: true,
        refId: String(data.data.ref_id),
        cardPan: data.data.card_pan || undefined,
        code,
        message: code === 100 ? 'تراکنش با موفقیت تایید شد.' : 'تراکنش قبلا تایید شده است.',
      };
    }

    return {
      isSuccess: false,
      code: data.errors?.code || -1,
      message: data.errors?.message || 'تراکنش توسط کاربر لغو شده یا ناموفق است.',
    };
  }
}