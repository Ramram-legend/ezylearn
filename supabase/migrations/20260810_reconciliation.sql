-- ============================================================================
-- EasyLearn — Reconciliation schema/production (2026-08-10)
-- Garantit que la base en production converge vers supabase/schema.sql.
-- Idempotent : peut etre execute plusieurs fois sans erreur.
--
-- Correctifs apportes par rapport a la migration 20260728_monetization.sql :
--   1. RPC public.increment_bonus_credit (attribution de credit apres pub)
--   2. Table public.ad_watch_sessions (anti-triche session de visionnage)
--   3. Policies INSERT/UPDATE manquantes sur user_credits,
--      user_daily_usage et ad_credit_grants (parite avec schema.sql)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RPC secure : increment du solde de credits (anti course critique)
--    (deja present dans schema.sql ; rappatrie ici pour la production)
-- ----------------------------------------------------------------------------
create or replace function public.increment_bonus_credit(user_id_param uuid, amount integer default 1)
returns void as $$
begin
  insert into public.user_credits (user_id, balance)
  values (user_id_param, amount)
  on conflict (user_id) do update
    set balance = public.user_credits.balance + amount, updated_at = now();
end;
$$ language plpgsql security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- 2. Table ad_watch_sessions (2-step verification & anti-cheat)
-- ----------------------------------------------------------------------------
create table if not exists public.ad_watch_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  used boolean not null default false
);

alter table public.ad_watch_sessions enable row level security;

drop policy if exists "ad_watch_sessions_select_own" on public.ad_watch_sessions;
create policy "ad_watch_sessions_select_own"
  on public.ad_watch_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "ad_watch_sessions_insert_own" on public.ad_watch_sessions;
create policy "ad_watch_sessions_insert_own"
  on public.ad_watch_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "ad_watch_sessions_update_own" on public.ad_watch_sessions;
create policy "ad_watch_sessions_update_own"
  on public.ad_watch_sessions for update
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Policies INSERT/UPDATE manquantes (parite avec schema.sql)
-- ----------------------------------------------------------------------------
-- user_credits
drop policy if exists "user_credits_insert_own" on public.user_credits;
create policy "user_credits_insert_own"
  on public.user_credits for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_credits_update_own" on public.user_credits;
create policy "user_credits_update_own"
  on public.user_credits for update
  using (auth.uid() = user_id);

-- user_daily_usage
drop policy if exists "user_daily_usage_insert_own" on public.user_daily_usage;
create policy "user_daily_usage_insert_own"
  on public.user_daily_usage for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_daily_usage_update_own" on public.user_daily_usage;
create policy "user_daily_usage_update_own"
  on public.user_daily_usage for update
  using (auth.uid() = user_id);

-- ad_credit_grants
drop policy if exists "ad_credit_grants_insert_own" on public.ad_credit_grants;
create policy "ad_credit_grants_insert_own"
  on public.ad_credit_grants for insert
  with check (auth.uid() = user_id);

drop policy if exists "ad_credit_grants_update_own" on public.ad_credit_grants;
create policy "ad_credit_grants_update_own"
  on public.ad_credit_grants for update
  using (auth.uid() = user_id);
