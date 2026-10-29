import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { summariseMatch } from '@/lib/reportSummary';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// Step 3 of 5: where you match. A bar built from the real counts, then the
// strongest matches, each with the evidence from your CV.
export default function MatchStep() {
  const colors = useColors();
  return (
    <JobGate>
      {(job, id) => {
        const { strong, counts } = summariseMatch(job.report?.B);
        const total = counts.strong + counts.partial + counts.missing;
        return (
          <StepScreen
            eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
            title="Where you match"
            progress={{ step: 3, of: 4 }}
            primary={{ label: 'Next: where you fall short', onPress: () => router.push(`/job/${id}/gaps`) }}
            secondary={{ label: 'Read the full report', onPress: () => router.push(`/job/${id}/details`) }}
          >
            {total > 0 ? (
              <View style={{ gap: 8 }} accessibilityLabel={`${counts.strong} strong, ${counts.partial} partial, ${counts.missing} missing`}>
                <View style={{ flexDirection: 'row', gap: 4, height: 14 }}>
                  {counts.strong > 0 ? <View style={{ flex: counts.strong, borderRadius: 7, backgroundColor: colors.success }} /> : null}
                  {counts.partial > 0 ? <View style={{ flex: counts.partial, borderRadius: 7, backgroundColor: colors.warning }} /> : null}
                  {counts.missing > 0 ? <View style={{ flex: counts.missing, borderRadius: 7, backgroundColor: colors.destructive }} /> : null}
                </View>
                <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>
                  {counts.strong} strong · {counts.partial} partial · {counts.missing} missing
                </Text>
              </View>
            ) : null}

            {strong.length > 0 ? (
              <View style={{ gap: 12, padding: 18, borderRadius: 22, backgroundColor: colors.successSoft }}>
                {strong.slice(0, 4).map((row, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                    <Feather name="check" size={18} color={colors.success} style={{ marginTop: 3 }} />
                    <Text style={[type.bodyMd, { flex: 1, color: colors.foreground }]}>
                      <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{row.requirement}. </Text>
                      {row.detail}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
                We couldn’t split this report into matches. Open the full report to read it.
              </Text>
            )}
          </StepScreen>
        );
      }}
    </JobGate>
  );
}
