import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { Database, ProposalStatus } from "@/types/database";
import { Proposal } from "./schemas/proposal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("⚠️ متغیرهای محیطی Supabase (NEXT_PUBLIC_SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY) تنظیم نشده‌اند.");
}

/**
 * کلاینت مدیریت سرور Supabase با دسترسی کامل به جداول جهت ذخیره امن نتایج پردازش Serverless
 */
let cachedAdminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("تنظیمات اتصال به Supabase ناقص است. لطفاً متغیرهای محیطی را بررسی کنید.");
  }

  cachedAdminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
}

/**
 * محاسبه هش یکتا SHA-256 از فایل صوتی جهت پیاده‌سازی کشینگ و کنترل درخواست‌های تکراری (Deduplication)
 */
export function calculateAudioBufferHash(buffer: Buffer | ArrayBuffer): string {
  const hash = crypto.createHash("sha256");
  if (Buffer.isBuffer(buffer)) {
    hash.update(buffer);
  } else {
    hash.update(Buffer.from(buffer));
  }
  return hash.digest("hex");
}

export interface CachedProposalRecord {
  id: string;
  audioHash: string;
  rawTranscription: string;
  structuredData: Proposal;
  totalAmount: number;
  currency: string;
  status: ProposalStatus;
  createdAt: string;
}

/**
 * بررسی پایگاه داده جهت یافتن پیش‌فاکتور قبلاً پردازش شده با همین اثر انگشت صوتی
 */
export async function getCachedProposalByAudioHash(
  audioHash: string
): Promise<CachedProposalRecord | null> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("proposals")
      .select("id, audio_hash, raw_transcription, structured_data, total_amount, currency, status, created_at")
      .eq("audio_hash", audioHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[Supabase Cache Fetch Error]:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      audioHash: data.audio_hash,
      rawTranscription: data.raw_transcription,
      structuredData: data.structured_data as unknown as Proposal,
      totalAmount: Number(data.total_amount),
      currency: data.currency,
      status: data.status,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error("[Supabase Query Exception]:", err);
    return null;
  }
}

export interface SaveProposalParams {
  audioHash: string;
  rawTranscription: string;
  structuredData: Proposal;
  processingTimeMs?: number;
  audioDurationSeconds?: number;
  userId?: string | null;
  status?: ProposalStatus;
}

/**
 * ذخیره رکورد کامل پروپوزال، متادیتا و کش پردازش در Supabase
 */
export async function saveProposalRecord(
  params: SaveProposalParams
): Promise<{ id: string; createdAt: string }> {
  const supabase = getSupabaseAdminClient();

  const insertPayload = {
    audio_hash: params.audioHash,
    raw_transcription: params.rawTranscription,
    structured_data: params.structuredData as unknown as Database["public"]["Tables"]["proposals"]["Insert"]["structured_data"],
    client_name: params.structuredData.client.name || null,
    project_title: params.structuredData.title,
    total_amount: params.structuredData.financials.totalAmount,
    currency: params.structuredData.financials.currency,
    status: params.status || ("draft" as ProposalStatus),
    processing_time_ms: params.processingTimeMs || null,
    audio_duration_seconds: params.audioDurationSeconds || null,
    user_id: params.userId || null,
  };

  const { data, error } = await supabase
    .from("proposals")
    .insert(insertPayload)
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[Supabase Insert Error]:", error);
    throw new Error(`خطا در ذخیره‌سازی رکورد پروپوزال در دیتابیس: ${error.message}`);
  }

  return {
    id: data.id,
    createdAt: data.created_at,
  };
}

/**
 * به‌روزرسانی وضعیت یا اطلاعات پروپوزال بر اساس شناسه یکتا
 */
export async function updateProposalStatus(
  proposalId: string,
  newStatus: ProposalStatus
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("proposals")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", proposalId);

  if (error) {
    console.error("[Supabase Update Error]:", error);
    return false;
  }

  return true;
}