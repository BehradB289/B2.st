import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * B2.st Studio | PayPass Supabase Client Manager
 * مدیریت اتصال به سوپابیس برای دو محیط کاربری (Client / Anon) و پردازش‌های معتمد سروری (Service Role)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('[PayPass Supabase] متغیر محیطی NEXT_PUBLIC_SUPABASE_URL الزامی است.');
}

if (!supabaseAnonKey) {
  throw new Error('[PayPass Supabase] متغیر محیطی NEXT_PUBLIC_SUPABASE_ANON_KEY الزامی است.');
}

/**
 * کلاینت عمومی سوپابیس (Anon Client)
 * مورد استفاده در صفحات کلاینتی و رید کردن اطلاعات غیرحساس (متادیتا)
 */
export const supabasePublic: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * کلاینت سروری با اختیارات ادمین (Service Role Client)
 * اختصاصی برای اجرا در Server Actions و Webhook Verification.
 * این کلاینت RLS را دور می‌زند تا داده‌های رمزنگاری شده را واکشی و در حافظه سرور آنلاک کند.
 */
let serviceRoleInstance: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  // حفاظت از عدم اجرای سهوی در مرورگر
  if (typeof window !== 'undefined') {
    throw new Error(
      '[PayPass Security Alert] کلاینت ادمین (Service Role) هرگز نباید در سمت مرورگر صدا زده شود!'
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      '[PayPass Supabase] متغیر SUPABASE_SERVICE_ROLE_KEY جهت اجرای عملیات سروری تعریف نشده است.'
    );
  }

  if (!serviceRoleInstance) {
    serviceRoleInstance = createClient<Database>(supabaseUrl as string, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceRoleInstance;
}

// اکسپورت پیش‌فرض برای دسترسی سروری پایدار
export const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdmin : ({} as SupabaseClient<Database>);