import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorNotice, Field, LoadingNotice, ScoreFraction, SectionEyebrow } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { visaSummary } from '@/components/WorkRights';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { type } from '@/constants/typography';
import { api, blockedJobSite, isFallbackToPaste, isReadOnPhone, readerSiteName } from '@/lib/api';
import type { JobSummary, WorkRights } from '@/lib/api';
import { MIN_AD_TEXT, readEntry } from '@/lib/jobEntry';

type Colors = ReturnType<typeof useColors>;

function siteName(url: string) {
  const known = readerSiteName(url);
  if (known) return known;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'job';
  }
}

/**
 * One screen to check a job: paste a link or the ad, tap Check this job.
 * Seek and Indeed links open in the in-app reader (app/read-ad.tsx); a
 * LinkedIn link the server is refused falls through to the same reader; an
 * unreadable link asks for the ad's text instead. A file upload is the
 * least-used path, so it's a text link.
 */
export default function SubmitJob() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, profile, profileChecked } = useAuth();
  // Filled in when a job is shared from another app (see ShareIntentHandler).
  const { sharedUrl, sharedText, shareId } = useLocalSearchParams<{ sharedUrl?: string; sharedText?: string; shareId?: string }>();
  const [entry, setEntry] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [seekTitle, setSeekTitle] = useState('');
  const [seekCompany, setSeekCompany] = useState('');
  // Seek/Indeed: by default the ad opens on the phone. Searching for the
  // employer's own copy by title and employer is the fallback.
  const [searchInstead, setSearchInstead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pipeline = useQuery({ queryKey: ['pipeline'], queryFn: api.getPipeline, enabled: !!session });
  const recent = (pipeline.data?.jobs ?? []).slice(0, 3);
  const workRights = (profile?.preferences?.work_rights as WorkRights | undefined) ?? null;

  const read = readEntry(entry);
  const url = read.kind === 'link' ? read.url : '';
  const blockedSite = url ? blockedJobSite(url) : null;
  const withHints = blockedSite !== null && searchInstead;

  // The Evaluate tab stays mounted, so apply every newly received share.
  useEffect(() => {
    if (!shareId || (!sharedUrl && !sharedText)) return;
    setEntry(sharedUrl ?? sharedText ?? '');
    setFile(null);
    setSearchInstead(false);
    setError('');
  }, [shareId, sharedUrl, sharedText]);

  const resetForm = () => {
    setEntry('');
    setFile(null);
    setSeekTitle('');
    setSeekCompany('');
    setSearchInstead(false);
    router.setParams({ sharedUrl: undefined, sharedText: undefined, shareId: undefined });
  };

  const validationMessage = () => {
    if (file) return '';
    if (read.kind === 'empty') return 'Paste a job link or the job ad first.';
    if (read.kind === 'text' && read.text.length < MIN_AD_TEXT) return 'Paste a little more of the job ad so we can check it properly.';
    if (withHints && (!seekTitle.trim() || !seekCompany.trim())) return `Add the job title and employer from the ${blockedSite} ad.`;
    return '';
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) {
      setFile(result.assets[0]);
      setEntry('');
      setError('');
    }
  };

  const pasteFromClipboard = async () => {
    const copied = (await Clipboard.getStringAsync()).trim();
    if (!copied) {
      setError('Your clipboard is empty. Copy the job link or the ad first, then tap Paste again.');
      return;
    }
    setError('');
    setFile(null);
    setEntry(copied);
  };

  const submit = async () => {
    setError('');
    const message = validationMessage();
    if (message) {
      setError(message);
      return;
    }
    if (!file && blockedSite && !searchInstead) {
      router.push({ pathname: '/read-ad', params: { url } });
      return;
    }
    setLoading(true);
    try {
      const result = file
        ? await api.evaluateFile(file.uri, file.name, file.mimeType)
        : read.kind === 'link'
          ? await api.evaluateUrl(url, withHints ? { job_title: seekTitle.trim(), job_company: seekCompany.trim() } : undefined)
          : await api.evaluateText(read.kind === 'text' ? read.text : '');
      resetForm();
      router.push(`/job/${result.job_id}`);
    } catch (submitError) {
      // Checked before the paste fallback: the server sends both, and a phone
      // can read the ad where our server can't.
      if (!file && read.kind === 'link' && isReadOnPhone(submitError)) {
        router.push({ pathname: '/read-ad', params: { url } });
        return;
      }
      if (!file && read.kind === 'link' && isFallbackToPaste(submitError)) {
        setEntry('');
        setError(
          submitError instanceof Error && submitError.message !== 'Something went wrong. Please try again.'
            ? `${submitError.message} Paste the job ad's text into the box above.`
            : 'We couldn’t read that link. Paste the job ad’s text into the box above instead.',
        );
      } else {
        setError(submitError instanceof Error ? submitError.message : 'We could not check that job.');
      }
    } finally {
      setLoading(false);
    }
  };

  const ready = !!file || read.kind !== 'empty';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section="Evaluate" />
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 110, gap: 18 }}
        bottomOffset={80}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 8 }}>
          <SectionEyebrow>Check a job</SectionEyebrow>
          <Text style={[type.headlineLg, { color: colors.navy }]}>Paste a job link or the ad.</Text>
          <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
            LinkedIn, Seek, Indeed or a company site. We’ll check it against your CV in about a minute.
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, gap: 12 }}>
          {file ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="file-text" size={19} color={colors.accentForeground} />
              </View>
              <Text style={[type.bodySemibold, { color: colors.navy, flex: 1 }]} numberOfLines={2}>{file.name}</Text>
              <Pressable onPress={() => setFile(null)} accessibilityRole="button" accessibilityLabel="Remove the file" hitSlop={10} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ) : (
            <Field
              placeholder="https://… or the job ad’s text"
              value={entry}
              onChangeText={(value) => { setEntry(value); setSearchInstead(false); if (error) setError(''); }}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Job link or job ad"
              style={{ minHeight: 96 }}
            />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {!file ? (
              <Pressable onPress={() => void pasteFromClipboard()} accessibilityRole="button" accessibilityLabel="Paste from clipboard" hitSlop={8} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="clipboard" size={16} color={colors.primary} />
                <Text style={[type.bodySemibold, { color: colors.primary }]}>Paste</Text>
              </Pressable>
            ) : <View />}
            <Pressable onPress={() => void pickFile()} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="paperclip" size={15} color={colors.mutedForeground} />
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>{file ? 'Choose a different file' : 'Upload a file instead'}</Text>
            </Pressable>
          </View>
          {!file && read.kind !== 'empty' && <Detected read={read} blockedSite={blockedSite} colors={colors} />}
          {blockedSite && !file && (
            searchInstead ? (
              <View style={{ gap: 10 }}>
                <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>{`Add the title and employer from the ${blockedSite} ad and we’ll look for the employer’s own copy.`}</Text>
                <Field placeholder="Job title, e.g. Fleet Coordinator" value={seekTitle} onChangeText={setSeekTitle} autoCapitalize="words" accessibilityLabel={`Job title from the ${blockedSite} ad`} />
                <Field placeholder="Employer, e.g. NT Health" value={seekCompany} onChangeText={setSeekCompany} autoCapitalize="words" accessibilityLabel={`Employer from the ${blockedSite} ad`} />
                <Pressable onPress={() => setSearchInstead(false)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text style={[type.bodySemibold, { color: colors.primary }]}>Open the ad on my phone instead</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setSearchInstead(true)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[type.bodySemibold, { color: colors.primary }]}>Can’t open it? Search for the employer’s copy</Text>
              </Pressable>
            )
          )}
        </View>

        <CoachNote workRights={workRights} loaded={profileChecked} colors={colors} />

        {loading && (
          <LoadingNotice title="Reading the role…" detail="This can take up to two minutes." steps={[
            { label: 'Reading the posting', estimatedMs: 30000 },
            { label: 'Checking fit and work rights', estimatedMs: 45000 },
            { label: 'Writing your report', estimatedMs: 45000 },
          ]} />
        )}
        {error ? <ErrorNotice message={error} /> : null}
        <Button onPress={() => void submit()} loading={loading} disabled={!ready} icon={blockedSite && !searchInstead && !file ? 'smartphone' : 'check'} style={{ minHeight: 52, borderRadius: 16 }}>
          {blockedSite && !searchInstead && !file ? 'Open the ad' : 'Check this job'}
        </Button>

        {recent.length > 0 && (
          <View style={{ gap: 10, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="clock" size={17} color={colors.teal} />
                <Text style={[type.headlineSm, { color: colors.navy }]}>Recent checks</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)')} accessibilityRole="link" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[type.bodySemibold, { color: colors.primary }]}>View all</Text>
              </Pressable>
            </View>
            {recent.map((job) => <RecentRow key={job.job_id} job={job} colors={colors} />)}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

/** One line under the box saying what we found in it. */
function Detected({ read, blockedSite, colors }: { read: ReturnType<typeof readEntry>; blockedSite: string | null; colors: Colors }) {
  if (read.kind === 'empty') return null;
  const short = read.kind === 'text' && read.text.length < MIN_AD_TEXT;
  const text =
    read.kind === 'link'
      ? blockedSite
        ? `${blockedSite} link. We’ll open the ad here on your phone; when you can see it, tap Use this ad.`
        : `${siteName(read.url)} link`
      : short
        ? 'That looks short for a job ad. Paste the whole ad if you can.'
        : `Job ad text · ${read.text.length.toLocaleString()} characters`;
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <Feather name={short ? 'alert-circle' : read.kind === 'link' && blockedSite ? 'smartphone' : 'check-circle'} size={16} color={short ? colors.warning : colors.success} style={{ marginTop: 3 }} />
      <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{text}</Text>
    </View>
  );
}

// Neutral until the profile has loaded, so saved work rights never read as missing.
function CoachNote({ workRights, loaded, colors }: { workRights: WorkRights | null; loaded: boolean; colors: Colors }) {
  const visa = workRights ? visaSummary(workRights).title : null;
  return (
    <View style={{ backgroundColor: colors.accent, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Feather name="shield" size={18} color={colors.accentForeground} style={{ marginTop: 2 }} />
      <Text style={[type.bodyMd, { color: colors.accentForeground, flex: 1 }]}>
        {visa
          ? `We check it against your CV and your work rights (${visa}).`
          : loaded
            ? 'We check it against your CV. You can set your work rights on the result to see if you can take the job.'
            : 'We check it against your CV and your work rights.'}
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
      <ScoreFraction score={job.score} color={colors.navy} numberStyle={type.bodySemibold} />
    </Pressable>
  );
}
