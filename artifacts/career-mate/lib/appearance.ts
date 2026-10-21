import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

/**
 * Light / dark choice. "system" follows the phone, which is what the app did
 * before there was a choice. Kept on the device (not per account) in plain
 * AsyncStorage: it isn't secret, and it describes the phone, not the person.
 */
export type AppearanceChoice = 'system' | 'light' | 'dark';

export const APPEARANCE_CHOICES: { value: AppearanceChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const KEY = 'appearance:choice';

function isChoice(v: unknown): v is AppearanceChoice {
  return v === 'system' || v === 'light' || v === 'dark';
}

function apply(choice: AppearanceChoice) {
  // The web build has no such function; the phone's own setting applies there.
  if (typeof Appearance.setColorScheme !== 'function') return;
  // 'unspecified' hands control back to the phone's own setting.
  Appearance.setColorScheme(choice === 'system' ? 'unspecified' : choice);
}

async function read(): Promise<AppearanceChoice> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    return isChoice(stored) ? stored : 'system';
  } catch {
    // Storage unavailable: follow the phone.
    return 'system';
  }
}

/** Call once at startup so the saved choice is back before the first screen shows. */
export function restoreAppearance() {
  void read().then(apply);
}

export function useAppearance() {
  const [choice, setChoice] = useState<AppearanceChoice>('system');

  useEffect(() => {
    let live = true;
    void read().then((c) => { if (live) setChoice(c); });
    return () => { live = false; };
  }, []);

  const update = useCallback((next: AppearanceChoice) => {
    setChoice(next);
    apply(next);
    void AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  return { choice, setChoice: update };
}
