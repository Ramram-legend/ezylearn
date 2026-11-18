-- Authenticated clients may read their own data, but all reward, quota,
-- subscription and lesson mutations must go through validated server routes.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.profiles, public.lessons, public.quiz_attempts, public.user_stats,
    public.user_badges, public.user_credits, public.user_daily_usage,
    public.ad_credit_grants, public.ad_watch_sessions
  FROM anon, authenticated;

-- Signup creates a free profile directly from the auth callback. Keep only
-- the user-editable columns writable; plan remains server-managed.
GRANT INSERT (id, display_name, age, age_group, interests, updated_at)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name, age, age_group, interests, updated_at)
  ON TABLE public.profiles TO authenticated;

-- These SECURITY DEFINER functions accept a user id argument and therefore
-- must never be directly callable by browser roles.
REVOKE EXECUTE ON FUNCTION public.decrement_bonus_credit(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_daily_usage(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_bonus_credit(uuid, integer)
  FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.decrement_bonus_credit(uuid) SET search_path = '';
ALTER FUNCTION public.increment_daily_usage(uuid) SET search_path = '';
ALTER FUNCTION public.increment_bonus_credit(uuid, integer) SET search_path = '';

GRANT EXECUTE ON FUNCTION public.decrement_bonus_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_daily_usage(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_bonus_credit(uuid, integer) TO service_role;
