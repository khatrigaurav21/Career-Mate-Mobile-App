import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { SESSION_KEY } from '@/lib/config';
import { api, Profile, Session, setTokenGetter, setUnauthorizedHandler } from '@/lib/api';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  profileChecked: boolean;
  hydrated: boolean;
  signIn: (session: Session) => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const signOut = async () => {
    setSession(null);
    setProfile(null);
    setProfileChecked(false);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  };

  const refreshProfile = async () => {
    try {
      const nextProfile = await api.getProfile();
      setProfile(nextProfile);
      setProfileChecked(true);
      return nextProfile;
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
        setProfile(null);
        setProfileChecked(true);
        return null;
      }
      throw error;
    }
  };

  const signIn = async (nextSession: Session) => {
    setSession(nextSession);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
    await refreshProfile();
  };

  useEffect(() => {
    setTokenGetter(() => session?.access_token ?? null);
    setUnauthorizedHandler(() => {
      void signOut();
    });
  }, [session]);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(SESSION_KEY)
      .then(async (stored) => {
        if (!active) return;
        if (!stored) {
          setHydrated(true);
          return;
        }
        const restored = JSON.parse(stored) as Session;
        setSession(restored);
        try {
          await refreshProfile();
        } catch {
          await signOut();
        } finally {
          if (active) setHydrated(true);
        }
      })
      .catch(async () => {
        await signOut();
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ session, profile, profileChecked, hydrated, signIn, refreshProfile, signOut }),
    [hydrated, profile, profileChecked, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}