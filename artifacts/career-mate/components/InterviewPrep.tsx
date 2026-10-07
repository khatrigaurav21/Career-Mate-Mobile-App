import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { api, isApiError } from '@/lib/api';
import type { InterviewPrep, JobDetail } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button, ErrorNotice, SegmentedProgress } from '@/components/ui';
import type { ProgressStep } from '@/components/ui';

// Module-level so SegmentedProgress doesn't restart on every render.
export const PREP_PROGRESS: ProgressStep[] = [
  { label: 'Reading the job and your evaluation', estimatedMs: 4000 },
  { label: 'Matching questions to your CV', estimatedMs: 6000 },
  { label: 'Writing your answers', estimatedMs: 6000 },
];

export function prepErrorMessage(error: unknown) {
  return isApiError(error) && error.status === 429 ? error.message : 'We couldn’t build your interview prep. Please try again.';
}

/**
 * Builds the interview prep pack and stores it in the job's cached detail, so
 * the prep screen (which reads the same ['job', id] query) shows it at once.
 */
export function useBuildInterviewPrep(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.buildInterviewPrep(jobId),
    onSuccess: ({ interview_prep }) => {
      queryClient.setQueryData<JobDetail>(['job', jobId], (old) => (old ? { ...old, interview_prep } : old));
    },
  });
}

const SHOW_FOR = new Set(['applied', 'interviewing', 'offer']);

/** Entry point on job detail: build the pack, or open the one already built. */
export function InterviewPrepCard({ job }: { job: JobDetail }) {
  const colors = useColors();
  const build = useBuildInterviewPrep(job.job_id);
  const prep: InterviewPrep | null | undefined = job.interview_prep;
  if (!prep && !SHOW_FOR.has(job.status)) return null;

  const open = () => router.push(`/prep/${job.job_id}`);
  const interviewing = job.status === 'interviewing';

  return (
    <View style={{ backgroundColor: colors.inkPanel, borderRadius: 18, padding: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="mic" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[type.titleCard, { color: colors.onNavy }]}>{prep ? 'Your interview prep' : interviewing ? 'Get ready for your interview' : 'Prepare before they call'}</Text>
          <Text style={[type.bodyMd, { color: colors.onNavyMuted }]}>
            {prep
              ? `${prep.questions.length} likely questions with answers from your CV, your work-rights answer, and questions to ask them.`
              : 'Likely questions with answers built from your CV, how to answer the visa question, and what to ask them.'}
          </Text>
        </View>
      </View>
      {build.isPending && <SegmentedProgress steps={PREP_PROGRESS} />}
      {build.isError && <ErrorNotice message={prepErrorMessage(build.error)} />}
      <Button
        onPress={() => (prep ? open() : build.mutate(undefined, { onSuccess: open }))}
        loading={build.isPending}
        icon={prep ? 'arrow-right' : 'zap'}
        style={{ alignSelf: 'flex-end' }}
      >
        {prep ? 'Open prep' : 'Build my interview prep'}
      </Button>
    </View>
  );
}

/** A tappable question card: question + fit, expands to the answer. */
export function PrepQuestion({ item }: { item: InterviewPrep['questions'][number] }) {
  const colors = useColors();
  const [open, setOpen] = React.useState(false);
  const fit = {
    strong: { label: 'Strong example', fg: colors.success, bg: colors.successSoft, icon: 'check-circle' as const },
    partial: { label: 'Transferable', fg: colors.warning, bg: colors.warningSoft, icon: 'shuffle' as const },
    none: { label: 'Prepare a story', fg: colors.destructive, bg: colors.destructiveSoft, icon: 'alert-circle' as const },
  }[item.fit] ?? { label: 'Example', fg: colors.mutedForeground, bg: colors.muted, icon: 'circle' as const };
  // Availability or salary questions need no CV story, so a "Strong example"
  // chip on them means nothing. Show it only when the answer cites the CV,
  // or when there's nothing in the CV to cite.
  const showFit = item.fit === 'none' || !!item.cv_evidence;

  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' }}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityHint={open ? 'Hides the suggested answer' : 'Shows the suggested answer'}
        style={({ pressed }) => ({ padding: 16, gap: 8, opacity: pressed ? 0.85 : 1 })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Text style={[type.titleCard, { color: colors.navy, flex: 1 }]}>{item.question}</Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} style={{ marginTop: 2 }} />
        </View>
        {showFit && <View style={{ flexDirection: 'row' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: fit.bg, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 }}>
            <Feather name={fit.icon} size={13} color={fit.fg} />
            <Text style={[type.labelPill, { color: fit.fg }]}>{fit.label}</Text>
          </View>
        </View>}
      </Pressable>
      {open && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={[type.labelEyebrow, { color: colors.mutedForeground }]}>Why they ask</Text>
          <Text style={[type.bodyMd, { color: colors.foreground }]}>{item.why_asked}</Text>
          <Text style={[type.labelEyebrow, { color: colors.mutedForeground }]}>Your answer</Text>
          <Text selectable style={[type.bodyLg, { color: colors.foreground }]}>{item.answer}</Text>
          {item.cv_evidence ? (
            <View style={{ backgroundColor: colors.accent, borderRadius: 12, padding: 12, gap: 2 }}>
              <Text style={[type.labelCaption, { color: colors.accentForeground }]}>From your CV</Text>
              <Text style={[type.bodyMd, { color: colors.accentForeground }]}>“{item.cv_evidence}”</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
