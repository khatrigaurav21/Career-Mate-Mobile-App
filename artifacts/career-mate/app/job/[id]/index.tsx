import React from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { getDocumentUrl } from '@/lib/api';
import type { JobDetail, WorkRightsVerdict } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useDeleteJob } from '@/hooks/useDeleteJob';
import { IconButton, Screen } from '@/components/ui';
import { JobGate } from '@/components/JobGate';
import { ApplicationTracker } from '@/components/ApplicationTracker';
import { InterviewPrepCard } from '@/components/InterviewPrep';
import { findAdEmail } from '@/lib/adContact';
import { useJobProgress } from '@/lib/jobProgress';
import { type } from '@/constants/typography';

const VERDICT_LINE: Record<WorkRightsVerdict, string> = {
  eligible: 'You can take this role',
  check: 'Check your visa conditions',
  not_eligible: 'Not allowed on your visa',
  unknown: 'Work rights not set',
};

// The job at a glance: the next thing to do, then one row per part of the
// application. Each row opens its own short screen under /job/[id]/.
export default function JobHub() {
  return <JobGate>{(job, id) => <Hub job={job} id={id} />}</JobGate>;
}

function Hub({ job, id }: { job: JobDetail; id: string }) {
  const colors = useColors();
  const { confirmDelete, isDeleting } = useDeleteJob();
  const cvUrl = getDocumentUrl(job, 'cv');
  const coverUrl = getDocumentUrl(job, 'cover');
  const verdict = (job.work_rights?.verdict ?? job.work_rights_verdict ?? 'unknown') as WorkRightsVerdict;
  const score = typeof job.score === 'number' ? job.score : null;

  // The rows keep their order. Finished steps turn green and the first
  // unfinished one is highlighted; nothing moves.
  const { seen } = useJobProgress(id);
  const done = { verdict: seen.verdict, fit: seen.fit, cv: !!cvUrl, letter: !!coverUrl, questions: seen.questions };
  const order = ['verdict', 'fit', 'cv', 'letter', 'questions'] as const;
  const nextKey = order.find((k) => !done[k]) ?? null;
  const stateOf = (k: (typeof order)[number]): RowState => (done[k] ? 'done' : k === nextKey ? 'next' : 'todo');

  // Offered only when the ad names an address and the visa check hasn't ruled the job out.
  const adEmail = verdict !== 'not_eligible' && findAdEmail(typeof job.raw_description === 'string' ? job.raw_description : null);

  const go = (to: string) => {
    void Haptics.selectionAsync().catch(() => {});
    router.push(to as never);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="arrow-left" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} label="Go back" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon="home" onPress={() => router.replace('/(tabs)')} label="Go to home" />
          {cvUrl ? (
            <IconButton icon="share-2" onPress={() => void Share.share({ title: `${job.title || 'Tailored'} CV`, message: cvUrl, url: cvUrl }).catch(() => {})} label="Share tailored CV" />
          ) : null}
          <IconButton icon="trash-2" onPress={() => { if (!isDeleting) confirmDelete(job, () => router.back()); }} label="Delete job" />
        </View>
      </View>

      <View style={{ gap: 5, padding: 17, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Feather name="briefcase" size={16} color={colors.teal} />
          <Text style={[type.bodySemibold, { color: colors.mutedForeground }]}>{job.company || 'Company not listed'}</Text>
        </View>
        <Text style={[type.headlineLg, { color: colors.navy }]}>{job.title || 'Untitled role'}</Text>
      </View>

      {job.content_url ? <SourceNote url={job.content_url} /> : null}

      <View style={{ gap: 10 }}>
        <HubRow icon="shield" title="Can you take it?" sub={VERDICT_LINE[verdict]} state={stateOf('verdict')} onPress={() => go(`/job/${id}/verdict`)} />
        <HubRow icon="target" title="Your fit" sub={score === null ? 'Still processing' : `${score.toFixed(1)} out of 5. Where you match and fall short`} state={stateOf('fit')} onPress={() => go(`/job/${id}/fit`)} />
        <HubRow icon="file-text" title="Tailored CV" sub={cvUrl ? 'Ready. Edit or download' : 'Not made yet'} state={stateOf('cv')} onPress={() => go(`/job/${id}/cv`)} />
        <HubRow icon="edit-3" title="Cover letter" sub={coverUrl ? 'Ready. Edit or download' : 'Not made yet'} state={stateOf('letter')} onPress={() => go(`/job/${id}/letter`)} />
        <HubRow icon="message-circle" title="Application questions" sub="Paste a question, get an answer" state={stateOf('questions')} onPress={() => go(`/job/${id}/answers`)} />
      </View>

      <InterviewPrepCard job={job} />
      <ApplicationTracker job={job} />

      <HubRow icon="list" title="Full report" sub="Every section of the evaluation" state="todo" onPress={() => go(`/job/${id}/details`)} />
    </Screen>
  );
}

type RowState = 'done' | 'next' | 'todo';

function HubRow({ icon, title, sub, onPress, state }: { icon: keyof typeof Feather.glyphMap; title: string; sub: string; onPress: () => void; state: RowState }) {
  const colors = useColors();
  const done = state === 'done';
  const next = state === 'next';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}${done ? '. Done' : next ? '. Next' : ''}`}
      style={({ pressed }) => ({
        minHeight: 68,
        borderRadius: 18,
        backgroundColor: done ? colors.successSoft : colors.card,
        borderWidth: next ? 2 : 1,
        borderColor: done ? colors.success : next ? colors.primary : colors.border,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: done ? colors.success : next ? colors.primary : colors.muted, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={done ? 'check' : icon} size={19} color={done || next ? colors.primaryForeground : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.titleCard, { color: colors.navy }]}>{title}</Text>
        <Text style={[type.labelCaption, { color: done ? colors.success : colors.mutedForeground }]}>{sub}</Text>
      </View>
      {next ? (
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: colors.primary }}>
          <Text style={[type.labelCaption, { color: colors.primaryForeground, fontFamily: 'PlusJakartaSans_700Bold' }]}>Next</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

// The ad was read from another site (Seek won't let apps read its ads), so say
// which one and let the user check it's the same job.
function SourceNote({ url }: { url: string }) {
  const colors = useColors();
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // keep the raw URL
  }
  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={`Read from ${host}. Opens that page so you can check it's the same job.`}
      style={({ pressed }) => ({ backgroundColor: colors.warningSoft, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, opacity: pressed ? 0.8 : 1 })}
    >
      <Feather name="link" size={16} color={colors.warning} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.warning, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, lineHeight: 22 }}>Read from {host}</Text>
        <Text style={{ color: colors.foreground, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, lineHeight: 24 }}>
          The site you linked doesn’t let apps read its ads, so we used this copy. Tap to check it’s the same job.
        </Text>
      </View>
      <Feather name="external-link" size={16} color={colors.warning} style={{ marginTop: 2 }} />
    </Pressable>
  );
}
