export type ItemContentType = 'link' | 'text' | 'file' | 'license_key';
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface ItemRecord {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  encrypted_content: string;
  content_type: ItemContentType;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderRecord {
  id: string;
  item_id: string;
  amount: number;
  platform_fee: number;
  creator_amount: number;
  currency: string;
  authority: string | null;
  ref_id: string | null;
  card_pan: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
}