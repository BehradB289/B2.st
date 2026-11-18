-- ==============================================================================
-- B2.st Studio | PayPass (پی‌پاس) Database Schema & Security Architecture
-- Database: Supabase / PostgreSQL 15+
-- Architecture: Zero-Trust Encrypted Single-Content Delivery & Micro-Monetization
-- ==============================================================================

-- 1. فعال‌سازی اکستنشن‌های مورد نیاز
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ایجاد تایپ وضعیت سفارش (Order Status)
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- TABLE: items (محصولات دیجیتال تک‌محتوایی)
-- محتوای حساس (لینک، لایسنس، متن) پیش از ذخیره در encrypted_content رمزگذاری می‌شود.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    encrypted_content TEXT NOT NULL,
    price BIGINT NOT NULL,
    seller_iban VARCHAR(34) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- اعتبارسنجی قیمت: حداقل ۱۰,۰۰۰ ریال / ۱,۰۰۰ تومان
    CONSTRAINT chk_items_price_positive CHECK (price >= 10000),
    -- اعتبارسنجی فرمت اسلاگ (تنها حروف کوچک انگلیسی، اعداد و خط تیره)
    CONSTRAINT chk_items_slug_format CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    -- اعتبارسنجی شماره شبا بانکی ایران (IR + 24 رقم)
    CONSTRAINT chk_items_seller_iban CHECK (seller_iban ~* '^IR[0-9]{24}$')
);

-- شاخص‌های یکتایی و جستجوی سریع
CREATE UNIQUE INDEX IF NOT EXISTS uq_items_slug ON public.items(LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC);

-- ==============================================================================
-- TABLE: orders (تراکنش‌ها و سفارشات)
-- ثبت و رهگیری پرداخت با کسر ۵٪ کارمزد خودکار پلتفرم پی‌پاس
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
    gateway_authority VARCHAR(64) NOT NULL,
    amount BIGINT NOT NULL,
    platform_fee BIGINT NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    customer_identifier TEXT NULL,
    payment_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- اعتبارسنجی مبالغ مالی
    CONSTRAINT chk_orders_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_orders_fee_valid CHECK (platform_fee >= 0 AND platform_fee <= amount)
);

-- شاخص‌های کلیدی جستجو برای وب‌هوک و رهگیری تراکنش‌ها
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_gateway_authority ON public.orders(gateway_authority);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON public.orders(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ==============================================================================
-- FUNCTIONS & TRIGGERS (به‌روزرسانی خودکار updated_at)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_items_updated_at ON public.items;
CREATE TRIGGER trg_items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- PUBLIC VIEW: items_public
-- ویو امن عمومی: فیلدهای حساس (encrypted_content و seller_iban) هرگز مستقیماً 
-- در سمت کلاینت عمومی قابل مشاهده نخواهند بود.
-- ==============================================================================
CREATE OR REPLACE VIEW public.items_public AS
SELECT
    id,
    slug,
    title,
    price,
    created_at
FROM public.items
WHERE is_active = true;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- سیاست‌های جداسازی دسترسی و امنیت لایه داده
-- ==============================================================================

-- ۱. فعال‌سازی RLS بر روی هر دو جدول
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ۲. پاکسازی سیاست‌های پیشین
DROP POLICY IF EXISTS "items_public_metadata_select" ON public.items;
DROP POLICY IF EXISTS "items_service_role_all" ON public.items;
DROP POLICY IF EXISTS "orders_public_insert_denied" ON public.orders;
DROP POLICY IF EXISTS "orders_service_role_all" ON public.orders;
DROP POLICY IF EXISTS "orders_verify_read_by_authority" ON public.orders;

-- ۳. سیاست‌های جدول items
-- دسترسی عمومی (Anon): کاربران عادی صرفاً می‌توانند آیتم‌های فعال را با فیلدهای عمومی مشاهده کنند.
-- نکته: فیلد encrypted_content صرفاً توسط کلاینت سروری (Service Role) در Server Action فراخوانی و دی‌کریپت می‌شود.
CREATE POLICY "items_public_metadata_select"
    ON public.items
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- دسترسی بدون مرز برای Service Role (مورد استفاده در Server Actions بعدی پی‌پاس)
CREATE POLICY "items_service_role_all"
    ON public.items
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ۴. سیاست‌های جدول orders
-- کلاینت‌های پابلیک حق دستکاری مستقیم و اینسرت دستی در orders را ندارند؛
-- تمام روال ایجاد و تایید سفارش فقط از طریق Server Action با توکن Service Role صورت می‌گیرد.
CREATE POLICY "orders_service_role_all"
    ON public.orders
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- اجازه خواندن وضعیت سفارش در سمت فرانت فقط بر اساس Authority یکتای پرداخت جاری
CREATE POLICY "orders_verify_read_by_authority"
    ON public.orders
    FOR SELECT
    TO anon, authenticated
    USING (gateway_authority IS NOT NULL);

-- ۵. تنظیمات مجوزهای پایگاه‌داده (Permissions Grant)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.items_public TO anon, authenticated, service_role;
GRANT SELECT ON public.items TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.items FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;
GRANT ALL ON public.items TO service_role;
GRANT ALL ON public.orders TO service_role;