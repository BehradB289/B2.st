import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Business,
  BusinessPublicProfile,
  Feedback,
  FeedbackInsertPayload,
  IncrementRatingResponse,
} from '@/types/database.types';

/**
 * Validate presence of required environment variables for Edge and Server environments.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[ReviewShield:Supabase] Missing critical environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.'
  );
}

/**
 * Client-side / Edge Public Client.
 * Uses anon key with strict Row-Level Security & restricted column grants.
 */
export const supabasePublic: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Server-only Privileged Client.
 * Bypasses RLS to read Telegram credentials and perform secured mutations.
 * Throws runtime error if invoked on the browser side.
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  if (typeof window !== 'undefined') {
    throw new Error('[ReviewShield:Security] Supabase Admin client cannot be instantiated in browser runtime.');
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('[ReviewShield:Supabase] Missing SUPABASE_SERVICE_ROLE_KEY for admin operations.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * ReviewShield Data Access Layer (Edge-Compatible)
 */
export const reviewShieldService = {
  /**
   * Fetches public business record by slug.
   * Validates if active and not exceeding free tier.
   */
  async getPublicBusinessBySlug(slug: string): Promise<{
    data: BusinessPublicProfile | null;
    error: string | null;
  }> {
    try {
      const sanitizedSlug = slug.toLowerCase().trim();

      const { data, error } = await supabasePublic
        .from('businesses')
        .select('id, slug, business_name, google_maps_review_url, account_status, rating_count, rating_limit')
        .eq('slug', sanitizedSlug)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        return { data: null, error: 'Business not found' };
      }

      return { data: data as BusinessPublicProfile, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error during slug lookup';
      return { data: null, error: message };
    }
  },

  /**
   * Atomic check and rating counter increment.
   * Executes Postgres RPC function `increment_business_rating` with Row-Level Lock.
   * Automatically enforces 30 ratings limit.
   */
  async checkEligibilityAndIncrement(slug: string): Promise<IncrementRatingResponse> {
    try {
      const sanitizedSlug = slug.toLowerCase().trim();

      // RPC can be safely called with public client because it is SECURITY DEFINER with strict logic
      const { data, error } = await supabasePublic.rpc('increment_business_rating', {
        p_slug: sanitizedSlug,
      });

      if (error) {
        return {
          success: false,
          code: 'BUSINESS_NOT_FOUND',
          message: error.message,
        };
      }

      return data as IncrementRatingResponse;
    } catch (err: unknown) {
      return {
        success: false,
        code: 'BUSINESS_NOT_FOUND',
        message: err instanceof Error ? err.message : 'Unexpected RPC failure',
      };
    }
  },

  /**
   * Submits a 1-3 star critical feedback to the defense mechanism.
   * Client-side or Edge Route compatible.
   */
  async submitFeedback(payload: FeedbackInsertPayload): Promise<{
    success: boolean;
    data: Feedback | null;
    error: string | null;
  }> {
    try {
      if (payload.rating < 1 || payload.rating > 3) {
        return { success: false, data: null, error: 'Feedback rating must be strictly between 1 and 3.' };
      }

      if (!payload.feedback_text || payload.feedback_text.trim().length < 2) {
        return { success: false, data: null, error: 'Feedback text must be at least 2 characters.' };
      }

      const { data, error } = await supabasePublic
        .from('feedbacks')
        .insert({
          business_id: payload.business_id,
          rating: payload.rating,
          feedback_text: payload.feedback_text.trim(),
          customer_name: payload.customer_name?.trim() || null,
          customer_contact: payload.customer_contact?.trim() || null,
          metadata: payload.metadata || {},
        })
        .select()
        .single();

      if (error) {
        return { success: false, data: null, error: error.message };
      }

      return { success: true, data: data as Feedback, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback';
      return { success: false, data: null, error: message };
    }
  },

  /**
   * Fetches Telegram Dispatch Credentials securely (Server/Route Handler only).
   */
  async getBusinessTelegramCredentials(businessId: string): Promise<{
    botToken: string;
    chatId: string;
    businessName: string;
  } | null> {
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from('businesses')
      .select('telegram_bot_token, telegram_chat_id, business_name')
      .eq('id', businessId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      botToken: data.telegram_bot_token,
      chatId: data.telegram_chat_id,
      businessName: data.business_name,
    };
  },

  /**
   * Updates feedback record dispatch status after Telegram bot pushes message.
   */
  async markFeedbackDispatched(feedbackId: string): Promise<boolean> {
    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from('feedbacks')
      .update({ telegram_dispatched: true })
      .eq('id', feedbackId);

    return !error;
  },
};