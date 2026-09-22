import React from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api, JobSummary } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { Button, ErrorNotice, IconButton, ScoreRing, SectionEyebrow, StatusChip } from '@/components/ui';

export default function Pipeline() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const pipeline = useQuery({ queryKey: ['pipeline'], queryFn: api.getPipeline, enabled: !!session });

  const renderJob = ({ item }: { item: JobSummary }) => (
    <Pressable
      onPress={() => router.push(`/job/${item.job_id}`)}
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
        <StatusChip tone={item.status === 'complete' ? 'success' : 'warning'}>{item.status || 'Processing'}</StatusChip>
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
          <View style={{ gap: 19, marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 5 }}>
                <SectionEyebrow>Your pipeline</SectionEyebrow>
                <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.9 }}>Good to see you.</Text>
              </View>
              <IconButton icon="user" onPress={() => router.push('/profile')} label="Open profile" />
            </View>
            <View style={{ backgroundColor: colors.navy, borderRadius: 22, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Feather name="target" size={21} color={colors.primaryForeground} /></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: colors.onNavy, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Have a role in mind?</Text>
                <Text style={{ color: colors.onNavyMuted, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>See how well it fits before you spend time applying.</Text>
              </View>
              <Pressable onPress={() => router.push('/submit')} hitSlop={8}><Feather name="arrow-up-right" size={22} color={colors.primary} /></Pressable>
            </View>
            {jobs.length > 0 && <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{jobs.length} {jobs.length === 1 ? 'opportunity' : 'opportunities'} evaluated</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 56, paddingHorizontal: 20, gap: 15 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Feather name="compass" size={28} color={colors.teal} /></View>
            <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 20 }}>Your next move starts here</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center' }}>Evaluate a job posting to see your fit, sharpen your positioning, and prepare your application.</Text>
            <Button onPress={() => router.push('/submit')} icon="plus" style={{ marginTop: 5 }}>Evaluate a job</Button>
          </View>
        }
      />
    </View>
  );
}
