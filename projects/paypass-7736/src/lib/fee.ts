/**
 * B2.st Studio | PayPass Financial & Fee Logic
 * محاسبه کارمزد ۵ درصدی پلتفرم و سهم تسویه فروشنده
 */

export const PLATFORM_FEE_PERCENT = 0.05; // ۵٪ کارمزد پلتفرم پی‌پاس

export interface FeeBreakdown {
  totalAmount: number;
  platformFee: number;
  sellerPayout: number;
}

/**
 * محاسبه دقیق کارمزد و مبلغ خالص واریزی به فروشنده با روند کردن استاندارد
 * @param amount کل مبلغ پرداختی به ریال یا تومان
 */
export function calculatePlatformFee(amount: number): FeeBreakdown {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('مبلغ تراکنش باید یک عدد مثبت باشد.');
  }

  // محاسبه ۵٪ کارمزد با گرد کردن روبه‌پایین جهت شفافیت مالی
  const platformFee = Math.floor(amount * PLATFORM_FEE_PERCENT);
  const sellerPayout = amount - platformFee;

  return {
    totalAmount: amount,
    platformFee,
    sellerPayout,
  };
}