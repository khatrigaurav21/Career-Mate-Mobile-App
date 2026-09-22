import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { api, getDocumentUrl } from '@/lib/api';
import { reportLabels } from '@/lib/config';
import { useColors } from '@/hooks/useColors';
import { ErrorNotice, IconButton, LoadingState, ScoreRing, Screen, StatusChip, WarningList } from '@/components/ui';

function renderReportText(text: string, colors: ReturnType<typeof useColors>) {
  return text.split('\n').filter(Boolean).map((line, index) => {
    const isBullet = /^[-*•]/.test(line.trim());
    const isTable = line.includes('|');
    return (
      <Text key={`${line}-${index}`} style={{ color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, marginBottom: 7, paddingLeft: isBullet ? 4 : 0 }}>
        {isBullet ? `• ${line.replace(/^[-*•]\s*/, '')}` : isTable ? line.replace(/\|/g, '  ·  ') : line}
      </Text>
    );
  });
}

export default function JobDetail() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [openSection, setOpenSection] = useState('A');
  const job = useQuery({ queryKey: ['job', id], queryFn: () => api.getJob(id), enabled: !!id });
  const cvMutation = useMutation({ mutationFn: () => api.generateCv(id) });
  const coverMutation = useMutation({ mutationFn: () => api.generateCoverLetter(id) });

  if (job.isLoading) return <Screen scroll={false}><LoadingState title="Opening your evaluation" detail="Gathering the role match and recommendations." /></Screen>;
  if (job.isError || !job.data) return <Screen><IconButton icon="arrow-left" onPress={() => router.back()} label="Go back" /><ErrorNotice message={job.error instanceof Error ? job.error.message : 'We could not load this evaluation.'} onRetry={() => void job.refetch()} /></Screen>;

  const data = job.data;
  const cvUrl = cvMutation.data?.pdf_url ?? getDocumentUrl(data, 'cv');
  const coverUrl = coverMutation.data?.pdf_url ?? getDocumentUrl(data, 'cover');
  const reportEntries = Object.entries(data.report ?? {}).filter(([, value]) => typeof value === 'string');

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="arrow-left" onPress={() => router.back()} label="Go back" />
        <IconButton icon="share-2" onPress={() => { if (cvUrl) void Linking.openURL(cvUrl); }} label="Open document" />
      </View>
      <View style={{ gap: 5 }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{data.company || 'Company not listed'}</Text>
        <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 35, letterSpacing: -0.8 }}>{data.title || 'Untitled role'}</Text>
      </View>
      <View style={{ borderRadius: 24, backgroundColor: colors.navy, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <ScoreRing score={data.score} size={92} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ color: colors.onNavy, fontFamily: 'Inter_700Bold', fontSize: 18 }}>Your fit score</Text>
          <Text style={{ color: colors.onNavyMuted, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}>{data.score === null ? 'We’re still processing this role.' : data.score >= 4 ? 'A strong match worth pursuing.' : data.score >= 2.8 ? 'There’s potential with the right positioning.' : 'Read the trade-offs before deciding.'}</Text>
        </View>
      </View>
      <View style={{ gap: 11 }}>
        <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 19 }}>Application documents</Text>
        <DocumentAction title="Tailored CV" description={cvUrl ? 'Ready to view or download' : 'Generate a role-specific version'} icon="file-text" url={cvUrl} loading={cvMutation.isPending} onPress={() => cvUrl ? void Linking.openURL(cvUrl) : cvMutation.mutate()} />
        {cvMutation.data && <WarningList warnings={cvMutation.data.warnings} />}
        <DocumentAction title="Cover letter" description={coverUrl ? 'Ready to view or download' : 'Generate a focused first draft'} icon="edit-3" url={coverUrl} loading={coverMutation.isPending} onPress={() => coverUrl ? void Linking.openURL(coverUrl) : coverMutation.mutate()} />
        {coverMutation.data && <WarningList warnings={coverMutation.data.warnings} />}
        {(cvMutation.isError || coverMutation.isError) && <ErrorNotice message="We couldn’t generate that document. You can try again." />}
      </View>
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 19 }}>Your evaluation</Text>
        {reportEntries.map(([key, value]) => {
          const open = openSection === key;
          return (
            <View key={key} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 17, backgroundColor: colors.card, overflow: 'hidden' }}>
              <Pressable onPress={() => setOpenSection(open ? '' : key)} style={{ minHeight: 57, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                  <View style={{ width: 27, height: 27, borderRadius: 9, backgroundColor: open ? colors.primary : colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: open ? colors.primaryForeground : colors.accentForeground, fontFamily: 'Inter_700Bold', fontSize: 12 }}>{key}</Text>
                  </View>
                  <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{reportLabels[key] ?? `Section ${key}`}</Text>
                </View>
                <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
              </Pressable>
              {open && <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 }}>{renderReportText(value, colors)}</View>}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

function DocumentAction({ title, description, icon, url, loading, onPress }: { title: string; description: string; icon: keyof typeof Feather.glyphMap; url: string | null; loading: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.72 : 1 })}>
      <View style={{ width: 41, height: 41, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Feather name={icon} size={19} color={colors.teal} /></View>
      <View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{title}</Text><Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 }}>{description}</Text></View>
      {loading ? <ActivityIndicator color={colors.primary} /> : <StatusChip tone={url ? 'success' : 'neutral'}>{url ? 'Ready' : 'Create'}</StatusChip>}
    </Pressable>
  );
}