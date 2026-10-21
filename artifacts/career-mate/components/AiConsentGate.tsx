import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAiConsent } from '@/lib/aiConsent';

/**
 * Sends a signed-in person to the AI permission screen until they've agreed.
 * Runs on every route change, so a deep link or a shared job can't skip it,
 * and it covers existing accounts the first time they open this version.
 */
export function AiConsentGate() {
  const { session, hydrated } = useAuth();
  const consent = useAiConsent();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated || !session || !consent.ready || consent.accepted) return;
    if (pathname === '/ai-consent' || pathname === '/login') return;
    router.replace('/ai-consent');
  }, [hydrated, session, consent.ready, consent.accepted, pathname]);

  return null;
}
