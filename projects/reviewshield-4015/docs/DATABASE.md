# ReviewShield (ریویو‌شیلد) - معماری دیتابیس و مدل داده Supabase

طراحی شده توسط استودیو فناوری **B2.st** برای محافظت و ارتقای اعتبار آنلاین کسب‌وکارها در گوگل مپس.

---

## ۱. نقشه کلی جداول دیتابیس

### جدول `businesses`
اطلاعات هویتی، آدرس مقصد، تنظیمات بات و وضعیت سهمیه رایگان:

| نام فیلد | نوع داده | توضیحات |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | شناسه منحصر‌به‌فرد سیستم |
| `slug` | `VARCHAR(64)` (UNIQUE) | مسیر URL داینامیک بیزینس (`/[slug]`) |
| `business_name` | `VARCHAR(150)` | نام تجاری نمایش داده شده به مشتری |
| `google_maps_review_url` | `TEXT` | لینک Intent مستقیم ثبت نظر گوگل مپس |
| `telegram_bot_token` | `TEXT` | توکن بات تلگرام اختصاصی بیزینس (محرمانه) |
| `telegram_chat_id` | `VARCHAR(64)` | چت‌آیدی مالک بیزینس برای دریافت هشدارهای آنی |
| `account_status` | `ENUM` | وضعیت اکانت (`active`, `limit_reached`, `suspended`, `pro`) |
| `rating_count` | `INTEGER` | تعداد کل تعاملات ریتینگ ثبت‌شده (پیش‌فرض ۰) |
| `rating_limit` | `INTEGER` | سقف ترافیک رایگان اولیه (پیش‌فرض ۳۰) |
| `created_at` | `TIMESTAMPTZ` | تاریخ ثبت بیزینس |
| `updated_at` | `TIMESTAMPTZ` | تاریخ آخرین به‌روزرسانی |

---

### جدول `feedbacks`
سپر دفاعی (Defense Shield) برای متوقف‌سازی و مدیریت نظرات ۱ تا ۳ ستاره:

| نام فیلد | نوع داده | توضیحات |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | شناسه فیدبک |
| `business_id` | `UUID` (FK) | ارجاع به جدول `businesses` (Cascade Delete) |
| `rating` | `SMALLINT` | نمره مشتری (فقط ۱، ۲ یا ۳ ستاره) |
| `feedback_text` | `TEXT` | متن انتقاد یا پیشنهاد مشتری |
| `customer_name` | `VARCHAR(100)` | نام مشتری (اختیاری) |
| `customer_contact` | `VARCHAR(100)` | شماره تماس یا ایمیل مشتری جهت دلجویی |
| `telegram_dispatched` | `BOOLEAN` | وضعیت ارسال هشدار به بات تلگرام |
| `metadata` | `JSONB` | اطلاعات فنی اضافه (User Agent, IP Hash, etc.) |
| `created_at` | `TIMESTAMPTZ` | زمان ثبت بازخورد |

---

## ۲. لایه امنیتی و امنیت سطح ردیف (Row Level Security - RLS)

برای جلوگیری از هرگونه نشت اطلاعات حساس مالکین بیزینس‌ها:
1. دسترسی کلید عمومی (`anon`) به ستون‌های محرمانه `telegram_bot_token` و `telegram_chat_id` به طور کامل در سطح PostgreSQL Revoke شده است.
2. خواندن اطلاعات جدول `feedbacks` برای کلاینت عمومی مسدود است و فقط از طریق کلید سرور (`SUPABASE_SERVICE_ROLE_KEY`) توسط Route Handler قابل فراخوانی است.
3. تابع اتمیک `increment_business_rating` با دسترسی `SECURITY DEFINER` و با استفاده از مکانیزم `FOR UPDATE` مانع از Race Condition در لبه (Edge) شده و سقف ۳۰ درخواست را با دقت ۱۰۰٪ اعمال می‌کند.

---

## ۳. متغیرهای محیطی مورد نیاز (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```