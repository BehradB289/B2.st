/**
 * پی‌پاس (PayPass) - استودیو B2.st
 * تعاریف داده و تایپ‌های سیستم پرداخت و تک‌محتوایی
 */

export type OrderStatus = 'pending' | 'completed' | 'failed';

export interface PayPassItem {
  id: string;
  title: string;
  description: string | null;
  price: number; // به تومان
  encrypted_content: string; // فرمت رمزنگاری شده iv:authTag:ciphertext
  seller_wallet: string;
  created_at: string;
  updated_at?: string;
}

export interface PayPassOrder {
  id: string;
  item_id: string;
  buyer_email: string;
  total_amount: number;
  platform_fee: number; // کسر ۵٪
  seller_amount: number; // سهم ۹۵٪ فروشنده
  status: OrderStatus;
  gateway_track_id: string | null;
  gateway_authority?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SplitResult {
  totalAmount: number;
  platformFee: number;
  sellerAmount: number;
}

export interface InitiatePaymentResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  orderId?: string;
  status: OrderStatus;
  trackId?: string;
  unlockedContent?: string;
  error?: string;
}