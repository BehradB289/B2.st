/**
 * B2.st Studio | PayPass TypeScript Database Schema Definitions
 * تعاریف نوع‌داده‌های پایگاه‌داده Supabase برای آیتم‌ها و سفارش‌ها
 */

export type OrderStatus = 'pending' | 'completed' | 'failed';

export interface Item {
  id: string;
  slug: string;
  title: string;
  encrypted_content: string;
  price: number;
  seller_iban: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemPublic {
  id: string;
  slug: string;
  title: string;
  price: number;
  created_at: string;
}

export interface Order {
  id: string;
  item_id: string;
  gateway_authority: string;
  amount: number;
  platform_fee: number;
  status: OrderStatus;
  customer_identifier: string | null;
  payment_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      items: {
        Row: Item;
        Insert: {
          id?: string;
          slug: string;
          title?: string;
          encrypted_content: string;
          price: number;
          seller_iban: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          encrypted_content?: string;
          price?: number;
          seller_iban?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      orders: {
        Row: Order;
        Insert: {
          id?: string;
          item_id: string;
          gateway_authority: string;
          amount: number;
          platform_fee: number;
          status?: OrderStatus;
          customer_identifier?: string | null;
          payment_metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          gateway_authority?: string;
          amount?: number;
          platform_fee?: number;
          status?: OrderStatus;
          customer_identifier?: string | null;
          payment_metadata?: Record<string, unknown> | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      items_public: {
        Row: ItemPublic;
      };
    };
    Functions: {
      calculate_platform_fee: {
        Args: { amount: number };
        Returns: number;
      };
    };
    Enums: {
      order_status: OrderStatus;
    };
  };
}