/**
 * آماده‌سازی محیط تست‌های سوئیت پی‌پاس
 */

import { beforeAll, beforeEach } from 'vitest';
import { dbInstance } from '../src/lib/supabase';

// تنظیم کلید آزمایشی ۲۵۶ بیتی تایید شده
process.env.PAYPASS_ENCRYPTION_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

beforeEach(() => {
  // پاکسازی دیتابیس شبیه‌سازی‌شده قبل از هر تست
  dbInstance.reset();
});