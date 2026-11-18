/**
 * ReviewShield (B2.st Studio)
 * Database Types & Contract Definitions for PostgreSQL / Supabase
 */

export type BusinessAccountStatus = 'active' | 'limit_reached' | 'suspended' | 'pro';

export interface Business {
  id: string;
  slug: string;
  business_name: string;
  google_maps_review_url: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  account_status: BusinessAccountStatus;
  rating_count: number;
  rating_limit: number;
  created_at: string;
  updated_at: string;
}

/**
 * Public business profile exposed to client-side edge runners.
 * Omits sensitive Telegram credentials.
 */
export type BusinessPublicProfile = Pick<
  Business,
  | 'id'
  | 'slug'
  | 'business_name'
  | 'google_maps_review_url'
  | 'account_status'
  | 'rating_count'
  | 'rating_limit'
>;

export interface Feedback {
  id: string;
  business_id: string;
  rating: 1 | 2 | 3;
  feedback_text: string;
  customer_name?: string | null;
  customer_contact?: string | null;
  telegram_dispatched: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackInsertPayload {
  business_id: string;
  rating: 1 | 2 | 3;
  feedback_text: string;
  customer_name?: string | null;
  customer_contact?: string | null;
  metadata?: Record<string, unknown>;
}

export type IncrementRatingResponse =
  | {
      success: true;
      code: 'AUTHORIZED';
      business_id: string;
      business_name: string;
      google_maps_review_url: string;
      account_status: BusinessAccountStatus;
      rating_count: number;
      rating_limit: number;
    }
  | {
      success: false;
      code: 'BUSINESS_NOT_FOUND' | 'ACCOUNT_SUSPENDED' | 'LIMIT_EXCEEDED';
      message: string;
      rating_count?: number;
      rating_limit?: number;
    };