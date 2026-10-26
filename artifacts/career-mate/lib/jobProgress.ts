import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Which steps of a job a person has been through. The CV and cover letter are
 * "done" when the document exists (the job screen knows that), so only the
 * steps that have no output of their own are remembered here: looking at the
 * verdict, going through the fit steps, and opening the application questions.
 * Kept on the device, per job, in plain AsyncStorage: it's only a tick.
 */
export type SeenStep = 'verdict' | 'fit' | 'questions';
export type Seen = Record<SeenStep, boolean>;

const EMPTY: Seen = { verdict: false, fit: false, questions: false };
const storageKey = (jobId: string) => `job_progress:v1:${jobId}`;

async function read(jobId: string): Promise<Seen> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(jobId));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Seen>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function useJobProgress(jobId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['job-progress', jobId];
  const query = useQuery({ queryKey, queryFn: () => read(jobId), staleTime: Infinity, enabled: !!jobId });

  const mark = async (step: SeenStep) => {
    const current = queryClient.getQueryData<Seen>(queryKey) ?? (await read(jobId));
    if (current[step]) return;
    const updated = { ...current, [step]: true };
    queryClient.setQueryData(queryKey, updated);
    await AsyncStorage.setItem(storageKey(jobId), JSON.stringify(updated)).catch(() => {});
  };

  return { seen: query.data ?? EMPTY, mark };
}

/** Ticks a step the moment its screen opens. */
export function useMarkSeen(jobId: string, step: SeenStep) {
  const { mark } = useJobProgress(jobId);
  useEffect(() => {
    void mark(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, step]);
}
