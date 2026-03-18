-- MIGRATION: PAYMENT ORDERS (MercadoPago Integration)
-- Tracks every payment attempt and its status from MercadoPago webhooks.

CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('course', 'certificate', 'ai_video')),
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    mp_preference_id TEXT,
    mp_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'in_process')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_payment_orders_mp_preference ON public.payment_orders(mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_mp_payment ON public.payment_orders(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON public.payment_orders(user_id);

-- RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment orders
CREATE POLICY "Users can view own payments" ON public.payment_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (from Edge Functions)
CREATE POLICY "Service can manage payments" ON public.payment_orders
    FOR ALL USING (true) WITH CHECK (true);
