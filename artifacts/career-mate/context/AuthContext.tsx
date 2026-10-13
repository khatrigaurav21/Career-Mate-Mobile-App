import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { setErrorReportingUser } from '@/lib/errorReporting';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_KEY } from '@/lib/config';
import { api, isApiError, Profile, Session, setSessionRefresher, setTokenGetter, setUnauthorizedHandler, withExpiry } from '@/lib/api';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  profileChecked: boolean;
  hydrated: boolean;
  // The saved session is kept but the profile couldn't be loaded (no signal,
  // server waking up). Retries run in the background; retryProfile tries now.
  profileUnreachable: boolean;
  retryProfile: () => void;
  signIn: (session: Session) => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const FIRST_RETRY_MS = 3000;
const MAX_RETRY_MS = 30000;

async function readSession() {
  return Platform.OS === 'web'
    ? AsyncStorage.getItem(SESSION_KEY)
    : SecureStore.getItemAsync(SESSION_KEY);
}

async function writeSession(value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(SESSION_KEY, value);
  } else {
    await SecureStore.setItemAsync(SESSION_KEY, value);
  }
}

async function clearSession() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(SESSION_KEY);
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

// The API client must have the token before React re-renders with the new
// session: screens' queries run in child effects, which fire before this
// provider's effects, so setting the token in an effect let the first request
// after a restore go out without it (401 -> signed out). Call this alongside
// every setSession.
function applySessionToken(session: Session | null) {
  const token = session?.access_token ?? null;
  setTokenGetter(() => token);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [profileUnreachable, setProfileUnreachable] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(FIRST_RETRY_MS);
  const queryClient = useQueryClient();
  // The session the refresher renews. A ref, not state, because the API
  // client calls the refresher outside React's render cycle.
  const sessionRef = useRef<Session | null>(null);

  // Every new or renewed session goes through here, so the API client, the
  // refresher, React state and secure storage never disagree.
  const adoptSession = async (next: Session) => {
    applySessionToken(next);
    sessionRef.current = next;
    setSession(next);
    await writeSession(JSON.stringify(next));
  };

  const stopRetrying = () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
    retryDelay.current = FIRST_RETRY_MS;
  };

  const signOut = async () => {
    stopRetrying();
    setProfileUnreachable(false);
    applySessionToken(null);
    sessionRef.current = null;
    setSession(null);
    setProfile(null);
    setProfileChecked(false);
    // Cached pipeline/job data isn't keyed by user, so drop it or the next
    // person to sign in on this device could briefly see the previous one's.
    queryClient.clear();
    await clearSession();
  };

  const refreshProfile = async (token?: string | null) => {
    try {
      const nextProfile = await api.getProfile(token);
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

  // Loads the profile for a restored session. Only the server saying the
  // session is over signs anyone out (the API client does that on a 401);
  // anything else — offline, timeout, server waking up — keeps the session
  // and tries again, backing off to every 30s.
  const loadProfileOrRetry = async (token?: string) => {
    try {
      await refreshProfile(token);
      stopRetrying();
      setProfileUnreachable(false);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        await signOut();
        return;
      }
      if (!sessionRef.current) return;
      setProfileUnreachable(true);
      const delay = retryDelay.current;
      retryDelay.current = Math.min(delay * 2, MAX_RETRY_MS);
      retryTimer.current = setTimeout(() => void loadProfileOrRetry(), delay);
    }
  };

  const retryProfile = () => {
    stopRetrying();
    void loadProfileOrRetry();
  };

  const signIn = async (nextSession: Session) => {
    const timed = withExpiry(nextSession);
    await adoptSession(timed);
    await refreshProfile(timed.access_token);
  };

  // Renews the session with its refresh token. Resolves to the new access
  // token, or null if the server says the session is over (revoked, expired,
  // account deleted) — the API client then signs the user out. Network
  // failures throw instead, so being offline never signs anyone out.
  useEffect(() => {
    setSessionRefresher(
      async () => {
        const current = sessionRef.current;
        if (!current?.refresh_token) return null;
        try {
          const renewed = withExpiry(await api.refreshSession(current.refresh_token));
          // Signed out while the refresh was in flight: don't resurrect it.
          if (sessionRef.current?.refresh_token !== current.refresh_token) return null;
          await adoptSession(renewed);
          return renewed.access_token;
        } catch (error) {
          if (isApiError(error) && (error.status === 400 || error.status === 401)) return null;
          throw error;
        }
      },
      () => sessionRef.current?.expires_at ?? null,
    );
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
  }, [session]);

  useEffect(() => {
    let active = true;
    readSession()
      .then(async (stored) => {
        if (!active) return;
        if (!stored) {
          setHydrated(true);
          return;
        }
        // May be hours old, or saved before expires_at existed; either way
        // the API client renews it on first use.
        const restored = JSON.parse(stored) as Session;
        applySessionToken(restored);
        sessionRef.current = restored;
        setSession(restored);
        try {
          await loadProfileOrRetry(restored.access_token);
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

  useEffect(() => stopRetrying, []);

  // Lets Sentry group errors by (anonymous) user, never by email.
  useEffect(() => {
    setErrorReportingUser(session?.user_id ?? null);
  }, [session?.user_id]);

  const value = useMemo(
    () => ({ session, profile, profileChecked, hydrated, profileUnreachable, retryProfile, signIn, refreshProfile, signOut }),
    [hydrated, profile, profileChecked, profileUnreachable, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}