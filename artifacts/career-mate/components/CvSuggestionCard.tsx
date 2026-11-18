import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '@/lib/api';
import type { CvSuggestion, LetterSuggestion } from '@/lib/api';
import type { StagedEdit } from '@/lib/stagedEdits';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button } from '@/components/ui';

type Suggestion = CvSuggestion | LetterSuggestion;

/**
 * One point to add to the CV or cover letter. "Add to my CV" asks the API for a
 * line the profile supports and shows it for editing. Confirming it does not
 * save anything yet: the line is staged, and the screen applies all staged lines
 * in one update. If the profile can't back the point, the card says so instead
 * of inventing.
 */
export function CvSuggestionCard({
  jobId,
  index,
  text,
  document = 'cv',
  heading,
  detail,
  request,
  staged,
  onStage,
  onUnstage,
}: {
  jobId: string;
  index: number;
  /** The point shown on the card (and sent to the API unless `request` is given). */
  text: string;
  document?: 'cv' | 'letter';
  /** Optional bold title (a gap's requirement) shown above `detail`. */
  heading?: string;
  detail?: string;
  /** What to ask the API when it differs from the card text. */
  request?: string;
  staged: boolean;
  onStage: (edit: StagedEdit) => void;
  onUnstage: () => void;
}) {
  const colors = useColors();
  const isLetter = document === 'letter';
  const noun = isLetter ? 'letter' : 'CV';
  const [proposal, setProposal] = useState<Suggestion | null>(null);
  const [line, setLine] = useState('');

  const propose = useMutation({
    mutationFn: (): Promise<Suggestion> => (isLetter ? api.suggestLetterLine(jobId, request ?? text) : api.suggestCvLine(jobId, request ?? text)),
    onSuccess: (result) => {
      setProposal(result);
      if (result.status === 'ready') setLine(result.line);
    },
  });

  const error = propose.error;
  const errorText = error ? (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.') : null;
  const card = { gap: 12, padding: 16, borderRadius: 20, backgroundColor: staged ? colors.successSoft : colors.card, borderWidth: 1, borderColor: staged ? colors.success : colors.border } as const;

  const readyLabel = (target: string) =>
    target === 'summary' ? 'New summary. Edit it if you like.'
      : target === 'bridge' ? 'New bridge sentence. It replaces the current one. Edit it if you like.'
        : target === 'achievement' ? 'New achievement line. Edit it if you like.'
          : 'New bullet. Edit it if you like.';

  const confirm = () => {
    if (proposal?.status !== 'ready' || !line.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onStage({ target: proposal.target, job_index: 'job_index' in proposal ? proposal.job_index : null, line: line.trim() });
  };

  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: staged ? colors.success : colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          {staged ? <Feather name="check" size={15} color={colors.primaryForeground} /> : <Text style={{ color: colors.primaryForeground, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>{index + 1}</Text>}
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

      {staged ? (
        <View style={{ gap: 8 }}>
          <Text style={[type.bodyMd, { color: colors.foreground }]}>{line}</Text>
          <Text style={[type.labelCaption, { color: colors.success }]}>{`Will be added to your ${noun}`}</Text>
          <Button variant="ghost" onPress={onUnstage}>Undo</Button>
        </View>
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
          <Button onPress={confirm} disabled={!line.trim()} icon="plus">{`Add to my ${noun}`}</Button>
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
      ) : (
        <Button variant="secondary" onPress={() => propose.mutate()} loading={propose.isPending} icon="plus-circle">{`Add to my ${noun}`}</Button>
      )}

      {errorText ? <Text style={[type.labelCaption, { color: colors.destructive }]}>{errorText}</Text> : null}
    </View>
  );
}
