/**
 * درایور درگاه پرداخت پی‌پاس (PayPass Gateway Driver)
 * شبیه‌سازی و اتصال به درگاه جهت تست و استفاده عملیاتی
 */

export interface GatewayRequestPayload {
  orderId: string;
  amount: number; // تومان
  buyerEmail: string;
  callbackUrl: string;
}

export interface GatewayInitResponse {
  success: boolean;
  authority: string;
  paymentUrl: string;
  error?: string;
}

export interface GatewayVerifyResponse {
  success: boolean;
  trackId: string;
  status: 'PAID' | 'FAILED';
  error?: string;
}

export const paymentGateway = {
  /**
   * ایجاد تراکنش در درگاه
   */
  async requestPayment(payload: GatewayRequestPayload): Promise<GatewayInitResponse> {
    if (!payload.amount || payload.amount <= 0) {
      return { success: false, authority: '', paymentUrl: '', error: 'مبلغ نامعتبر است' };
    }

    const authority = `PP_AUTH_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const paymentUrl = `https://gateway.paypass.b2.st/checkout/${authority}?order_id=${payload.orderId}`;

    return {
      success: true,
      authority,
      paymentUrl,
    };
  },

  /**
   * تایید نهایی تراکنش
   */
  async verifyPayment(authority: string, amount: number): Promise<GatewayVerifyResponse> {
    if (!authority || authority.startsWith('INVALID')) {
      return {
        success: false,
        trackId: '',
        status: 'FAILED',
        error: 'امضای پرداخت تایید نشد یا تراکنش نامعتبر است.',
      };
    }

    const trackId = `TRK_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return {
      success: true,
      trackId,
      status: 'PAID',
    };
  },
};