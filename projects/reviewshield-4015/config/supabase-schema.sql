-- ==============================================================================
-- B2.st Studio | ReviewShield Database Schema & Security Architecture
-- Target: Supabase (PostgreSQL 15+)
-- Description: Core Schema, RLS Policies, Indexes, and Atomic RPC Functions.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing triggers/functions/tables if necessary (Clean Setup)
DROP TRIGGER IF EXISTS trg_businesses_updated_at ON businesses;
DROP TRIGGER IF EXISTS trg_feedbacks_updated_at ON feedbacks;
DROP FUNCTION IF EXISTS handle_updated_at CASCADE;
DROP FUNCTION IF EXISTS increment_business_rating CASCADE;
DROP TABLE IF EXISTS feedbacks CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- 3. Create Custom Enum Types
CREATE TYPE business_account_status AS ENUM (
    'active',         -- Rating counter is under limit or active subscription
    'limit_reached',  -- Exceeded free limit (30 ratings)
    'suspended',      -- Manually disabled by admin
    'pro'             -- Unlimited tier
);

-- 4. Create `businesses` Table
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    google_maps_review_url TEXT NOT NULL,
    telegram_bot_token TEXT NOT NULL,
    telegram_chat_id VARCHAR(64) NOT NULL,
    account_status business_account_status NOT NULL DEFAULT 'active',
    rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    rating_limit INTEGER NOT NULL DEFAULT 30 CHECK (rating_limit >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Constraints
    CONSTRAINT chk_slug_format CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT chk_google_maps_url CHECK (google_maps_review_url ~* '^https?://')
);

-- 5. Create `feedbacks` Table (Defense Mechanism Log for 1-3 Star Ratings)
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 3),
    feedback_text TEXT NOT NULL,
    customer_name VARCHAR(100),
    customer_contact VARCHAR(100),
    telegram_dispatched BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Constraints
    CONSTRAINT chk_feedback_text_length CHECK (char_length(feedback_text) >= 2)
);

-- 6. High-Performance Indexes for Edge SSR and Route Lookup
CREATE INDEX idx_businesses_slug ON businesses (slug);
CREATE INDEX idx_businesses_status ON businesses (account_status);
CREATE INDEX idx_feedbacks_business_id ON feedbacks (business_id);
CREATE INDEX idx_feedbacks_created_at ON feedbacks (created_at DESC);

-- 7. Updated At Timestamp Trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_feedbacks_updated_at
BEFORE UPDATE ON feedbacks
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- 8. Atomic Counter & Rating Eligibility RPC (Edge-Ready Concurrency Safe)
-- Evaluates status, locks row for update, increments rating counter, handles 30 free limit.
CREATE OR REPLACE FUNCTION increment_business_rating(p_slug VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business RECORD;
    v_is_eligible BOOLEAN;
    v_new_count INTEGER;
    v_new_status business_account_status;
BEGIN
    -- Row-level locking to avoid race conditions during concurrent edge traffic
    SELECT * INTO v_business
    FROM businesses
    WHERE slug = p_slug
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'BUSINESS_NOT_FOUND',
            'message', 'No business found matching the provided slug.'
        );
    END IF;

    -- Check if suspended
    IF v_business.account_status = 'suspended' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ACCOUNT_SUSPENDED',
            'message', 'Business profile is temporarily suspended.'
        );
    END IF;

    -- Evaluate free rating limit (Default: 30)
    IF v_business.account_status != 'pro' AND v_business.rating_count >= v_business.rating_limit THEN
        -- Ensure status flag is synced
        IF v_business.account_status != 'limit_reached' THEN
            UPDATE businesses SET account_status = 'limit_reached' WHERE id = v_business.id;
        END IF;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'LIMIT_EXCEEDED',
            'message', 'Free tier limit reached. Please upgrade to Pro.',
            'rating_count', v_business.rating_count,
            'rating_limit', v_business.rating_limit
        );
    END IF;

    -- Increment count
    v_new_count := v_business.rating_count + 1;
    v_new_status := v_business.account_status;

    -- If threshold just reached on this attempt
    IF v_business.account_status != 'pro' AND v_new_count >= v_business.rating_limit THEN
        v_new_status := 'limit_reached';
    END IF;

    UPDATE businesses
    SET rating_count = v_new_count,
        account_status = v_new_status
    WHERE id = v_business.id;

    RETURN jsonb_build_object(
        'success', true,
        'code', 'AUTHORIZED',
        'business_id', v_business.id,
        'business_name', v_business.business_name,
        'google_maps_review_url', v_business.google_maps_review_url,
        'account_status', v_new_status,
        'rating_count', v_new_count,
        'rating_limit', v_business.rating_limit
    );
END;
$$;

-- 9. Row Level Security (RLS) Configuration
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- 9.1 Column-Level Privilege Separation for `businesses`
-- Protect sensitive Telegram Bot Tokens and Chat IDs from public anon key
REVOKE ALL ON businesses FROM PUBLIC;
REVOKE ALL ON businesses FROM anon;
REVOKE ALL ON businesses FROM authenticated;

-- Allow Anon & Authenticated to read only non-sensitive public metadata
GRANT SELECT (id, slug, business_name, google_maps_review_url, account_status, rating_count, rating_limit, created_at)
ON businesses TO anon, authenticated;

-- Full access granted to service_role (Edge Route Handlers & Server Actions)
GRANT ALL ON businesses TO service_role;
GRANT ALL ON feedbacks TO service_role;

-- 9.2 RLS Policies for `businesses`
CREATE POLICY "Public can view active business profiles"
ON businesses
FOR SELECT
TO anon, authenticated
USING (
    account_status IN ('active', 'limit_reached', 'pro')
);

-- 9.3 RLS Policies for `feedbacks`
-- Public anon users CANNOT read feedbacks (Private to Business Owner)
-- Public can only insert feedback if business is existing and not suspended
CREATE POLICY "Anon can submit negative feedback"
ON feedbacks
FOR INSERT
TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = feedbacks.business_id
        AND b.account_status != 'suspended'
    )
);

CREATE POLICY "Service role has complete control over feedbacks"
ON feedbacks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);