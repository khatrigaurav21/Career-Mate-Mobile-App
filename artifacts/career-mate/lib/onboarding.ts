import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

/**
 * First-run state, kept on the device per signed-in user: whether they've
 * seen the welcome tour, and whether they've hidden the Getting started
 * checklist. Not secret, so plain AsyncStorage. Read through React Query so
 * every screen sees the same value and updates together.
 */
type OnboardingState = { welcomeSeen: boolean; checklistHidden: boolean };

const keys = (userId: string) => ({
  welcomeSeen: `onboarding:welcome_seen:${userId}`,
  checklistHidden: `onboarding:checklist_hidden:${userId}`,
});

async function readState(userId: string): Promise<OnboardingState> {
  const k = keys(userId);
  try {
    const [welcome, hidden] = await Promise.all([AsyncStorage.getItem(k.welcomeSeen), AsyncStorage.getItem(k.checklistHidden)]);
    return { welcomeSeen: welcome === '1', checklistHidden: hidden === '1' };
  } catch {
    // Storage unavailable: don't trap anyone in the tour.
    return { welcomeSeen: true, checklistHidden: false };
  }
}

export function useOnboarding() {
  const { session } = useAuth();
  const userId = session?.user_id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['onboarding', userId];
  const query = useQuery({ queryKey, queryFn: () => readState(userId as string), enabled: !!userId, staleTime: Infinity });

  const update = async (patch: Partial<OnboardingState>) => {
    if (!userId) return;
    const k = keys(userId);
    queryClient.setQueryData<OnboardingState>(queryKey, (old) => ({ welcomeSeen: false, checklistHidden: false, ...old, ...patch }));
    await Promise.all(
      Object.entries(patch).map(([name, value]) =>
        AsyncStorage.setItem(k[name as keyof OnboardingState], value ? '1' : '0').catch(() => {}),
      ),
    );
  };

  return {
    ready: query.isSuccess,
    welcomeSeen: query.data?.welcomeSeen ?? false,
    checklistHidden: query.data?.checklistHidden ?? false,
    markWelcomeSeen: () => update({ welcomeSeen: true }),
    hideChecklist: () => update({ checklistHidden: true }),
    // "Show the app tour again" in Profile.
    restart: () => update({ welcomeSeen: false, checklistHidden: false }),
  };
}
