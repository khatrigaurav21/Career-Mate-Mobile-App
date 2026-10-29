import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { StatusChip } from '@/components/ui';
import { summariseMatch } from '@/lib/reportSummary';
import { useMarkSeen } from '@/lib/jobProgress';
import type { JobDetail } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// Step 4 of 4: where you fall short, partial or missing, each with the reason.
// Read-only: fixes are offered once the CV exists, on the screen that opens
// right after it is made. Reaching this step means the fit steps are done.
export default function GapsStep() {
  return <JobGate>{(job, id) => <GapsBody job={job} id={id} />}</JobGate>;
}

function GapsBody({ job, id }: { job: JobDetail; id: string }) {
  const colors = useColors();
  useMarkSeen(id, 'fit');
  const { gaps, counts } = summariseMatch(job.report?.B);
  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Where you fall short"
      progress={{ step: 4, of: 4 }}
      primary={{ label: 'Next: your CV', onPress: () => router.push(`/job/${id}/cv`) }}
      secondary={{ label: 'Read the full report', onPress: () => router.push(`/job/${id}/details`) }}
    >
      {gaps.length > 0 ? (
        <View style={{ gap: 14, padding: 18, borderRadius: 22, backgroundColor: colors.warningSoft }}>
          {gaps.slice(0, 4).map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <Feather name="alert-circle" size={18} color={colors.warning} style={{ marginTop: 3 }} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[type.bodySemibold, { color: colors.foreground }]}>{row.requirement}</Text>
                  <StatusChip tone={row.kind === 'missing' ? 'warning' : 'neutral'}>{row.kind === 'missing' ? 'Missing' : 'Partial'}</StatusChip>
                </View>
                <Text style={[type.bodyMd, { color: colors.foreground }]}>{row.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : counts.strong > 0 ? (
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>No gaps found against the requirements in this ad.</Text>
      ) : (
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>We couldn’t split this report into gaps. Open the full report to read it.</Text>
      )}
      {gaps.length > 0 ? (
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Once your CV is made, we’ll show what you can add to cover these.</Text>
      ) : null}
    </StepScreen>
  );
}
