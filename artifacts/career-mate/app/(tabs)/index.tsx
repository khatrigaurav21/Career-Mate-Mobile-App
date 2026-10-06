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
import { WorkRightsChip } from '@/components/WorkRights';
import { Button, ErrorNotice, IconButton, ScoreRing, SectionEyebrow, StatusChip } from '@/components/ui';

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
      accessibilityHint="Long press to delete"
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <ScoreRing score={item.score} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text numberOfLines={1} style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 16 }}>{item.title || 'Untitled role'}</Text>
        <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13 }}>{item.company || 'Company not listed'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <StatusChip tone={item.status === 'complete' ? 'success' : 'warning'}>{item.status || 'Processing'}</StatusChip>
          <WorkRightsChip verdict={item.work_rights_verdict} />
        </View>
      </View>
      <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 110, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={pipeline.isRefetching} onRefresh={() => void pipeline.refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 22, marginBottom: 13 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 5 }}>
                <SectionEyebrow>Home</SectionEyebrow>
                <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.9 }}>Your roles</Text>
              </View>
              <IconButton icon="plus" onPress={() => router.push('/submit')} label="Evaluate a job" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <Feather name="briefcase" size={17} color={colors.teal} />
                <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>Recent evaluations</Text>
              </View>
              <StatusChip>{jobs.length}</StatusChip>
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
