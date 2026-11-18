import React from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { getDocumentUrl } from '@/lib/api';
import type { JobDetail, WorkRightsVerdict } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useDeleteJob } from '@/hooks/useDeleteJob';
import { Button, IconButton, Screen } from '@/components/ui';
import { JobGate } from '@/components/JobGate';
import { ScoreRing } from '@/components/ScoreRing';
import { ApplicationTracker } from '@/components/ApplicationTracker';
import { InterviewPrepCard } from '@/components/InterviewPrep';
import { findAdEmail } from '@/lib/adContact';
import { type } from '@/constants/typography';

const VERDICT_HEADLINE: Record<WorkRightsVerdict, string> = {
  eligible: 'Yes, you can take this job',
  check: 'Check your visa first',
  not_eligible: 'Not allowed on your visa',
  unknown: 'Set your work rights to check',
};

// The answer first: a big score ring, one line on whether you can take the job,
// and one button for what to do next. Everything else sits below it.
export default function JobResult() {
  return <JobGate>{(job, id) => <Result job={job} id={id} />}</JobGate>;
}

function Result({ job, id }: { job: JobDetail; id: string }) {
  const colors = useColors();
  const { confirmDelete, isDeleting } = useDeleteJob();
  const cvUrl = getDocumentUrl(job, 'cv');
  const coverUrl = getDocumentUrl(job, 'cover');
  const verdict = (job.work_rights?.verdict ?? job.work_rights_verdict ?? 'unknown') as WorkRightsVerdict;
  const score = typeof job.score === 'number' ? job.score : null;
  const applied = job.status !== 'evaluated';

  const ringColor = verdict === 'eligible' ? colors.success : verdict === 'check' ? colors.warning : verdict === 'not_eligible' ? colors.destructive : colors.primary;

  // One button that always moves the application forward.
  const next = !cvUrl
    ? { label: verdict === 'not_eligible' ? 'Start anyway' : 'Start application', to: `/job/${id}/cv` }
    : !coverUrl
      ? { label: 'Continue: cover letter', to: `/job/${id}/letter` }
      : !applied
        ? { label: 'Apply now', to: `/job/${id}/apply` }
        : null;

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

      <View style={{ alignItems: 'center', gap: 6, paddingTop: 4 }}>
        <Text style={[type.bodySemibold, { color: colors.mutedForeground, textAlign: 'center' }]}>{job.company || 'Company not listed'}</Text>
        <Text accessibilityRole="header" style={[type.headlineLg, { color: colors.navy, textAlign: 'center' }]}>{job.title || 'Untitled role'}</Text>
      </View>

      {job.content_url ? <SourceNote url={job.content_url} /> : null}

      <View style={{ alignItems: 'center', gap: 14, paddingVertical: 8 }}>
        <ScoreRing score={score} color={ringColor} />
        <Text style={[type.headlineLg, { color: ringColor, textAlign: 'center' }]}>{VERDICT_HEADLINE[verdict]}</Text>
        {job.work_rights?.summary ? (
          <Text style={[type.bodyMd, { color: colors.mutedForeground, textAlign: 'center', paddingHorizontal: 8 }]}>{job.work_rights.summary}</Text>
        ) : null}
      </View>

      {next ? <Button onPress={() => go(next.to)} icon="arrow-right" style={{ minHeight: 58, borderRadius: 18 }}>{next.label}</Button> : null}

      <View style={{ gap: 10 }}>
        <Row icon="help-circle" title="Why this score" sub="Where you match and where you fall short" onPress={() => go(`/job/${id}/verdict`)} />
        {cvUrl ? <Row icon="file-text" title="Tailored CV" sub="Read it, add to it, download" done onPress={() => go(`/job/${id}/cv`)} /> : null}
        {coverUrl ? <Row icon="edit-3" title="Cover letter" sub="Read it, add to it, download" done onPress={() => go(`/job/${id}/letter`)} /> : null}
        {cvUrl && coverUrl ? <Row icon="send" title="Apply" sub={applied ? 'Marked as applied' : 'Open the application with everything ready'} done={applied} onPress={() => go(`/job/${id}/apply`)} /> : null}
        <Row icon="message-circle" title="Application questions" sub="Paste a question, get an answer" onPress={() => go(`/job/${id}/answers`)} />
        {adEmail ? <Row icon="mail" title="Email in the ad" sub={`Send your application to ${adEmail}`} onPress={() => go(`/job/${id}/email`)} /> : null}
      </View>

      <InterviewPrepCard job={job} />
      <ApplicationTracker job={job} />

      <Row icon="list" title="Full report" sub="Every section of the evaluation" onPress={() => go(`/job/${id}/details`)} />
    </Screen>
  );
}

function Row({ icon, title, sub, onPress, done = false }: { icon: keyof typeof Feather.glyphMap; title: string; sub: string; onPress: () => void; done?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}${done ? '. Done' : ''}`}
      style={({ pressed }) => ({
        minHeight: 64,
        borderRadius: 18,
        backgroundColor: done ? colors.successSoft : colors.card,
        borderWidth: 1,
        borderColor: done ? colors.success : colors.border,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: done ? colors.success : colors.muted, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={done ? 'check' : icon} size={18} color={done ? colors.primaryForeground : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.titleCard, { color: colors.navy }]}>{title}</Text>
        <Text style={[type.labelCaption, { color: done ? colors.success : colors.mutedForeground }]}>{sub}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
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
