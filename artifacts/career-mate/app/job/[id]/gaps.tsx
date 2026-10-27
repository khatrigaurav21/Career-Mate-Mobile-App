import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { CvSuggestionCard } from '@/components/CvSuggestionCard';
import { getDocumentUrl } from '@/lib/api';
import { summariseMatch } from '@/lib/reportSummary';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// Step 4 of 5: where you fall short, partial or missing, each with the reason.
export default function GapsStep() {
  const colors = useColors();
  return (
    <JobGate>
      {(job, id) => {
        const { gaps, counts } = summariseMatch(job.report?.B);
        return (
          <StepScreen
            eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
            title="Where you fall short"
            progress={{ step: 4, of: 5 }}
            primary={{ label: 'Next: what to change', onPress: () => router.push(`/job/${id}/changes`) }}
            secondary={{ label: 'Read the full report', onPress: () => router.push(`/job/${id}/details`) }}
          >
            {gaps.length > 0 ? (
              <View style={{ gap: 12 }}>
                {gaps.slice(0, 4).map((row, i) => (
                  <CvSuggestionCard
                    key={i}
                    jobId={id}
                    index={i}
                    text={row.requirement}
                    heading={`${row.requirement} (${row.kind === 'missing' ? 'missing' : 'partial'})`}
                    detail={row.detail}
                    request={`Show evidence that the candidate meets this requirement, using only what their profile supports: ${row.requirement}. ${row.detail}`.slice(0, 780)}
                    hasCv={!!getDocumentUrl(job, 'cv')}
                  />
                ))}
              </View>
            ) : counts.strong > 0 ? (
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>No gaps found against the requirements in this ad.</Text>
            ) : (
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>We couldn’t split this report into gaps. Open the full report to read it.</Text>
            )}
          </StepScreen>
        );
      }}
    </JobGate>
  );
}
