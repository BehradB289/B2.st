-- ====================================================================
-- B2.st VoiceProposal Database Schema & Policies
-- ماژول پایگاه داده Supabase برای پروژه وویس‌پروپوزال
-- ====================================================================

-- ۱. فعال‌سازی اکستنشن‌های موردنیاز
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ۲. ساخت نوع شمارشی وضعیت پروپوزال
DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('draft', 'published', 'accepted', 'rejected', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ۳. ایجاد جدول اصلی پروپوزال‌ها (proposals)
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    audio_hash VARCHAR(64) NOT NULL,
    raw_transcription TEXT NOT NULL,
    structured_data JSONB NOT NULL,
    client_name VARCHAR(255),
    project_title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'IRT',
    status proposal_status NOT NULL DEFAULT 'draft',
    processing_time_ms INTEGER,
    audio_duration_seconds NUMERIC(8, 2),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ۴. ایندکس‌گذاری بهینه برای جستجوی سریع کش صوتی و گزارش‌گیری
CREATE INDEX IF NOT EXISTS idx_proposals_audio_hash ON public.proposals (audio_hash);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals (user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals (status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_gin_structured_data ON public.proposals USING GIN (structured_data);

-- ۵. تریگر به‌روزرسانی اتوماتیک updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_proposals_updated_at ON public.proposals;
CREATE TRIGGER set_proposals_updated_at
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ۶. فعال‌سازی RLS (Row Level Security)
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- قوانین دسترسی امنیتی RLS:
-- قانون الف: اجازه دسترسی کامل برای نقش Service Role (سرور اکشن‌ها و ورکرها)
CREATE POLICY "Service role has full access to proposals"
    ON public.proposals
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- قانون ب: کاربر احراز هویت شده فقط می‌تواند پروپوزال‌های مرتبط با اکانت خود را بخواند
CREATE POLICY "Users can view their own proposals"
    ON public.proposals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- قانون ج: کاربر احراز هویت شده می‌تواند پروپوزال‌های خود را ویرایش کند
CREATE POLICY "Users can update their own proposals"
    ON public.proposals
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- قانون د: پروپوزال‌های عمومی/منتشر شده برای کلاینت‌ها با شناسه یکتا قابل مشاهده هستند
CREATE POLICY "Public proposals are viewable by id"
    ON public.proposals
    FOR SELECT
    TO anon
    USING (status IN ('published', 'accepted'));