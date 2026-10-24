import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { JobDetail } from '@/lib/api';
import { ErrorNotice, IconButton, LoadingState, Screen } from '@/components/ui';

/**
 * Loads a job for a screen that works on one. A job opened from a link can
 * mount before the saved session is restored; a request then goes out without
 * a token and signs the person out, so wait for the session first and send
 * signed-out visitors to the start screen. The job is shared (same query key)
 * with the job screen, so moving between steps doesn't fetch it again.
 */
export function JobGate({ children }: { children: (job: JobDetail, id: string) => React.ReactNode }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, hydrated } = useAuth();
  const job = useQuery({ queryKey: ['job', id], queryFn: () => api.getJob(id), enabled: !!id && !!session });

  if (hydrated && !session) return <Redirect href="/" />;
  if (!hydrated || job.isLoading) {
    return <Screen scroll={false}><LoadingState title="Opening this job" detail="Getting your results ready." /></Screen>;
  }
  if (job.isError || !job.data) {
    return (
      <Screen>
        <IconButton icon="arrow-left" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} label="Go back" />
        <ErrorNotice message={job.error instanceof Error ? job.error.message : 'We could not open this job.'} />
      </Screen>
    );
  }
  return <>{children(job.data, id)}</>;
}
