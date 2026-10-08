-- ============================================================================
-- EasyLearn — Monetization & Credits Schema
-- ============================================================================

-- 1. Table for user bonus credits
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_credits_select_own" ON public.user_credits;
CREATE POLICY "user_credits_select_own"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger to auto-create user_credits row for new users (optional but good practice)
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance) VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_credits ON public.profiles;
CREATE TRIGGER on_profile_created_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- 2. Daily usage tracking (to track free daily quota)
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lessons_generated INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_daily_usage_select_own" ON public.user_daily_usage;
CREATE POLICY "user_daily_usage_select_own"
  ON public.user_daily_usage FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Ad Tickets (secure claiming)
CREATE TABLE IF NOT EXISTS public.ad_credit_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  claimed_at TIMESTAMPTZ
);

ALTER TABLE public.ad_credit_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_credit_grants_select_own" ON public.ad_credit_grants;
CREATE POLICY "ad_credit_grants_select_own"
  ON public.ad_credit_grants FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Secure RPC to safely decrement bonus credit without race condition
CREATE OR REPLACE FUNCTION public.decrement_bonus_credit(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Select for update to lock the row
  SELECT balance INTO current_balance
  FROM public.user_credits
  WHERE user_id = user_id_param
  FOR UPDATE;

  IF current_balance > 0 THEN
    UPDATE public.user_credits
    SET balance = balance - 1, updated_at = NOW()
    WHERE user_id = user_id_param;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Secure RPC to safely increment daily usage
CREATE OR REPLACE FUNCTION public.increment_daily_usage(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.user_daily_usage (user_id, usage_date, lessons_generated)
  VALUES (user_id_param, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE
  SET lessons_generated = public.user_daily_usage.lessons_generated + 1
  RETURNING lessons_generated INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
