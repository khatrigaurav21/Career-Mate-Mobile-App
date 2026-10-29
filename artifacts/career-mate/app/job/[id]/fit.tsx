import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { ScoreRing } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// Step 2 of 5: the fit score, big, with one line.
export default function FitStep() {
  const colors = useColors();
  return (
    <JobGate>
      {(job, id) => {
        const score = typeof job.score === 'number' ? job.score : null;
        const line =
          score === null ? 'We’re still processing this role.' : score >= 4 ? 'A strong match worth pursuing.' : score >= 2.8 ? 'There’s a real overlap, with some gaps to work on.' : 'This one is a stretch on your current CV.';
        return (
          <StepScreen
            eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
            title="Your fit score"
            progress={{ step: 2, of: 4 }}
            primary={{ label: 'Next: where you match', onPress: () => router.push(`/job/${id}/match`) }}
          >
            <View style={{ alignItems: 'center', gap: 16, paddingVertical: 12 }}>
              <ScoreRing score={score} size={200} mutedColor={colors.mutedForeground} />
              <Text style={[type.headlineSm, { color: colors.navy, textAlign: 'center' }]}>{line}</Text>
              <Text style={[type.bodyMd, { color: colors.mutedForeground, textAlign: 'center', maxWidth: 300 }]}>
                This is our judgment of your CV against the ad, not a guarantee.
              </Text>
            </View>
          </StepScreen>
        );
      }}
    </JobGate>
  );
}
