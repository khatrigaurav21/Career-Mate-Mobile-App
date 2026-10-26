import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api, isApiError } from '@/lib/api';
import type { LetterContent } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { Button, ErrorNotice, Field, IconButton, LoadingState, PageHeader, Screen, WarningList } from '@/components/ui';
import { StepScreen } from '@/components/StepScreen';
import { type } from '@/constants/typography';

// Reword a generated cover letter before downloading it, one paragraph at a
// time. The name, contact line and credentials stay as generated. Saving
// re-makes the one-page PDF and flags anything that isn't in the person's
// profile.

type Draft = {
  greeting: string;
  opening: string;
  profile_intro: string;
  achievements: string[];
  contribution: string;
  bridge: string;
  closing: string;
};

const STEPS = ['opening', 'about', 'wins', 'contribute', 'closing'] as const;

function toDraft(c: LetterContent): Draft {
  return {
    greeting: c.greeting ?? '',
    opening: c.opening ?? '',
    profile_intro: c.profile_intro ?? '',
    achievements: [...(c.achievements ?? [])],
    contribution: c.contribution ?? '',
    bridge: c.bridge ?? '',
    closing: c.closing ?? '',
  };
}

export default function EditLetter() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, hydrated } = useAuth();
  const queryClient = useQueryClient();
  const letter = useQuery({ queryKey: ['letter', id], queryFn: () => api.getCoverLetter(id), enabled: !!id && !!session, retry: false });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedPdf, setSavedPdf] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (letter.data && !draft) setDraft(toDraft(letter.data.content));
  }, [letter.data, draft]);

  const original = useMemo(() => (letter.data ? JSON.stringify(toDraft(letter.data.content)) : ''), [letter.data]);
  const dirty = draft !== null && JSON.stringify(draft) !== original;

  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error('Nothing to save');
      return api.saveCoverLetter(id, draft);
    },
    onSuccess: (result) => {
      setSavedPdf(result.pdf_url);
      setDraft(toDraft(result.content));
      queryClient.setQueryData(['letter', id], { content: result.content, pdf_url: result.pdf_url });
      void queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
  });
  // Letters made before editing existed have a PDF but no editable text.
  const remake = useMutation({
    mutationFn: () => api.generateCoverLetter(id),
    onSuccess: () => {
      setDraft(null);
      void letter.refetch();
      void queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
  });

  if (hydrated && !session) return <Redirect href="/" />;
  const header = <PageHeader eyebrow="Your cover letter" title="Review and edit" subtitle="Change any wording before you download. Keep it to one page." onBack={() => router.back()} />;

  if (!hydrated || letter.isLoading) return <Screen scroll={false}><LoadingState title="Opening your letter" detail="Getting the text ready to edit." /></Screen>;
  if (letter.data && !draft) return <Screen scroll={false}><LoadingState title="Opening your letter" detail="Getting the text ready to edit." /></Screen>;
  if (letter.isError || !draft || !letter.data) {
    const notFound = isApiError(letter.error) && letter.error.status === 404;
    return (
      <Screen>
        {header}
        <ErrorNotice message={notFound ? (letter.error as Error).message : 'We couldn’t open your letter. Check your connection and try again.'} />
        {notFound ? (
          <Button icon="refresh-cw" loading={remake.isPending} onPress={() => remake.mutate()}>Write my letter again</Button>
        ) : (
          <Button variant="secondary" icon="refresh-cw" onPress={() => void letter.refetch()}>Try again</Button>
        )}
        {remake.isError ? <ErrorNotice message={isApiError(remake.error) && remake.error.status === 429 ? remake.error.message : 'We couldn’t write the letter. You can try again.'} /> : null}
      </Screen>
    );
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => d && { ...d, [key]: value });
  const setAchievement = (index: number, text: string) => set('achievements', draft.achievements.map((a, i) => (i === index ? text : a)));

  const at = Math.min(stepIndex, STEPS.length - 1);
  const step = STEPS[at];
  const progress = { step: at + 1, of: STEPS.length };
  const goBack = () => (at === 0 ? router.back() : setStepIndex(at - 1));
  const next = (label: string) => ({ label, onPress: () => setStepIndex(at + 1) });
  const common = { eyebrow: 'Edit your cover letter', progress, onBack: goBack, showHome: false } as const;
  const hint = (text: string) => <Text style={[type.labelCaption, { color: colors.mutedForeground, lineHeight: 18 }]}>{text}</Text>;

  if (step === 'opening') {
    return (
      <StepScreen {...common} title="How it starts" primary={next('Next: about you')}>
        <Field label="Greeting" value={draft.greeting} onChangeText={(t) => set('greeting', t)} />
        <Field label="Opening" multiline value={draft.opening} onChangeText={(t) => set('opening', t)} />
        {hint('Make it yours. Wrap a few words in ** ** to make them bold.')}
      </StepScreen>
    );
  }
  if (step === 'about') {
    return (
      <StepScreen {...common} title="About you" primary={next('Next: your wins')}>
        <Field label="About you" multiline value={draft.profile_intro} onChangeText={(t) => set('profile_intro', t)} />
        {hint('Who you are, in two or three sentences.')}
      </StepScreen>
    );
  }
  if (step === 'wins') {
    return (
      <StepScreen {...common} title="Your wins" primary={next('Next: how you’d contribute')}>
        {draft.achievements.map((a, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field multiline value={a} onChangeText={(t) => setAchievement(i, t)} accessibilityLabel={`Achievement ${i + 1}`} />
            </View>
            {draft.achievements.length > 1 ? (
              <IconButton icon="trash-2" onPress={() => set('achievements', draft.achievements.filter((_, j) => j !== i))} label="Remove this achievement" />
            ) : null}
          </View>
        ))}
        {draft.achievements.length < 8 ? <Button variant="ghost" icon="plus" onPress={() => set('achievements', [...draft.achievements, ''])}>Add an achievement</Button> : null}
        {hint('Each one should come from your CV.')}
      </StepScreen>
    );
  }
  if (step === 'contribute') {
    return (
      <StepScreen {...common} title="How you’d contribute" primary={next('Next: closing')}>
        <Field label="How you’d contribute" multiline value={draft.contribution} onChangeText={(t) => set('contribution', t)} />
        <Field label="Bridge (optional)" helper="One sentence linking your experience to anything the role needs that your CV doesn’t show. Leave empty to skip it." multiline value={draft.bridge} onChangeText={(t) => set('bridge', t)} />
      </StepScreen>
    );
  }

  // Last step: the closing, then save.
  const saved = !!savedPdf && !dirty;
  return (
    <StepScreen
      {...common}
      title={saved ? 'Saved' : 'How it ends'}
      primary={saved ? { label: 'Back to your letter', onPress: () => router.replace(`/job/${id}/letter`) } : { label: 'Save changes', icon: 'check', onPress: () => save.mutate(), loading: save.isPending, disabled: !dirty }}
      secondary={saved && savedPdf ? { label: 'Open the PDF', icon: 'download', onPress: () => void Linking.openURL(savedPdf) } : undefined}
    >
      <Field label="Closing" multiline value={draft.closing} onChangeText={(t) => set('closing', t)} />
      {save.isError ? (
        <ErrorNotice message={isApiError(save.error) && [400, 422, 429].includes(save.error.status) ? save.error.message : 'We couldn’t save your changes. You can try again.'} />
      ) : null}
      {save.data && !dirty ? <WarningList warnings={save.data.warnings} /> : null}
      {saved ? <Text style={[type.bodySemibold, { color: colors.foreground }]}>Your PDF is updated.</Text> : hint('If you add a number or a claim that isn’t in your profile, we’ll flag it after you save, so you keep it only if it’s true.')}
    </StepScreen>
  );
}
