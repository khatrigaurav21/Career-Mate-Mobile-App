import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '@/lib/api';
import type { CvSuggestion, LetterSuggestion } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button } from '@/components/ui';

type Suggestion = CvSuggestion | LetterSuggestion;

/**
 * One suggestion as a card, for the CV or the cover letter. "Add to ..." asks
 * the API for a line the profile supports, shows it for editing, and only saves
 * when the person taps Add. If the profile can't back it, the card says so
 * instead of inventing.
 */
export function CvSuggestionCard({
  jobId,
  index,
  text,
  hasDocument,
  document = 'cv',
  heading,
  detail,
  request,
}: {
  jobId: string;
  index: number;
  /** The suggestion shown on the card (and sent to the API unless `request` is given). */
  text: string;
  /** Whether the CV or letter being added to exists yet. */
  hasDocument: boolean;
  document?: 'cv' | 'letter';
  /** Optional bold title (a gap's requirement) shown above `detail`. */
  heading?: string;
  detail?: string;
  /** What to ask the API when it differs from the card text. */
  request?: string;
}) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const isLetter = document === 'letter';
  const noun = isLetter ? 'letter' : 'CV';
  const [proposal, setProposal] = useState<Suggestion | null>(null);
  const [line, setLine] = useState('');
  const [added, setAdded] = useState(false);

  const propose = useMutation({
    mutationFn: (): Promise<Suggestion> => (isLetter ? api.suggestLetterLine(jobId, request ?? text) : api.suggestCvLine(jobId, request ?? text)),
    onSuccess: (result) => {
      setProposal(result);
      if (result.status === 'ready') setLine(result.line);
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (proposal?.status !== 'ready') return;
      const newLine = line.trim();
      if (isLetter) {
        const { content } = await api.getCoverLetter(jobId);
        const achievements = content.achievements ?? [];
        await api.saveCoverLetter(jobId, {
          greeting: content.greeting ?? '',
          opening: content.opening ?? '',
          profile_intro: content.profile_intro ?? '',
          achievements: proposal.target === 'achievement' ? [...achievements, newLine] : achievements,
          contribution: content.contribution ?? '',
          bridge: proposal.target === 'bridge' ? newLine : content.bridge ?? '',
          closing: content.closing ?? '',
        });
        return;
      }
      const { content } = await api.getCv(jobId);
      const jobs = content.experience ?? [];
      await api.saveCv(jobId, {
        summary: proposal.target === 'summary' ? newLine : content.summary ?? '',
        experience: jobs.map((j, i) => ({ bullets: proposal.target === 'bullet' && 'job_index' in proposal && i === proposal.job_index ? [...j.bullets, newLine] : j.bullets })),
        key_projects: (content.key_projects ?? []).map((p) => ({ description: p.description })),
      });
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAdded(true);
      void queryClient.invalidateQueries({ queryKey: [isLetter ? 'letter' : 'cv', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });

  const error = propose.error ?? add.error;
  const errorText = error ? (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.') : null;
  const card = { gap: 12, padding: 16, borderRadius: 20, backgroundColor: added ? colors.successSoft : colors.card, borderWidth: 1, borderColor: added ? colors.success : colors.border } as const;

  const readyLabel = (target: string) =>
    target === 'summary' ? 'New summary. Edit it if you like.'
      : target === 'bridge' ? 'New bridge sentence. It replaces the current one. Edit it if you like.'
        : target === 'achievement' ? 'New achievement line. Edit it if you like.'
          : 'New bullet. Edit it if you like.';

  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: added ? colors.success : colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          {added ? <Feather name="check" size={15} color={colors.primaryForeground} /> : <Text style={{ color: colors.primaryForeground, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>{index + 1}</Text>}
        </View>
        {heading ? (
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.bodySemibold, { color: colors.foreground }]}>{heading}</Text>
            {detail ? <Text style={[type.bodyMd, { color: colors.foreground }]}>{detail}</Text> : null}
          </View>
        ) : (
          <Text style={[type.bodyMd, { flex: 1, color: colors.foreground }]}>{text}</Text>
        )}
      </View>

      {added ? (
        <Text style={[type.labelCaption, { color: colors.success }]}>Added to your {noun}</Text>
      ) : proposal?.status === 'ready' ? (
        <View style={{ gap: 10 }}>
          <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{readyLabel(proposal.target)}</Text>
          <TextInput
            value={line}
            onChangeText={setLine}
            multiline
            accessibilityLabel={`Line to add to your ${noun}`}
            style={[type.bodyMd, { color: colors.foreground, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, minHeight: 72, textAlignVertical: 'top' }]}
          />
          {proposal.note ? <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{proposal.note}</Text> : null}
          {proposal.warnings.map((w, i) => <Text key={i} style={[type.labelCaption, { color: colors.warning }]}>{w}</Text>)}
          <Button onPress={() => add.mutate()} loading={add.isPending} disabled={!line.trim()} icon="plus">{`Add to ${noun}`}</Button>
          <Button variant="ghost" onPress={() => setProposal(null)}>Not now</Button>
        </View>
      ) : proposal?.status === 'needs_info' ? (
        <View style={{ gap: 10 }}>
          <Text style={[type.bodyMd, { color: colors.foreground }]}>{proposal.question}</Text>
          <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Your profile doesn’t show this yet, so we haven’t added anything. Add it under “Add numbers and results”, then try again.</Text>
          <Button variant="secondary" onPress={() => router.push('/details' as never)}>Add it to my profile</Button>
        </View>
      ) : proposal?.status === 'unsupported' ? (
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{proposal.note}</Text>
      ) : hasDocument ? (
        <Button variant="secondary" onPress={() => propose.mutate()} loading={propose.isPending} icon="plus-circle">{`Add to ${noun}`}</Button>
      ) : (
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{`Make your ${isLetter ? 'cover letter' : 'tailored CV'} first, then you can add this to it.`}</Text>
      )}

      {errorText ? <Text style={[type.labelCaption, { color: colors.destructive }]}>{errorText}</Text> : null}
      {isLetter && add.error instanceof ApiError && add.error.status === 422 ? (
        <Button variant="ghost" onPress={() => router.push(`/letter/${jobId}`)}>Edit the letter to make room</Button>
      ) : null}
    </View>
  );
}
