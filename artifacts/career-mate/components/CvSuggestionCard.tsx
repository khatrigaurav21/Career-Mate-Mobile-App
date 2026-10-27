import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '@/lib/api';
import type { CvSuggestion } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button } from '@/components/ui';

/**
 * One "what to change" item as a card. "Add to CV" asks the API for a line the
 * profile supports, shows it for editing, and only saves when the person taps
 * Add. If the profile can't back it, the card says so instead of inventing.
 */
export function CvSuggestionCard({
  jobId,
  index,
  text,
  hasCv,
  heading,
  detail,
  request,
}: {
  jobId: string;
  index: number;
  /** The suggestion shown on the card (and sent to the API unless `request` is given). */
  text: string;
  hasCv: boolean;
  /** Optional bold title (a gap's requirement) shown above `detail`. */
  heading?: string;
  detail?: string;
  /** What to ask the API when it differs from the card text. */
  request?: string;
}) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [proposal, setProposal] = useState<CvSuggestion | null>(null);
  const [line, setLine] = useState('');
  const [added, setAdded] = useState(false);

  const propose = useMutation({
    mutationFn: () => api.suggestCvLine(jobId, request ?? text),
    onSuccess: (result) => {
      setProposal(result);
      if (result.status === 'ready') setLine(result.line);
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (proposal?.status !== 'ready') return;
      const { content } = await api.getCv(jobId);
      const text = line.trim();
      const jobs = content.experience ?? [];
      const edits = {
        summary: proposal.target === 'summary' ? text : content.summary ?? '',
        experience: jobs.map((j, i) => ({ bullets: proposal.target === 'bullet' && i === proposal.job_index ? [...j.bullets, text] : j.bullets })),
        key_projects: (content.key_projects ?? []).map((p) => ({ description: p.description })),
      };
      await api.saveCv(jobId, edits);
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAdded(true);
      void queryClient.invalidateQueries({ queryKey: ['cv', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });

  const error = propose.error ?? add.error;
  const errorText = error ? (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.') : null;
  const card = { gap: 12, padding: 16, borderRadius: 20, backgroundColor: added ? colors.successSoft : colors.card, borderWidth: 1, borderColor: added ? colors.success : colors.border } as const;

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
        <Text style={[type.labelCaption, { color: colors.success }]}>Added to your CV</Text>
      ) : proposal?.status === 'ready' ? (
        <View style={{ gap: 10 }}>
          <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>
            {proposal.target === 'summary' ? 'New summary. Edit it if you like.' : 'New bullet. Edit it if you like.'}
          </Text>
          <TextInput
            value={line}
            onChangeText={setLine}
            multiline
            accessibilityLabel="Line to add to your CV"
            style={[type.bodyMd, { color: colors.foreground, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, minHeight: 72, textAlignVertical: 'top' }]}
          />
          {proposal.note ? <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{proposal.note}</Text> : null}
          {proposal.warnings.map((w, i) => <Text key={i} style={[type.labelCaption, { color: colors.warning }]}>{w}</Text>)}
          <Button onPress={() => add.mutate()} loading={add.isPending} disabled={!line.trim()} icon="plus">Add to CV</Button>
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
      ) : hasCv ? (
        <Button variant="secondary" onPress={() => propose.mutate()} loading={propose.isPending} icon="plus-circle">Add to CV</Button>
      ) : (
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Make your tailored CV first, then you can add this to it.</Text>
      )}

      {errorText ? <Text style={[type.labelCaption, { color: colors.destructive }]}>{errorText}</Text> : null}
    </View>
  );
}
