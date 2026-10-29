import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { CvSuggestionCard } from '@/components/CvSuggestionCard';
import { summariseChanges, summariseMatch } from '@/lib/reportSummary';
import { useQuery } from '@tanstack/react-query';
import { CvNotes } from '@/components/CvNotes';
import { api, getDocumentUrl } from '@/lib/api';
import type { JobDetail } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// Opens straight after the CV is made (from=cv): what to add to it so it covers
// this job better. Each card proposes one line your profile supports; nothing
// is saved until you confirm. Also reachable later from the job screen.
export default function ChangesStep() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return <JobGate>{(job, id) => <ChangesBody job={job} id={id} afterCv={from === 'cv'} />}</JobGate>;
}

function ChangesBody({ job, id, afterCv }: { job: JobDetail; id: string; afterCv: boolean }) {
  const colors = useColors();
  const changes = summariseChanges(job.report?.E);
  const gaps = summariseMatch(job.report?.B).gaps.slice(0, 4);
  const hasCv = !!getDocumentUrl(job, 'cv');
  const cv = useQuery({ queryKey: ['cv', id], queryFn: () => api.getCv(id), enabled: hasCv });
  const nothing = changes.length === 0 && gaps.length === 0;

  const primary = !hasCv
    ? { label: 'Make my CV', onPress: () => router.push(`/job/${id}/cv`) }
    : afterCv
      ? { label: 'Next: cover letter', onPress: () => router.push(`/job/${id}/letter`) }
      : { label: 'Back to this job', onPress: () => router.replace(`/job/${id}`) };

  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Make your CV stronger"
      primary={primary}
      secondary={{ label: 'Read the full report', onPress: () => router.push(`/job/${id}/details`) }}
    >
      {hasCv ? (
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
          Your CV is ready. Add any of these to make it fit this job better. Each one shows the line first, and you can edit it.
        </Text>
      ) : null}
      <CvNotes notes={cv.data?.content.notes} />

      {changes.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text style={[type.titleCard, { color: colors.navy }]}>What to change</Text>
          {changes.map((text, i) => <CvSuggestionCard key={`c${i}`} jobId={id} index={i} text={text} hasCv={hasCv} />)}
        </View>
      ) : null}

      {gaps.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text style={[type.titleCard, { color: colors.navy }]}>Gaps you may be able to cover</Text>
          {gaps.map((row, i) => (
            <CvSuggestionCard
              key={`g${i}`}
              jobId={id}
              index={i}
              text={row.requirement}
              heading={`${row.requirement} (${row.kind === 'missing' ? 'missing' : 'partial'})`}
              detail={row.detail}
              request={`Show evidence that the candidate meets this requirement, using only what their profile supports: ${row.requirement}. ${row.detail}`.slice(0, 780)}
              hasCv={hasCv}
            />
          ))}
        </View>
      ) : null}

      {nothing ? (
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>We couldn’t split the plan into steps. Open the full report to read it.</Text>
      ) : null}
    </StepScreen>
  );
}
