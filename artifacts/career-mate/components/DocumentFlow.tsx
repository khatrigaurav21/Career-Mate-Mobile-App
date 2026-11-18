import React, { useEffect, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { StepScreen } from '@/components/StepScreen';
import { CvSuggestionCard } from '@/components/CvSuggestionCard';
import { Button, ErrorNotice, SegmentedProgress, WarningList } from '@/components/ui';
import type { ProgressStep } from '@/components/ui';
import { ApiError, getDocumentUrl } from '@/lib/api';
import type { JobDetail } from '@/lib/api';
import type { StagedEdit } from '@/lib/stagedEdits';
import { documentErrorMessage } from '@/components/DocumentAction';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

export type FlowSuggestion = { key: string; text: string; heading?: string; detail?: string; request?: string };

type Phase = 'generating' | 'review' | 'improve' | 'saving' | 'ready';

/**
 * One screen that takes a CV or cover letter from nothing to downloaded without
 * sending the person back and forth:
 *   generating: it is built as soon as the screen opens
 *   review:     the finished document is shown to read, with "Looks good"
 *   improve:    points to add; each one is staged, not saved
 *   saving:     one update applies all staged points and rebuilds the PDF once
 *   ready:      a clear "updated" confirmation, the new document, and Download
 */
export function DocumentFlow<C>({
  job,
  jobId,
  noun,
  docKey,
  queryKey,
  generate,
  loadContent,
  save,
  renderPreview,
  renderNotes,
  suggestions,
  suggestionDoc,
  nextLabel,
  nextTo,
  editPath,
  extra,
  progressSteps,
}: {
  job: JobDetail;
  jobId: string;
  noun: 'CV' | 'cover letter';
  docKey: 'cv' | 'cover';
  queryKey: 'cv' | 'letter';
  /** Builds the document. May return { warnings }. */
  generate: () => Promise<{ warnings?: string[] } | unknown>;
  loadContent: () => Promise<{ content: C }>;
  /** Applies the staged points in one update. */
  save: (content: C, staged: StagedEdit[], options: { allowExtraPage: boolean }) => Promise<unknown>;
  renderPreview: (content: C) => React.ReactNode;
  renderNotes?: (content: C) => React.ReactNode;
  suggestions: FlowSuggestion[];
  suggestionDoc: 'cv' | 'letter';
  nextLabel: string;
  nextTo: string;
  editPath: string;
  /** Shown on the finished screen, e.g. a tone chooser for the letter. */
  extra?: (regenerate: () => void) => React.ReactNode;
  progressSteps: ProgressStep[];
}) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const url = getDocumentUrl(job, docKey);
  const [phase, setPhase] = useState<Phase>(url ? 'ready' : 'generating');
  const [staged, setStaged] = useState<Record<string, StagedEdit>>({});
  const [appliedCount, setAppliedCount] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const started = useRef(false);

  const content = useQuery({ queryKey: [queryKey, jobId], queryFn: loadContent, enabled: !!url, retry: false });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    void queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    void queryClient.invalidateQueries({ queryKey: [queryKey, jobId] });
  };

  const gen = useMutation({
    mutationFn: generate,
    onSuccess: (data) => {
      setWarnings(((data as { warnings?: string[] } | null)?.warnings) ?? []);
      setStaged({});
      setAppliedCount(0);
      refresh();
      setPhase('review');
    },
  });

  // Build it as soon as the screen opens, once.
  useEffect(() => {
    if (!url && !started.current) {
      started.current = true;
      gen.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const applyAll = useMutation({
    mutationFn: async (allowExtraPage: boolean) => {
      const { content: current } = await loadContent();
      return save(current, Object.values(staged), { allowExtraPage });
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAppliedCount(Object.keys(staged).length);
      setStaged({});
      refresh();
      setPhase('ready');
    },
    onError: () => setPhase('improve'),
  });

  const eyebrow = [job.title, job.company].filter(Boolean).join(' · ') || 'This job';
  const stagedCount = Object.keys(staged).length;
  const data = content.data?.content;
  const open = () => {
    if (url) void WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
  };

  // 1. Building
  if (phase === 'generating' || phase === 'saving') {
    const building = phase === 'generating';
    return (
      <StepScreen eyebrow={eyebrow} title={building ? `Building your ${noun}` : `Updating your ${noun}`} onBack={() => router.back()}>
        {gen.isError && building ? (
          <>
            <ErrorNotice message={documentErrorMessage(gen.error)} />
            <Button onPress={() => gen.mutate()} icon="refresh-cw">Try again</Button>
          </>
        ) : (
          <View style={{ gap: 12, padding: 18, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text style={[type.bodyMd, { color: colors.foreground }]}>
              {building ? `Writing your ${noun} from your profile and this ad. It takes about half a minute.` : `Adding your ${stagedCount} point${stagedCount === 1 ? '' : 's'} and rebuilding the PDF once.`}
            </Text>
            <SegmentedProgress steps={progressSteps} />
          </View>
        )}
      </StepScreen>
    );
  }

  // 2. Read it
  if (phase === 'review') {
    return (
      <StepScreen
        eyebrow={eyebrow}
        title={`Here’s your ${noun}`}
        onBack={() => router.replace(`/job/${jobId}`)}
        primary={{ label: 'Looks good', icon: 'check', onPress: () => setPhase(suggestions.length > 0 ? 'improve' : 'ready') }}
        secondary={{ label: 'Edit it myself', onPress: () => router.push(editPath as never) }}
      >
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Read it through. Next you can add points that make it fit this job better.</Text>
        {data ? renderPreview(data) : <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Loading your {noun}…</Text>}
        {data && renderNotes ? renderNotes(data) : null}
        <WarningList warnings={warnings} />
      </StepScreen>
    );
  }

  // 3. Add points
  if (phase === 'improve') {
    const extraPageOffer = applyAll.error instanceof ApiError && applyAll.error.data?.can_allow_extra_page === true;
    return (
      <StepScreen
        eyebrow={eyebrow}
        title={`Make your ${noun} stronger`}
        onBack={() => setPhase('review')}
        primary={
          stagedCount > 0
            ? { label: `Update my ${noun} (${stagedCount})`, icon: 'refresh-cw', loading: applyAll.isPending, onPress: () => { setPhase('saving'); applyAll.mutate(false); } }
            : { label: `Keep it as it is`, onPress: () => setPhase('ready') }
        }
        secondary={stagedCount > 0 ? { label: 'Skip these', onPress: () => { setStaged({}); setPhase('ready'); } } : undefined}
      >
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
          Tap Add on the points you want. Nothing changes until you press Update, then your {noun} is rebuilt once.
        </Text>
        {applyAll.isError ? (
          <View style={{ gap: 8 }}>
            <ErrorNotice message={applyAll.error instanceof ApiError ? applyAll.error.message : documentErrorMessage(applyAll.error)} />
            {extraPageOffer ? <Button variant="secondary" onPress={() => { setPhase('saving'); applyAll.mutate(true); }}>Allow a third page and update</Button> : null}
            {suggestionDoc === 'letter' ? <Button variant="ghost" onPress={() => router.push(editPath as never)}>Edit the letter to make room</Button> : null}
          </View>
        ) : null}
        <View style={{ gap: 12 }}>
          {suggestions.map((s, i) => (
            <CvSuggestionCard
              key={s.key}
              jobId={jobId}
              index={i}
              document={suggestionDoc}
              text={s.text}
              heading={s.heading}
              detail={s.detail}
              request={s.request}
              staged={!!staged[s.key]}
              onStage={(edit) => setStaged((current) => ({ ...current, [s.key]: edit }))}
              onUnstage={() => setStaged((current) => { const { [s.key]: _removed, ...rest } = current; return rest; })}
            />
          ))}
        </View>
      </StepScreen>
    );
  }

  // 4. Ready
  return (
    <StepScreen
      eyebrow={eyebrow}
      title={appliedCount > 0 ? `New ${noun} ready` : `Your ${noun} is ready`}
      onBack={() => router.replace(`/job/${jobId}`)}
      primary={{ label: nextLabel, icon: 'arrow-right', onPress: () => router.push(nextTo as never) }}
    >
      <View style={{ gap: 6, padding: 16, borderRadius: 18, backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.success }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="check-circle" size={18} color={colors.success} />
          <Text style={[type.titleCard, { color: colors.success }]}>
            {appliedCount > 0 ? `Updated with ${appliedCount} change${appliedCount === 1 ? '' : 's'}` : 'Ready to download'}
          </Text>
        </View>
        <Text style={[type.bodyMd, { color: colors.foreground }]}>
          {appliedCount > 0 ? `A new PDF was built with your changes. This is the one to send.` : `Download it, or keep going to the next step.`}
        </Text>
      </View>
      <Button onPress={open} icon="download" style={{ minHeight: 54 }}>{`Download ${noun}`}</Button>
      {suggestions.length > 0 ? <Button variant="secondary" icon="trending-up" onPress={() => setPhase('improve')}>Add more points</Button> : null}
      {extra ? extra(() => { setPhase('generating'); gen.mutate(); }) : null}
      {data ? renderPreview(data) : null}
    </StepScreen>
  );
}
