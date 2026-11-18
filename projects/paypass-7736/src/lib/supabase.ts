import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-paypass.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-key";

/**
 * Supabase Admin client with service_role permissions for secure backend operations
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface ItemRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  encrypted_content: string;
  iv: string;
  auth_tag: string;
  creator_payout_target: string;
  view_count: number;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  item_id: string;
  amount: number;
  platform_fee: number;
  creator_share: number;
  customer_identifier: string;
  status: "pending" | "completed" | "failed";
  payment_token: string | null;
  payment_ref_id: string | null;
  created_at: string;
  updated_at: string;
}