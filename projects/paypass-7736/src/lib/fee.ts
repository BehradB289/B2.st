/**
 * منطق مالی پی‌پاس (PayPass) - B2.st
 * محاسبه کارمزد ۵ درصدی پلتفرم با دقت کامل محاسباتی
 */

import { SplitResult } from '../types/paypass';

export const PLATFORM_FEE_PERCENT = 5;

/**
 * محاسبه تقسیم سهم تراکنش: ۵٪ سهم پلتفرم و ۹۵٪ سهم فروشنده
 * تمامی مبالغ با استفاده از Math.round گرد می‌شوند تا از خطاهای ممیز شناور IEEE 754 جلوگیری شود.
 */
export function calculatePlatformSplit(totalAmount: number): SplitResult {
  if (typeof totalAmount !== 'number' || isNaN(totalAmount) || !Number.isFinite(totalAmount)) {
    throw new Error('مبلغ تراکنش نامعتبر است.');
  }

  if (totalAmount <= 0) {
    throw new Error('مبلغ تراکنش باید بزرگتر از صفر باشد.');
  }

  // محاسبه ۵٪ کارمزد با گرد کردن مطمئن
  const platformFee = Math.round((totalAmount * PLATFORM_FEE_PERCENT) / 100);
  const sellerAmount = totalAmount - platformFee;

  return {
    totalAmount,
    platformFee,
    sellerAmount,
  };
}