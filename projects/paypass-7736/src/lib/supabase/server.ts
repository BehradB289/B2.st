import { createClient } from '@supabase/supabase-js';
import { ENV } from '../../../config/env';

/**
 * کلاینت ایزوله و پرسرعت Supabase با دسترسی ادمین (Service Role)
 * کلیه تراکنش‌های حساس مالی و رمزگشایی انحصاراً در لایه سرور پردازش می‌شوند.
 */
export function getSupabaseAdmin() {
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
}