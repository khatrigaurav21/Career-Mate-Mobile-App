import React, { useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api, type JobDetail, type WorkRights } from '@/lib/api';
import { AnimatedSection, Button, ErrorNotice } from '@/components/ui';
import { WorkRightsBanner, WorkRightsPicker } from '@/components/WorkRights';

// Shown for jobs evaluated before the visa check existed.
const NOT_CHECKED = {
  verdict: 'unknown' as const,
  summary: 'We haven’t checked this job against your work rights yet.',
  evidence: 'Not stated',
};

/**
 * The visa verdict on the job screen, plus a way to fill it in there and then.
 * Most testers skipped work rights in setup (8 of 9, Oct 2026), so most
 * results said "Work rights not set". With rights already saved, one tap
 * re-checks this job; without, the picker opens here and "Save and check"
 * saves them and re-checks in one go. Only the verdict is redone
 * (POST /jobs/:id/work-rights-check), never the whole report.
 */
export function WorkRightsCheck({ job }: { job: JobDetail }) {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const saved = (profile?.preferences?.work_rights as WorkRights | undefined) ?? null;
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<WorkRights | null>(saved);

  const check = useMutation({
    mutationFn: async (rights: WorkRights | null) => {
      if (rights && rights !== saved) {
        await api.setWorkRights(rights);
        await refreshProfile();
      }
      return api.recheckWorkRights(job.job_id);
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setPicking(false);
      void queryClient.invalidateQueries({ queryKey: ['job', job.job_id] });
      void queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });

  const verdict = job.work_rights ?? NOT_CHECKED;
  const action =
    verdict.verdict !== 'unknown' || picking ? undefined : (
      <Button
        variant="secondary"
        icon="shield"
        loading={check.isPending}
        onPress={() => (saved ? check.mutate(saved) : setPicking(true))}
      >
        Check if I can take this job
      </Button>
    );

  return (
    <View style={{ gap: 10 }}>
      <WorkRightsBanner workRights={verdict} action={action} />
      <AnimatedSection open={picking}>
        <View style={{ gap: 12 }}>
          <WorkRightsPicker value={draft} onChange={setDraft} />
          <Button icon="check" disabled={!draft} loading={check.isPending} onPress={() => check.mutate(draft)}>
            Save and check this job
          </Button>
          <Button variant="ghost" onPress={() => setPicking(false)}>
            Not now
          </Button>
        </View>
      </AnimatedSection>
      {check.isError ? (
        <ErrorNotice message={check.error instanceof Error ? check.error.message : 'We couldn’t check that. Please try again.'} />
      ) : null}
    </View>
  );
}
