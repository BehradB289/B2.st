/**
 * پیکربندی و اعتبارسنجی متغیرهای محیطی استودیو B2.st برای پی‌پاس
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`[B2.st PayPass] خطای متغیر محیطی: متغیر ${key} در محیط اجرایی تنظیم نشده است.`);
  }
  return value;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://mock.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'mock-service-role-key-for-build'),
  // کلید ۳۲ بایتی به فرمت Hex جهت رمزنگاری AES-256-GCM
  ENCRYPTION_SECRET_KEY: getEnvVar(
    'PAYPASS_ENCRYPTION_SECRET_KEY',
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  ),
  // تنظیمات درگاه پرداخت (زرین‌پال)
  PAYMENT_MERCHANT_ID: getEnvVar('ZARINPAL_MERCHANT_ID', '00000000-0000-0000-0000-000000000000'),
  PAYMENT_SANDBOX: process.env.PAYMENT_SANDBOX === 'true' || process.env.NODE_ENV !== 'production',
  PLATFORM_FEE_PERCENT: 5, // کسر ۵٪ کارمزد پلتفرم پی‌پاس
} as const;