-- PayPass (پی‌پاس) - پایگاه‌داده تراکنش‌ها و اقلام میکرومانتایز
-- B2.st Studio Production Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جدول اقلام محتوایی (Items)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price BIGINT NOT NULL CHECK (price >= 1000), -- مبلغ به تومان
    currency VARCHAR(10) NOT NULL DEFAULT 'IRT',
    encrypted_content TEXT NOT NULL, -- محتوای محرمانه رمزنگاری‌شده با کلید AES-256-GCM
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('link', 'text', 'file', 'license_key')),
    slug VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- جدول سفارشات و تراکنش‌های مالی (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
    amount BIGINT NOT NULL CHECK (amount > 0),
    platform_fee BIGINT NOT NULL CHECK (platform_fee >= 0), -- ۵٪ کارمزد پلتفرم
    creator_amount BIGINT NOT NULL CHECK (creator_amount >= 0), -- ۹۵٪ سهم خالق اثر
    currency VARCHAR(10) NOT NULL DEFAULT 'IRT',
    authority VARCHAR(100) UNIQUE,
    ref_id VARCHAR(100),
    card_pan VARCHAR(30),
    buyer_email VARCHAR(255),
    buyer_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- ایندکس‌های پرکاربرد جهت سرعت‌بخشی به اعتبارسنجی و کشف تراکنش‌ها
CREATE INDEX IF NOT EXISTS idx_orders_authority ON public.orders(authority);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON public.orders(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_items_slug ON public.items(slug);

-- اعمال قانون امنیتی Row Level Security (RLS)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- خواندن اطلاعات عمومی آیتم توسط عموم کاربران
CREATE POLICY "Allow public read on active item metadata"
    ON public.items
    FOR SELECT
    USING (is_active = true);

-- دسترسی به سفارشات از طریق اکشن‌های امن سمت سرور (Service Role) مدیریت می‌شود