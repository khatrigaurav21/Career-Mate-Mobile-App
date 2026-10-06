import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Button, ErrorNotice, Field, LoadingNotice, Screen, SectionEyebrow } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { VISA_SUMMARY } from '@/components/WorkRights';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { type } from '@/constants/typography';
import { api, isFallbackToPaste } from '@/lib/api';
import type { JobSummary, WorkRights } from '@/lib/api';

type SubmitMode = 'link' | 'paste' | 'file';
type Colors = ReturnType<typeof useColors>;

const MODES: { mode: SubmitMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { mode: 'link', label: 'Link', icon: 'link' },
  { mode: 'paste', label: 'Paste text', icon: 'file-text' },
  { mode: 'file', label: 'Upload', icon: 'upload' },
];

export default function SubmitJob() {
  const colors = useColors();
  const { session, profile } = useAuth();
  // Filled in when a job is shared from another app (see ShareIntentHandler).
  const { sharedUrl, sharedText, shareId } = useLocalSearchParams<{ sharedUrl?: string; sharedText?: string; shareId?: string }>();
  const [fromShare, setFromShare] = useState(false);
  const [mode, setMode] = useState<SubmitMode>('link');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pipeline = useQuery({ queryKey: ['pipeline'], queryFn: api.getPipeline, enabled: !!session });
  const recent = (pipeline.data?.jobs ?? []).slice(0, 3);
  const workRights = (profile?.preferences?.work_rights as WorkRights | undefined) ?? null;

  // This screen is a tab, so it stays mounted: apply each new share when it
  // arrives rather than only on first render.
  useEffect(() => {
    if (!shareId || (!sharedUrl && !sharedText)) return;
    setMode(sharedUrl ? 'link' : 'paste');
    setUrl(sharedUrl ?? '');
    setDescription(sharedUrl ? '' : sharedText ?? '');
    setFile(null);
    setError('');
    setFromShare(true);
  }, [shareId, sharedUrl, sharedText]);

  const resetForm = () => {
    setUrl('');
    setDescription('');
    setFile(null);
    setFromShare(false);
    router.setParams({ sharedUrl: undefined, sharedText: undefined, shareId: undefined });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const pasteFromClipboard = async () => {
    const copied = (await Clipboard.getStringAsync()).trim();
    if (!copied) {
      setError('Your clipboard is empty. Copy the job link or description first, then tap Paste again.');
      return;
    }
    setError('');
    if (mode === 'link') setUrl(copied);
    else setDescription(copied);
  };

  const submit = async () => {
    setError('');
    if (mode === 'link' && !url.trim()) return setError('Paste the job posting link first.');
    if (mode === 'paste' && description.trim().length < 80) return setError('Paste a little more of the job description so we can evaluate it.');
    if (mode === 'file' && !file) return setError('Choose the job description file first.');
    setLoading(true);
    try {
      const result = mode === 'link'
        ? await api.evaluateUrl(url.trim())
        : mode === 'paste'
          ? await api.evaluateText(description.trim())
          : await api.evaluateFile(file!.uri, file!.name, file!.mimeType);
      resetForm();
      router.push(`/job/${result.job_id}`);
    } catch (submitError) {
      if (isFallbackToPaste(submitError)) {
        setMode('paste');
        // The server says why (e.g. "Seek doesn't let apps read its job ads…").
        setError(submitError instanceof Error && submitError.message !== 'Something went wrong. Please try again.'
          ? submitError.message
          : 'We could not read that posting. Paste the job description instead and we’ll continue.');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'We could not evaluate that job.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section="Evaluate" />
      <Screen topInset={false}>
        <View style={{ gap: 4 }}>
          <SectionEyebrow>Role evaluation</SectionEyebrow>
          <Text style={[type.headlineLg, { color: colors.navy }]}>Evaluate a role</Text>
          <Text style={[type.bodyLg, { color: colors.mutedForeground }]}>Add a job and we’ll check your fit and your work rights.</Text>
        </View>

        {fromShare && (
          <View style={{ backgroundColor: colors.accent, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Feather name="share" size={18} color={colors.accentForeground} />
            <Text style={[type.bodySemibold, { color: colors.accentForeground, flex: 1 }]}>Shared job loaded. Check it, then run the evaluation.</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', backgroundColor: colors.muted, borderRadius: 18, padding: 4 }} accessibilityRole="tablist">
          {MODES.map((m) => {
            const selected = mode === m.mode;
            return (
              <Pressable
                key={m.mode}
                onPress={() => { setMode(m.mode); setError(''); }}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={{ flex: 1, minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: selected ? colors.card : 'transparent' }}
              >
                <Feather name={m.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                <Text style={[type.bodySemibold, { color: selected ? colors.navy : colors.mutedForeground }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 12 }}>
          {mode !== 'file' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[type.bodySemibold, { color: colors.navy }]}>{mode === 'link' ? 'Job post link' : 'Job description'}</Text>
              <Pressable onPress={() => void pasteFromClipboard()} accessibilityRole="button" accessibilityLabel="Paste from clipboard" hitSlop={8} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="clipboard" size={16} color={colors.primary} />
                <Text style={[type.bodySemibold, { color: colors.primary }]}>Paste</Text>
              </Pressable>
            </View>
          )}
          {mode === 'link' && (
            <>
              <Field placeholder="https://www.linkedin.com/jobs/view/…" value={url} onChangeText={setUrl} keyboardType="url" autoCapitalize="none" autoCorrect={false} accessibilityLabel="Job post link" />
              <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Works with LinkedIn and most company career sites. Seek blocks automated reading, so for Seek ads copy the description and use Paste text.</Text>
            </>
          )}
          {mode === 'paste' && (
            <Field placeholder="Paste the full job posting here…" value={description} onChangeText={setDescription} multiline accessibilityLabel="Job description" />
          )}
          {mode === 'file' && (
            <View style={{ gap: 10 }}>
              <Text style={[type.bodySemibold, { color: colors.navy }]}>Upload a job post</Text>
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>PDF, DOCX or text, up to 5 MB.</Text>
              <Button onPress={pickFile} variant="secondary" icon="paperclip">{file ? 'Choose a different file' : 'Choose job file'}</Button>
              {file && <Text style={[type.bodySemibold, { color: colors.teal }]}>{file.name}</Text>}
            </View>
          )}
          <CoachNote workRights={workRights} colors={colors} />
        </View>

        {loading && (
          <LoadingNotice
            title="Reading the role…"
            detail="This can take up to two minutes."
            steps={[
              { label: 'Reading the posting', estimatedMs: 30000 },
              { label: 'Checking fit and work rights', estimatedMs: 45000 },
              { label: 'Writing your report', estimatedMs: 45000 },
            ]}
          />
        )}
        {error ? <ErrorNotice message={error} /> : null}
        <View style={{ gap: 8 }}>
          <Button onPress={submit} loading={loading} icon="arrow-right">Run evaluation</Button>
          <Text style={[type.labelCaption, { color: colors.mutedForeground, textAlign: 'center' }]}>Visa checks are guidance only, not legal advice.</Text>
        </View>

        {recent.length > 0 && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="clock" size={17} color={colors.teal} />
                <Text style={[type.headlineSm, { color: colors.navy }]}>Recent assessments</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)')} accessibilityRole="link" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[type.bodySemibold, { color: colors.primary }]}>View all</Text>
              </Pressable>
            </View>
            {recent.map((job) => <RecentRow key={job.job_id} job={job} colors={colors} />)}
          </View>
        )}
      </Screen>
    </View>
  );
}

function CoachNote({ workRights, colors }: { workRights: WorkRights | null; colors: Colors }) {
  const visa = workRights ? VISA_SUMMARY[workRights.status].title : null;
  return (
    <View style={{ backgroundColor: colors.accent, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10 }}>
      <Feather name="compass" size={18} color={colors.accentForeground} style={{ marginTop: 2 }} />
      <Text style={[type.bodyMd, { color: colors.accentForeground, flex: 1 }]}>
        {visa ? (
          <>We’ll check the role’s location and requirements against your <Text style={{ fontFamily: 'Inter_700Bold' }}>{visa}</Text>, compare it with your CV, and score your fit.</>
        ) : (
          <>We’ll compare the role with your CV and score your fit. <Text style={{ fontFamily: 'Inter_700Bold' }}>Set your work rights in Profile</Text> to get a visa check too.</>
        )}
      </Text>
    </View>
  );
}

function RecentRow({ job, colors }: { job: JobSummary; colors: Colors }) {
  const verdict = job.work_rights_verdict;
  const icon: keyof typeof Feather.glyphMap = verdict === 'not_eligible' ? 'x-circle' : verdict === 'check' ? 'alert-triangle' : verdict === 'eligible' ? 'check-circle' : 'file-text';
  const fg = verdict === 'not_eligible' ? colors.destructive : verdict === 'check' ? colors.warning : verdict === 'eligible' ? colors.success : colors.mutedForeground;
  const bg = verdict === 'not_eligible' ? colors.destructiveSoft : verdict === 'check' ? colors.warningSoft : verdict === 'eligible' ? colors.successSoft : colors.muted;
  return (
    <Pressable
      onPress={() => router.push(`/job/${job.job_id}`)}
      accessibilityRole="button"
      style={({ pressed }) => ({ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={18} color={fg} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={[type.bodySemibold, { color: colors.navy }]}>{job.title || 'Untitled role'}</Text>
        <Text numberOfLines={1} style={[type.labelCaption, { color: colors.mutedForeground }]}>{job.company || 'Company not listed'}</Text>
      </View>
      <Text style={[type.bodySemibold, { color: colors.navy }]}>
        {job.score === null ? '—' : job.score.toFixed(1)}
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}> /5</Text>
      </Text>
    </Pressable>
  );
}
