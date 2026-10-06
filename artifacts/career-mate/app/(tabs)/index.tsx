import React from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api, JobSummary } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useDeleteJob } from '@/hooks/useDeleteJob';
import type { WorkRightsVerdict } from '@/lib/api';
import { Button, ErrorNotice, IconButton, SectionEyebrow } from '@/components/ui';

export default function Pipeline() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const pipeline = useQuery({ queryKey: ['pipeline'], queryFn: api.getPipeline, enabled: !!session });
  const { confirmDelete } = useDeleteJob();

  const renderJob = ({ item }: { item: JobSummary }) => (
    <Pressable
      onPress={() => router.push(`/job/${item.job_id}`)}
      onLongPress={() => confirmDelete(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title || 'Untitled role'} at ${item.company || 'company not listed'}`}
      accessibilityHint="Long press to delete"
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 17,
        minHeight: 104,
        paddingVertical: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <PipelineScore score={item.score} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text numberOfLines={1} style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 18 }}>{item.title || 'Untitled role'}</Text>
        <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 15 }}>{item.company || 'Company not listed'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
          <JobStatusPill status={item.status} />
          <WorkRightsPill verdict={item.work_rights_verdict} />
        </View>
      </View>
      <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
    </Pressable>
  );

  if (pipeline.isLoading) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}><Text style={{ color: colors.mutedForeground, textAlign: 'center', fontFamily: 'Inter_500Medium' }}>Loading your pipeline…</Text></View>;
  if (pipeline.isError) return <View style={{ flex: 1, backgroundColor: colors.background, padding: 22, justifyContent: 'center' }}><ErrorNotice message={pipeline.error instanceof Error ? pipeline.error.message : 'We could not load your pipeline.'} onRetry={() => void pipeline.refetch()} /></View>;

  const jobs = pipeline.data?.jobs ?? [];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.job_id}
        renderItem={renderJob}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 110, gap: 10 }}
        scrollEnabled={jobs.length > 0}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={pipeline.isRefetching} onRefresh={() => void pipeline.refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 24, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 7 }}>
                <SectionEyebrow>Your pipeline</SectionEyebrow>
                <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 27, lineHeight: 31, letterSpacing: -0.9 }}>Good to see you.</Text>
              </View>
              <IconButton icon="user" onPress={() => router.push('/profile')} label="Open profile" />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Evaluate a job. Check the fit before you apply."
              onPress={() => router.push('/submit')}
              style={({ pressed }) => ({
                minHeight: 86,
                paddingVertical: 15,
                paddingHorizontal: 16,
                borderRadius: 18,
                backgroundColor: colors.inkPanel,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                opacity: pressed ? 0.86 : 1,
              })}
            >
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="briefcase" size={20} color={colors.primaryForeground} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text style={{ color: colors.onNavy, fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 19 }}>Evaluate a job</Text>
                <Text style={{ color: colors.onNavyMuted, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}>Check the fit before you apply</Text>
              </View>
              <Feather name="arrow-up-right" size={21} color={colors.primary} />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 1 }}>
              <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3 }}>Recent evaluations</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>
                {jobs.length} {jobs.length === 1 ? 'role' : 'roles'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20, gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Feather name="compass" size={28} color={colors.teal} /></View>
            <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 20 }}>No evaluations yet</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center' }}>Choose Evaluate when you find a role.</Text>
            <Button onPress={() => router.push('/submit')} icon="plus" style={{ marginTop: 5 }}>Evaluate a job</Button>
          </View>
        }
      />
    </View>
  );
}

function PipelineScore({ score }: { score: number | null }) {
  const colors = useColors();
  const tone = score === null ? colors.mutedForeground : score >= 4 ? colors.success : score >= 2.8 ? colors.warning : colors.primary;
  return (
    <View
      accessible
      accessibilityLabel={score === null ? 'No fit score yet' : `${score.toFixed(1)} out of 5 fit score`}
      style={{ width: 58, height: 58, flexShrink: 0, borderRadius: 29, borderWidth: 3, borderColor: tone, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: tone, fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 21, letterSpacing: -0.5 }}>
        {score === null ? '—' : score.toFixed(1)}
      </Text>
      <Text style={{ position: 'absolute', bottom: 4, color: tone, fontFamily: 'Inter_600SemiBold', fontSize: 8, lineHeight: 10, opacity: 0.78 }}>/5</Text>
    </View>
  );
}

function JobStatusPill({ status }: { status: string }) {
  const value = status?.trim().toLowerCase() || 'processing';
  const colors = useColors();
  const isComplete = value === 'complete';
  const isFailed = value === 'failed' || value === 'error';
  const tone = isComplete
    ? { foreground: colors.success, background: colors.successSoft, icon: 'check' as const }
    : isFailed
      ? { foreground: colors.destructive, background: colors.destructiveSoft, icon: 'alert-circle' as const }
      : { foreground: colors.warning, background: colors.warningSoft, icon: 'clock' as const };
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return <CompactPill label={label} icon={tone.icon} foreground={tone.foreground} background={tone.background} />;
}

function WorkRightsPill({ verdict }: { verdict?: WorkRightsVerdict | null }) {
  const colors = useColors();
  const tone = verdict === 'eligible'
    ? { label: 'Eligible', foreground: colors.success, background: colors.successSoft, icon: 'shield' as const }
    : verdict === 'check'
      ? { label: 'Check details', foreground: colors.warning, background: colors.warningSoft, icon: 'alert-circle' as const }
      : verdict === 'not_eligible'
        ? { label: 'Not eligible', foreground: colors.destructive, background: colors.destructiveSoft, icon: 'x-circle' as const }
        : { label: 'Rights not set', foreground: colors.mutedForeground, background: colors.muted, icon: 'help-circle' as const };
  return <CompactPill label={tone.label} icon={tone.icon} foreground={tone.foreground} background={tone.background} />;
}

function CompactPill({
  label,
  icon,
  foreground,
  background,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  foreground: string;
  background: string;
}) {
  return (
    <View style={{ minHeight: 19, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 99, backgroundColor: background, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Feather name={icon} size={10} color={foreground} />
      <Text numberOfLines={1} style={{ color: foreground, fontFamily: 'Inter_600SemiBold', fontSize: 9, lineHeight: 12 }}>{label}</Text>
    </View>
  );
}
