import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApplicationAnswer } from '@/lib/api';
import { Button, ErrorNotice, Field, MotionIndicator, WarningList } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

type Colors = ReturnType<typeof useColors>;

// Ready-made change requests: one tap instead of typing on a phone.
const QUICK_CHANGES = ['Make it shorter', 'Make it more specific', 'Use a different example'];

/**
 * Application questions on the job screen: paste a question from the form
 * (or a selection criterion), get a first-person answer from your CV and the
 * ad, ask for changes, copy it into the application. Answers are saved with
 * the job and deleted with it.
 */
export function ApplicationAnswers({ jobId }: { jobId: string }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const answers = useQuery({ queryKey: ['answers', jobId], queryFn: () => api.getAnswers(jobId) });

  const setAnswer = (answer: ApplicationAnswer) =>
    queryClient.setQueryData<{ answers: ApplicationAnswer[] }>(['answers', jobId], (old) => {
      const list = old?.answers ?? [];
      const exists = list.some((a) => a.id === answer.id);
      return { answers: exists ? list.map((a) => (a.id === answer.id ? answer : a)) : [...list, answer] };
    });

  const draft = useMutation({
    mutationFn: () => api.draftAnswer(jobId, question.trim()),
    onSuccess: ({ answer }) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAnswer(answer);
      setQuestion('');
    },
  });

  const list = answers.data?.answers ?? [];

  return (
    <View style={{ gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Feather name="message-square" size={18} color={colors.teal} />
        <Text style={[type.headlineSm, { color: colors.navy }]}>Application questions</Text>
      </View>
      <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
        Paste a question from the application form, or a selection criterion. We’ll draft your answer from your CV and this ad.
      </Text>

      {list.map((a) => (
        <AnswerCard key={a.id} jobId={jobId} answer={a} colors={colors} onChange={setAnswer} />
      ))}

      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, gap: 10 }}>
        <Field
          placeholder="e.g. Why do you want to work with us?"
          value={question}
          onChangeText={setQuestion}
          multiline
          accessibilityLabel="Application question"
        />
        <Button icon="edit-3" onPress={() => draft.mutate()} loading={draft.isPending} disabled={question.trim().length < 5}>
          Draft my answer
        </Button>
        {draft.isError ? <ErrorNotice message={draft.error instanceof Error ? draft.error.message : 'We couldn’t draft that. Please try again.'} /> : null}
      </View>
      {answers.isError ? <ErrorNotice message="We couldn’t load your saved answers." onRetry={() => void answers.refetch()} /> : null}
    </View>
  );
}

function AnswerCard({
  jobId,
  answer,
  colors,
  onChange,
}: {
  jobId: string;
  answer: ApplicationAnswer;
  colors: Colors;
  onChange: (a: ApplicationAnswer) => void;
}) {
  const queryClient = useQueryClient();
  const [change, setChange] = useState('');
  const [copied, setCopied] = useState(false);

  const revise = useMutation({
    mutationFn: (instruction: string) => api.reviseAnswer(jobId, answer.id, instruction),
    onSuccess: ({ answer: next }) => {
      void Haptics.selectionAsync().catch(() => {});
      setChange('');
      setCopied(false);
      onChange(next);
    },
  });
  const remove = useMutation({
    mutationFn: () => api.deleteAnswer(jobId, answer.id),
    onSuccess: () =>
      queryClient.setQueryData<{ answers: ApplicationAnswer[] }>(['answers', jobId], (old) => ({
        answers: (old?.answers ?? []).filter((a) => a.id !== answer.id),
      })),
  });

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      remove.mutate();
      return;
    }
    Alert.alert('Delete this answer?', 'The question and its answer will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
    ]);
  };

  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <Text style={[type.bodySemibold, { color: colors.navy, flex: 1 }]} numberOfLines={4}>{answer.question}</Text>
        <Pressable onPress={confirmDelete} accessibilityRole="button" accessibilityLabel="Delete this answer" hitSlop={10} style={{ minHeight: 32, minWidth: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {revise.isPending ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60 }}>
          <MotionIndicator color={colors.primary} />
          <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>Rewriting your answer…</Text>
        </View>
      ) : (
        <Text selectable style={[type.bodyLg, { color: colors.foreground }]}>{answer.answer}</Text>
      )}
      <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{`${answer.word_count} words`}</Text>
      {answer.note ? (
        <View style={{ flexDirection: 'row', gap: 8, backgroundColor: colors.warningSoft, borderRadius: 12, padding: 10 }}>
          <Feather name="info" size={15} color={colors.warning} style={{ marginTop: 3 }} />
          <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{answer.note}</Text>
        </View>
      ) : null}
      {answer.warnings && answer.warnings.length > 0 ? <WarningList warnings={answer.warnings} /> : null}

      <Button
        variant="secondary"
        icon={copied ? 'check' : 'copy'}
        onPress={() => void Clipboard.setStringAsync(answer.answer).then(() => setCopied(true)).catch(() => {})}
      >
        {copied ? 'Copied' : 'Copy answer'}
      </Button>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {QUICK_CHANGES.map((c) => (
          <Pressable
            key={c}
            onPress={() => revise.mutate(c)}
            disabled={revise.isPending}
            accessibilityRole="button"
            style={({ pressed }) => ({ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, opacity: pressed || revise.isPending ? 0.6 : 1 })}
          >
            <Text style={[type.labelPill, { color: colors.navy }]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Field
            placeholder="Ask for a change, e.g. mention my Excel rosters"
            value={change}
            onChangeText={setChange}
            accessibilityLabel="Change to make to this answer"
          />
        </View>
        <Pressable
          onPress={() => revise.mutate(change.trim())}
          disabled={!change.trim() || revise.isPending}
          accessibilityRole="button"
          accessibilityLabel="Rewrite with this change"
          style={({ pressed }) => ({ width: 50, height: 54, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: !change.trim() || pressed ? 0.6 : 1, marginBottom: 2 })}
        >
          <Feather name="send" size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>
      {answer.changes.length > 0 ? (
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{`Changes so far: ${answer.changes.join(' · ')}`}</Text>
      ) : null}
      {revise.isError ? <ErrorNotice message={revise.error instanceof Error ? revise.error.message : 'We couldn’t make that change. Please try again.'} /> : null}
    </View>
  );
}
