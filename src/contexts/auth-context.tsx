'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, UserRole } from '@/lib/types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Stabilize supabase client — create once, reuse forever
  const supabase = useMemo(() => createClient(), []);

  // Cleanup flag on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Memoize fetchProfile to prevent re-renders from changing reference
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (mountedRef.current) {
        setProfile(data as User);
      }
    } catch {
      // Profile fetch failed — user might not have a profile row yet.
      if (mountedRef.current) {
        setProfile(null);
      }
    }
  }, [supabase]);

  // Initial auth check + onAuthStateChange listener — runs ONCE
  useEffect(() => {
    let cancelled = false;

    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!cancelled && mountedRef.current) {
          setUser(authUser);
          if (authUser) {
            await fetchProfile(authUser.id);
          }
        }
      } catch {
        // Auth check failed
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled || !mountedRef.current) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        if (mountedRef.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // Memoize signIn to prevent child re-renders from creating new references
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Terjadi kesalahan jaringan';
      return { error: message };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const hasRole = useCallback((...roles: UserRole[]) => {
    return profile ? roles.includes(profile.role) : false;
  }, [profile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
