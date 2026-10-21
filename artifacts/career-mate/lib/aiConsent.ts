import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

/**
 * Permission to send personal data to the AI provider (Google Gemini).
 * Apple's App Review Guideline 5.1.2(i) asks apps to say where personal data
 * goes, including to third-party AI, and to get explicit permission first.
 *
 * Kept on the device, per signed-in account, in plain AsyncStorage (it's a
 * yes/no, not a secret). The version is part of the key: if the wording or the
 * provider changes, bump it and everyone is asked again.
 */
export const AI_CONSENT_VERSION = '1';

const accountKey = (userId: string) => `ai_consent:v${AI_CONSENT_VERSION}:${userId}`;
// Before sign-in there's no account: the "try it first" check asks per device.
const DEVICE_KEY = `ai_consent_preview:v${AI_CONSENT_VERSION}`;

async function readFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === '1';
  } catch {
    // Storage unavailable: ask rather than assume yes.
    return false;
  }
}

/** The signed-in account's agreement. `ready` is false until it has been read. */
export function useAiConsent() {
  const { session } = useAuth();
  const userId = session?.user_id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['ai-consent', userId];
  const query = useQuery({ queryKey, queryFn: () => readFlag(accountKey(userId as string)), enabled: !!userId, staleTime: Infinity });

  const set = useCallback(
    async (value: boolean) => {
      if (!userId) return;
      queryClient.setQueryData(['ai-consent', userId], value);
      await AsyncStorage.setItem(accountKey(userId), value ? '1' : '0').catch(() => {});
    },
    [userId, queryClient],
  );

  return {
    ready: query.isSuccess,
    accepted: query.data === true,
    accept: () => set(true),
    withdraw: () => set(false),
  };
}

/** The same question for the pre-sign-in check, remembered per device. */
export function usePreviewConsent() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let live = true;
    void readFlag(DEVICE_KEY).then((v) => {
      if (live) setAccepted(v);
    });
    return () => {
      live = false;
    };
  }, []);

  const set = useCallback((value: boolean) => {
    setAccepted(value);
    void AsyncStorage.setItem(DEVICE_KEY, value ? '1' : '0').catch(() => {});
  }, []);

  return { accepted, setAccepted: set };
}
