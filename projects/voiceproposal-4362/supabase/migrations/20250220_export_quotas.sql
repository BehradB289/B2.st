-- Create Table for Tracking Free Export Usage
CREATE TABLE IF NOT EXISTS public.user_export_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint VARCHAR(255) NOT NULL,
    free_exports_used INT NOT NULL DEFAULT 0,
    max_free_exports INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_fingerprint UNIQUE(fingerprint, user_id)
);

CREATE INDEX IF NOT EXISTS idx_export_quotas_fingerprint ON public.user_export_quotas(fingerprint);
CREATE INDEX IF NOT EXISTS idx_export_quotas_user_id ON public.user_export_quotas(user_id);

-- Create Table for Pay-per-Export Transactions
CREATE TABLE IF NOT EXISTS public.export_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    proposal_id UUID NOT NULL,
    fingerprint VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'IRR',
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    payment_authority VARCHAR(255) UNIQUE,
    payment_reference VARCHAR(255),
    custom_logo_enabled BOOLEAN NOT NULL DEFAULT true,
    watermark_removed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_tx_proposal ON public.export_transactions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_export_tx_status ON public.export_transactions(status);

-- RLS Security Policies
ALTER TABLE public.user_export_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on quotas" 
ON public.user_export_quotas 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access on transactions" 
ON public.export_transactions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);