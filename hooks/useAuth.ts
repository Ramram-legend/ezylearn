'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserStats } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  stats: UserStats | null;
  loading: boolean;
  /** Opens the global login modal */
  openLogin: () => void;
  /** Signs the user out */
  signOut: () => Promise<void>;
  /** Refreshes the user profile and stats from the DB */
  refreshStats: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  profile: null,
  stats: null,
  loading: true,
  openLogin: () => {},
  signOut: async () => {},
  refreshStats: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };

/**
 * Hook for use inside AuthProvider — keeps auth state synced and
 * exposes helpers to open the login modal / sign out.
 */
export function useAuthState(onOpenLogin: () => void) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndStats = useCallback(
    async (userId: string) => {
      const [{ data: profileData }, { data: statsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle()
      ]);
      setProfile(profileData ?? null);
      setStats(statsData ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    // Hydrate from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfileAndStats(session.user.id);
      setLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndStats(session.user.id);
      } else {
        setProfile(null);
        setStats(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfileAndStats]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setSession(null);
    setProfile(null);
    setStats(null);
    window.location.href = '/';
  }, []);

  const refreshStats = useCallback(async () => {
    if (user) {
      await fetchProfileAndStats(user.id);
    }
  }, [user, fetchProfileAndStats]);

  return { user, session, profile, stats, loading, openLogin: onOpenLogin, signOut, refreshStats };
}
