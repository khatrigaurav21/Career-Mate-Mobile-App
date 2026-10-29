import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { CvSuggestionCard } from '@/components/CvSuggestionCard';
import { summariseChanges, summariseMatch } from '@/lib/reportSummary';
import { getDocumentUrl } from '@/lib/api';
import type { JobDetail } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// Opens straight after the cover letter is made (from=letter): lines you can add
// to it so it speaks to this job. An achievement goes in the list; a gap becomes
// one confident bridge sentence. Each card shows the line first, and nothing is
// saved until you confirm. The letter has to stay on one page.
export default function LetterStrongerStep() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return <JobGate>{(job, id) => <LetterStrongerBody job={job} id={id} afterLetter={from === 'letter'} />}</JobGate>;
}

function LetterStrongerBody({ job, id, afterLetter }: { job: JobDetail; id: string; afterLetter: boolean }) {
  const colors = useColors();
  const gaps = summariseMatch(job.report?.B).gaps.slice(0, 3);
  const ideas = summariseChanges(job.report?.E).slice(0, 3);
  const hasLetter = !!getDocumentUrl(job, 'cover');
  const nothing = gaps.length === 0 && ideas.length === 0;

  const primary = !hasLetter
    ? { label: 'Write my letter', onPress: () => router.push(`/job/${id}/letter`) }
    : afterLetter
      ? { label: 'Next: apply', onPress: () => router.push(`/job/${id}/apply`) }
      : { label: 'Back to this job', onPress: () => router.replace(`/job/${id}`) };

  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Make your letter stronger"
      primary={primary}
      secondary={hasLetter ? { label: 'Edit the letter myself', onPress: () => router.push(`/letter/${id}`) } : undefined}
    >
      {hasLetter ? (
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
          Your letter is ready. Add any of these so it speaks to this job. It has to stay on one page, so pick the ones that matter most.
        </Text>
      ) : null}

      {gaps.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text style={[type.titleCard, { color: colors.navy }]}>Show you can do this</Text>
          {gaps.map((row, i) => (
            <CvSuggestionCard
              key={`g${i}`}
              jobId={id}
              index={i}
              document="letter"
              text={row.requirement}
              heading={`${row.requirement} (${row.kind === 'missing' ? 'missing' : 'partial'})`}
              detail={row.detail}
              request={`Add a line to the cover letter that connects the candidate's real experience to this requirement, using only what their profile supports: ${row.requirement}. ${row.detail}`.slice(0, 780)}
              hasDocument={hasLetter}
            />
          ))}
        </View>
      ) : null}

      {ideas.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text style={[type.titleCard, { color: colors.navy }]}>Ideas from your evaluation</Text>
          {ideas.map((text, i) => (
            <CvSuggestionCard key={`i${i}`} jobId={id} index={i} document="letter" text={text} hasDocument={hasLetter} />
          ))}
        </View>
      ) : null}

      {nothing ? (
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Nothing to add. Your letter already covers what this ad asks for.</Text>
      ) : null}
    </StepScreen>
  );
}
