-- ============================================================================
-- EasyLearn — Schema Supabase (PostgreSQL)
-- Idempotent : peut etre execute plusieurs fois sans erreur.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- CATALOGUE DES CENTRES D'INTERET (lecture publique, reference fixe)
-- ----------------------------------------------------------------------------
create table if not exists public.interest_catalog (
  id text primary key,
  label text not null,
  icon text not null,
  sort_order integer not null default 0
);

alter table public.interest_catalog enable row level security;

drop policy if exists "interest_catalog_select_all" on public.interest_catalog;
create policy "interest_catalog_select_all"
  on public.interest_catalog for select
  using (true);

insert into public.interest_catalog (id, label, icon, sort_order) values
  ('football', 'Football', '⚽', 1),
  ('gaming', 'Gaming', '🎮', 2),
  ('music', 'Musique', '🎵', 3),
  ('space', 'Espace', '🚀', 4),
  ('animals', 'Animaux', '🐾', 5),
  ('tech', 'Tech', '🤖', 6),
  ('cooking', 'Cuisine', '🍳', 7),
  ('cinema', 'Cinema', '🎬', 8),
  ('science', 'Science', '🔬', 9),
  ('nature', 'Nature', '🌿', 10),
  ('sports', 'Sports', '🏆', 11),
  ('arts', 'Arts', '🎨', 12)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- PROFILS (etend auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  age integer not null check (age between 5 and 25),
  age_group text not null check (age_group in ('enfant', 'college_lycee', 'etudiant_adulte')),
  interests text[] not null default '{}',
  plan text not null default 'gratuit' check (plan in ('gratuit', 'plus', 'famille', 'etablissement')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- LECONS GENEREES PAR IA
-- ----------------------------------------------------------------------------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null,
  subject text not null default 'Sciences',
  level text not null default 'Intermediaire',
  content jsonb not null,
  quiz jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

drop policy if exists "lessons_select_own" on public.lessons;
create policy "lessons_select_own"
  on public.lessons for select
  using (auth.uid() = user_id);

drop policy if exists "lessons_insert_own" on public.lessons;
create policy "lessons_insert_own"
  on public.lessons for insert
  with check (auth.uid() = user_id);

create index if not exists lessons_user_created_idx
  on public.lessons (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- TENTATIVES DE QUIZ
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  xp_earned integer not null,
  created_at timestamptz not null default now()
);

alter table public.quiz_attempts enable row level security;

drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

drop policy if exists "quiz_attempts_insert_own" on public.quiz_attempts;
create policy "quiz_attempts_insert_own"
  on public.quiz_attempts for insert
  with check (auth.uid() = user_id);

create index if not exists quiz_attempts_user_created_idx
  on public.quiz_attempts (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- STATISTIQUES UTILISATEUR (XP, streak, compteurs)
-- ----------------------------------------------------------------------------
create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_xp integer not null default 150,
  current_streak integer not null default 1,
  longest_streak integer not null default 0,
  last_activity_date date,
  lessons_completed integer not null default 0,
  quizzes_completed integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_stats enable row level security;

drop policy if exists "user_stats_select_own" on public.user_stats;
create policy "user_stats_select_own"
  on public.user_stats for select
  using (auth.uid() = user_id);

drop policy if exists "user_stats_insert_own" on public.user_stats;
create policy "user_stats_insert_own"
  on public.user_stats for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_stats_update_own" on public.user_stats;
create policy "user_stats_update_own"
  on public.user_stats for update
  using (auth.uid() = user_id);

-- Cree automatiquement une ligne user_stats des qu'un profil est cree.
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.user_stats (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- ----------------------------------------------------------------------------
-- BADGES (catalogue public) + BADGES OBTENUS
-- ----------------------------------------------------------------------------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  icon text not null,
  description text not null,
  condition_type text not null check (condition_type in ('lessons_count', 'perfect_score', 'streak')),
  condition_value integer not null default 0
);

alter table public.badges enable row level security;

drop policy if exists "badges_select_all" on public.badges;
create policy "badges_select_all"
  on public.badges for select
  using (true);

insert into public.badges (code, label, icon, description, condition_type, condition_value) values
  ('first_lesson', 'Premiere Lecon', '📖', 'Termine ta toute premiere lecon avec quiz.', 'lessons_count', 1),
  ('perfect_score', 'Score Parfait', '🏆', 'Obtiens un score parfait a un quiz.', 'perfect_score', 1),
  ('streak_3', 'Serie de 3 jours', '🔥', 'Apprends 3 jours de suite.', 'streak', 3),
  ('streak_7', 'Serie de 7 jours', '⚡', 'Apprends 7 jours de suite.', 'streak', 7),
  ('lessons_10', '10 Lecons', '📚', 'Termine 10 lecons.', 'lessons_count', 10),
  ('lessons_50', '50 Lecons', '🎓', 'Termine 50 lecons.', 'lessons_count', 50)
on conflict (code) do nothing;

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
  on public.user_badges for select
  using (auth.uid() = user_id);

drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- TRIGGER : cree un profil stub lors de l'inscription (magic link)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _display_name text;
  _age integer := 14;
  _age_group text := 'college_lycee';
begin
  -- Try to get name from user metadata (set during OAuth or via signInWithOtp options)
  _display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Apprenant'
  );

  insert into public.profiles (id, display_name, age, age_group, interests)
  values (new.id, _display_name, _age, _age_group, '{"space","coding","gaming"}')
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- MONETIZATION & CREDITS
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

DROP POLICY IF EXISTS "user_credits_insert_own" ON public.user_credits;
CREATE POLICY "user_credits_insert_own"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_credits_update_own" ON public.user_credits;
CREATE POLICY "user_credits_update_own"
  ON public.user_credits FOR UPDATE
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

DROP POLICY IF EXISTS "user_daily_usage_insert_own" ON public.user_daily_usage;
CREATE POLICY "user_daily_usage_insert_own"
  ON public.user_daily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_daily_usage_update_own" ON public.user_daily_usage;
CREATE POLICY "user_daily_usage_update_own"
  ON public.user_daily_usage FOR UPDATE
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

DROP POLICY IF EXISTS "ad_credit_grants_insert_own" ON public.ad_credit_grants;
CREATE POLICY "ad_credit_grants_insert_own"
  ON public.ad_credit_grants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ad_credit_grants_update_own" ON public.ad_credit_grants;
CREATE POLICY "ad_credit_grants_update_own"
  ON public.ad_credit_grants FOR UPDATE
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

-- 6. Secure RPC to safely increment bonus credit
CREATE OR REPLACE FUNCTION public.increment_bonus_credit(user_id_param UUID, amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (user_id_param, amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.user_credits.balance + amount, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ad Watch Sessions (2-step verification & anti-cheat)
CREATE TABLE IF NOT EXISTS public.ad_watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.ad_watch_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_watch_sessions_select_own" ON public.ad_watch_sessions;
CREATE POLICY "ad_watch_sessions_select_own"
  ON public.ad_watch_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ad_watch_sessions_insert_own" ON public.ad_watch_sessions;
CREATE POLICY "ad_watch_sessions_insert_own"
  ON public.ad_watch_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ad_watch_sessions_update_own" ON public.ad_watch_sessions;
CREATE POLICY "ad_watch_sessions_update_own"
  ON public.ad_watch_sessions FOR UPDATE
  USING (auth.uid() = user_id);


