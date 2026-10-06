import { useEffect } from 'react';
import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useAuth } from '@/context/AuthContext';

const URL_IN_TEXT = /https?:\/\/[^\s"'<>]+/i;

/**
 * "Share → Career Mate" from Seek, LinkedIn, a browser, etc. opens the
 * submit screen pre-filled with the shared link (or the shared text when
 * there's no link). The share is held until the user is signed in and has
 * a profile, so sharing from a signed-out app still lands after login.
 */
export function ShareIntentHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const { session, profile, profileChecked, hydrated } = useAuth();

  useEffect(() => {
    if (!hasShareIntent || !hydrated || !session || !profileChecked || !profile) return;
    const text = shareIntent.text?.trim() ?? '';
    const url = shareIntent.webUrl ?? text.match(URL_IN_TEXT)?.[0] ?? null;
    resetShareIntent();
    if (!url && !text) return;
    // shareId lets the Evaluate tab, which stays mounted, tell a new share
    // apart from the last one, even when the same link is shared twice.
    const shareId = String(Date.now());
    router.push({ pathname: '/submit', params: url ? { sharedUrl: url, shareId } : { sharedText: text, shareId } });
  }, [hasShareIntent, shareIntent, hydrated, session, profileChecked, profile, resetShareIntent]);

  return null;
}
