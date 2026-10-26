import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { CvSuggestionCard } from '@/components/CvSuggestionCard';
import { summariseChanges } from '@/lib/reportSummary';
import { getDocumentUrl } from '@/lib/api';
import type { JobDetail } from '@/lib/api';
import { useMarkSeen } from '@/lib/jobProgress';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// Step 5 of 5: what to change before applying, from the report's customization
// plan. Reaching it means the fit steps are done, so it ticks that step.
export default function ChangesStep() {
  return <JobGate>{(job, id) => <ChangesBody job={job} id={id} />}</JobGate>;
}

function ChangesBody({ job, id }: { job: JobDetail; id: string }) {
  const colors = useColors();
  useMarkSeen(id, 'fit');
  const changes = summariseChanges(job.report?.E);
  const hasCv = !!getDocumentUrl(job, 'cv');
  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="What to change"
      progress={{ step: 5, of: 5 }}
      primary={{ label: hasCv ? 'Back to this job' : 'Next: tailor your CV', onPress: () => router.push(hasCv ? `/job/${id}` : `/job/${id}/cv`) }}
      secondary={{ label: 'Read the full report', onPress: () => router.push(`/job/${id}/details`) }}
    >
      {changes.length > 0 ? (
        <View style={{ gap: 12 }}>
          {changes.map((text, i) => <CvSuggestionCard key={i} jobId={id} index={i} text={text} hasCv={hasCv} />)}
        </View>
      ) : (
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>We couldn’t split the plan into steps. Open the full report to read it.</Text>
      )}
    </StepScreen>
  );
}
