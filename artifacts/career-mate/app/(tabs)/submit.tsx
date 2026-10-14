import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorNotice, Field, LoadingNotice, SectionEyebrow } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { visaSummary } from '@/components/WorkRights';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { type } from '@/constants/typography';
import { api, blockedJobSite, isFallbackToPaste, isReadOnPhone } from '@/lib/api';
import type { JobSummary, WorkRights } from '@/lib/api';

type SubmitMode = 'link' | 'paste' | 'file';
type Step = 1 | 2 | 3;
type Colors = ReturnType<typeof useColors>;

const MODES: { mode: SubmitMode; label: string; caption: string; icon: keyof typeof Feather.glyphMap }[] = [
  { mode: 'link', label: 'Link', caption: 'Job posting', icon: 'link' },
  { mode: 'paste', label: 'Paste', caption: 'Job details', icon: 'file-text' },
  { mode: 'file', label: 'Upload', caption: 'PDF or DOCX', icon: 'upload' },
];

export default function SubmitJob() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  // Filled in when a job is shared from another app (see ShareIntentHandler).
  const { sharedUrl, sharedText, shareId } = useLocalSearchParams<{ sharedUrl?: string; sharedText?: string; shareId?: string }>();
  const [fromShare, setFromShare] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<SubmitMode>('link');
  const [url, setUrl] = useState('');
  const [seekTitle, setSeekTitle] = useState('');
  const [seekCompany, setSeekCompany] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pipeline = useQuery({ queryKey: ['pipeline'], queryFn: api.getPipeline, enabled: !!session });
  const recent = (pipeline.data?.jobs ?? []).slice(0, 3);
  const workRights = (profile?.preferences?.work_rights as WorkRights | undefined) ?? null;
  // Seek or Indeed: they block automated reading, so we ask for the title and
  // employer and look for the employer's own copy.
  const blockedSite = mode === 'link' ? blockedJobSite(url) : null;
  const seekLink = blockedSite !== null;
  // Seek/Indeed: by default the ad is opened on the phone (app/read-ad.tsx)
  // and read from there. Searching for the employer's copy by title and
  // employer is the fallback for when the ad won't open.
  const [searchInstead, setSearchInstead] = useState(false);
  const withHints = seekLink && searchInstead;

  // The Evaluate tab stays mounted, so apply every newly received share.
  useEffect(() => {
    if (!shareId || (!sharedUrl && !sharedText)) return;
    setMode(sharedUrl ? 'link' : 'paste');
    setUrl(sharedUrl ?? '');
    setDescription(sharedUrl ? '' : sharedText ?? '');
    setFile(null);
    setError('');
    setFromShare(true);
    setStep(2);
  }, [shareId, sharedUrl, sharedText]);

  const resetForm = () => {
    setUrl('');
    setSeekTitle('');
    setSeekCompany('');
    setSearchInstead(false);
    setDescription('');
    setFile(null);
    setFromShare(false);
    setStep(1);
    router.setParams({ sharedUrl: undefined, sharedText: undefined, shareId: undefined });
  };

  const validationMessage = () => {
    if (mode === 'link' && !url.trim()) return 'Paste the job posting link first.';
    if (withHints && (!seekTitle.trim() || !seekCompany.trim())) {
      return `Add the job title and employer from the ${blockedSite} ad, or use Paste text instead.`;
    }
    if (mode === 'paste' && description.trim().length < 80) return 'Paste a little more of the job description so we can evaluate it.';
    if (mode === 'file' && !file) return 'Choose the job description file first.';
    return '';
  };

  const continueStep = () => {
    setError('');
    if (step === 1) {
      setStep(2);
      return;
    }
    const message = validationMessage();
    if (message) {
      setError(message);
      return;
    }
    setStep(3);
  };

  const goBack = () => {
    setError('');
    if (step === 1) {
      router.push('/(tabs)');
      return;
    }
    setStep((step - 1) as Step);
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
    const message = validationMessage();
    if (message) {
      setError(message);
      setStep(2);
      return;
    }
    if (seekLink && !searchInstead) {
      router.push({ pathname: '/read-ad', params: { url: url.trim() } });
      return;
    }
    setLoading(true);
    try {
      const result = mode === 'link'
        ? await api.evaluateUrl(url.trim(), withHints ? { job_title: seekTitle.trim(), job_company: seekCompany.trim() } : undefined)
        : mode === 'paste'
          ? await api.evaluateText(description.trim())
          : await api.evaluateFile(file!.uri, file!.name, file!.mimeType);
      resetForm();
      router.push(`/job/${result.job_id}`);
    } catch (submitError) {
      // Checked before the paste fallback: the server sends both, and a phone
      // can read the ad where our server can't.
      if (mode === 'link' && isReadOnPhone(submitError)) {
        router.push({ pathname: '/read-ad', params: { url: url.trim() } });
        return;
      }
      if (isFallbackToPaste(submitError)) {
        setMode('paste');
        setStep(2);
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
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 110, gap: 20 }}
        bottomOffset={80}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={step === 1 ? 'Go to Home' : 'Go to previous step'}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 44, height: 44, borderRadius: 22, borderWidth: 1,
              borderColor: colors.border, backgroundColor: colors.card,
              alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1,
            })}
          >
            <Feather name={step === 1 ? 'home' : 'arrow-left'} size={18} color={colors.navy} />
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[type.labelEyebrow, { color: colors.mutedForeground }]}>Your role check</Text>
            <Text style={[type.labelEyebrow, { color: colors.navy }]}>Step {step} of 3</Text>
          </View>
          <View accessibilityLabel={`Step ${step} of 3`} style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={{
                height: 4, flex: 1, borderRadius: 99,
                backgroundColor: item === step ? colors.primary : item < step ? colors.secondary : colors.border,
              }} />
            ))}
          </View>
        </View>

        {step === 1 && (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 8 }}>
              <SectionEyebrow>First, choose a starting point</SectionEyebrow>
              <Text style={[type.headlineLg, { color: colors.navy }]}>How would you like to add the role?</Text>
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Pick the option that’s easiest. You can review everything before we check it.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {MODES.map((item) => (
                <ModeCard key={item.mode} mode={item} selected={mode === item.mode} colors={colors} onPress={() => { setMode(item.mode); setError(''); }} />
              ))}
            </View>
            <GuidanceCard
              colors={colors}
              icon="shield"
              text={workRights ? 'We’ll compare the role with your CV and work rights.' : 'We’ll compare the role with your CV. Add work rights in Profile for a visa-fit check.'}
            />
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 8 }}>
              <SectionEyebrow>{mode === 'link' ? 'Add the listing link' : mode === 'paste' ? 'Add the role details' : 'Choose a job file'}</SectionEyebrow>
              <Text style={[type.headlineLg, { color: colors.navy }]}>
                {mode === 'link' ? 'Where can we find the role?' : mode === 'paste' ? 'Paste the job description.' : 'Upload the job posting.'}
              </Text>
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
                {mode === 'link' ? 'We’ll read the listing and check it against your profile.' : mode === 'paste' ? 'A little context helps us give you a more useful fit check.' : 'Choose a PDF, DOCX or text file, up to 5 MB.'}
              </Text>
            </View>

            {fromShare && <GuidanceCard colors={colors} icon="share" text="Shared job loaded. Check the details, then review before we run the evaluation." />}

            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 18, gap: 16 }}>
              {mode === 'link' && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text style={[type.bodySemibold, { color: colors.navy }]}>Job posting link</Text>
                    <ClipboardButton label="Paste job link from clipboard" onPress={() => void pasteFromClipboard()} colors={colors} />
                  </View>
                  <Field placeholder="https://…" value={url} onChangeText={setUrl} keyboardType="url" autoCapitalize="none" autoCorrect={false} accessibilityLabel="Job post link" />
                  {seekLink ? (
                    <View style={{ gap: 12, marginTop: 4 }}>
                      {!searchInstead ? (
                        <>
                          <GuidanceCard colors={colors} icon="smartphone" text={`${blockedSite} doesn’t let apps read its ads from a server, so we’ll open the ad here on your phone. When you can see it, tap Use this ad.`} />
                          <Pressable onPress={() => setSearchInstead(true)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                            <Text style={[type.bodySemibold, { color: colors.primary }]}>Can’t open it? Search for the employer’s copy instead</Text>
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <GuidanceCard colors={colors} icon="search" text={`Add the title and employer from the ${blockedSite} ad and we’ll look for the employer’s own copy.`} />
                          <Text style={[type.bodySemibold, { color: colors.navy }]}>{`Job title from the ${blockedSite} ad`}</Text>
                          <Field placeholder="e.g. Fleet Coordinator" value={seekTitle} onChangeText={setSeekTitle} autoCapitalize="words" accessibilityLabel={`Job title from the ${blockedSite} ad`} />
                          <Text style={[type.bodySemibold, { color: colors.navy }]}>Employer</Text>
                          <Field placeholder="e.g. NT Health" value={seekCompany} onChangeText={setSeekCompany} autoCapitalize="words" accessibilityLabel={`Employer from the ${blockedSite} ad`} />
                          <Pressable onPress={() => setSearchInstead(false)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
                            <Text style={[type.bodySemibold, { color: colors.primary }]}>Open the ad on my phone instead</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  ) : (
                    <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Works with LinkedIn, company career sites, Seek and Indeed.</Text>
                  )}
                </View>
              )}
              {mode === 'paste' && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text style={[type.bodySemibold, { color: colors.navy }]}>Job description</Text>
                    <ClipboardButton label="Paste job description from clipboard" onPress={() => void pasteFromClipboard()} colors={colors} />
                  </View>
                  <Field placeholder="Paste the job listing, including responsibilities and requirements…" value={description} onChangeText={setDescription} multiline accessibilityLabel="Job description" />
                  <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Include at least 80 characters. A short summary is a good start.</Text>
                </View>
              )}
              {mode === 'file' && (
                <View style={{ gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="file-text" size={21} color={colors.accentForeground} />
                  </View>
                  <Text style={[type.bodySemibold, { color: colors.navy }]}>Job posting file</Text>
                  <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>PDF, DOCX or text, up to 5 MB.</Text>
                  <Button onPress={pickFile} variant="secondary" icon="paperclip">{file ? 'Choose a different file' : 'Choose job file'}</Button>
                  {file && <Text style={[type.bodySemibold, { color: colors.teal }]} numberOfLines={2}>{file.name}</Text>}
                </View>
              )}
            </View>

            <CoachNote workRights={workRights} colors={colors} />
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 8 }}>
              <SectionEyebrow>Ready for a quick check</SectionEyebrow>
              <Text style={[type.headlineLg, { color: colors.navy }]}>Review before we begin.</Text>
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Make sure we have the right role. You can go back and change anything.</Text>
            </View>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 18 }}>
              <SummaryRow label="Added by" value={MODES.find((item) => item.mode === mode)?.label ?? 'Job listing'} colors={colors} />
              {mode === 'link' && (
                <>
                  <SummaryRow label="Job posting" value={url.trim()} colors={colors} />
                  {withHints && <SummaryRow label="Role" value={`${seekTitle.trim()} · ${seekCompany.trim()}`} colors={colors} />}
                  {seekLink && !searchInstead && <SummaryRow label="Next" value="We’ll open the ad on your phone. Tap Use this ad when you can see it." colors={colors} />}
                </>
              )}
              {mode === 'paste' && <SummaryRow label="Job details" value={`${description.trim().length} characters added`} colors={colors} />}
              {mode === 'file' && <SummaryRow label="Job file" value={file?.name ?? 'No file selected'} colors={colors} />}
            </View>
            <GuidanceCard colors={colors} icon="help-circle" text="We’ll compare the listing with your profile. This is guidance, not a hiring decision or legal advice." />
          </View>
        )}

        {loading && (
          <LoadingNotice title="Reading the role…" detail="This can take up to two minutes." steps={[
            { label: 'Reading the posting', estimatedMs: 30000 },
            { label: 'Checking fit and work rights', estimatedMs: 45000 },
            { label: 'Writing your report', estimatedMs: 45000 },
          ]} />
        )}
        {error ? <ErrorNotice message={error} /> : null}
        <Button onPress={step === 3 ? submit : continueStep} loading={loading} icon={step === 3 ? 'check' : 'arrow-right'} style={{ minHeight: 52, borderRadius: 16 }}>
          {step === 3 ? (seekLink && !searchInstead ? 'Open the ad' : 'Start my role check') : 'Continue'}
        </Button>

        {step === 1 && recent.length > 0 && (
          <View style={{ gap: 10, marginTop: 8 }}>
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
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function ModeCard({
  mode,
  selected,
  colors,
  onPress,
}: {
  mode: (typeof MODES)[number];
  selected: boolean;
  colors: Colors;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${mode.label}, ${mode.caption}`}
      testID={`evaluate-source-${mode.mode}`}
      style={({ pressed }) => ({
        flex: 1, minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 5,
        borderRadius: 18, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.card : 'transparent', opacity: pressed ? 0.78 : 1,
      })}
    >
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: selected ? colors.primary : colors.muted, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={mode.icon} size={18} color={selected ? colors.primaryForeground : colors.mutedForeground} />
      </View>
      <Text style={[type.bodySemibold, { color: selected ? colors.navy : colors.mutedForeground, textAlign: 'center' }]}>{mode.label}</Text>
      <Text style={[type.labelCaption, { color: colors.mutedForeground, textAlign: 'center' }]}>{mode.caption}</Text>
    </Pressable>
  );
}

function ClipboardButton({ label, onPress, colors }: { label: string; onPress: () => void; colors: Colors }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Feather name="clipboard" size={16} color={colors.primary} />
      <Text style={[type.bodySemibold, { color: colors.primary }]}>Paste</Text>
    </Pressable>
  );
}

function GuidanceCard({ colors, icon, text }: { colors: Colors; icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={{ backgroundColor: colors.accent, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Feather name={icon} size={18} color={colors.accentForeground} style={{ marginTop: 2 }} />
      <Text style={[type.bodyMd, { color: colors.accentForeground, flex: 1 }]}>{text}</Text>
    </View>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 4 }}>
      <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[type.bodySemibold, { color: colors.navy }]} numberOfLines={3}>{value}</Text>
    </View>
  );
}

function CoachNote({ workRights, colors }: { workRights: WorkRights | null; colors: Colors }) {
  const visa = workRights ? visaSummary(workRights).title : null;
  return (
    <View style={{ backgroundColor: colors.accent, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Feather name="compass" size={18} color={colors.accentForeground} style={{ marginTop: 2 }} />
      <Text style={[type.bodyMd, { color: colors.accentForeground, flex: 1 }]}>
        {visa ? `We compare this role with your CV and ${visa} work rights.` : 'We compare the role with your CV. Add work rights in Profile to check visa fit.'}
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
