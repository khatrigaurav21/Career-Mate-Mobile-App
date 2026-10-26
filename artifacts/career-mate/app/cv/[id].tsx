import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, isApiError } from '@/lib/api';
import type { CvContent } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { Button, ErrorNotice, Field, IconButton, LoadingState, PageHeader, Screen, WarningList } from '@/components/ui';
import { StepScreen } from '@/components/StepScreen';
import { type } from '@/constants/typography';

// Reword the summary and bullets of a generated CV, one section at a time.
// Employers, titles and dates stay as generated, so nothing about the person's
// history can be changed here. Saving re-makes the PDF and flags anything that
// isn't in their profile, so they keep it only if it's true.

type Draft = { summary: string; bullets: string[][]; projects: string[] };
type Step = { kind: 'summary' } | { kind: 'job'; j: number } | { kind: 'projects' } | { kind: 'review' };

function toDraft(content: CvContent): Draft {
  return {
    summary: content.summary ?? '',
    bullets: (content.experience ?? []).map((job) => [...job.bullets]),
    projects: (content.key_projects ?? []).map((p) => p.description),
  };
}

export default function EditCv() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, hydrated } = useAuth();
  const queryClient = useQueryClient();
  const cv = useQuery({ queryKey: ['cv', id], queryFn: () => api.getCv(id), enabled: !!id && !!session, retry: false });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedPdf, setSavedPdf] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (cv.data && !draft) setDraft(toDraft(cv.data.content));
  }, [cv.data, draft]);

  const original = useMemo(() => (cv.data ? JSON.stringify(toDraft(cv.data.content)) : ''), [cv.data]);
  const dirty = draft !== null && JSON.stringify(draft) !== original;

  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error('Nothing to save');
      return api.saveCv(id, {
        summary: draft.summary,
        experience: draft.bullets.map((bullets) => ({ bullets })),
        key_projects: draft.projects.map((description) => ({ description })),
      });
    },
    onSuccess: (result) => {
      setSavedPdf(result.pdf_url);
      setDraft(toDraft(result.content));
      queryClient.setQueryData(['cv', id], { content: result.content, pdf_url: result.pdf_url });
      void queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
  });
  // CVs made before editing existed have a PDF but no editable content.
  const remake = useMutation({
    mutationFn: () => api.generateCv(id),
    onSuccess: () => {
      setDraft(null);
      void cv.refetch();
      void queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
  });

  if (hydrated && !session) return <Redirect href="/" />;
  const header = <PageHeader eyebrow="Your CV" title="Review and edit" subtitle="Change any wording. Your jobs, employers and dates stay exactly as they are." onBack={() => router.back()} />;

  if (!hydrated || cv.isLoading) return <Screen scroll={false}><LoadingState title="Opening your CV" detail="Getting the text ready to edit." /></Screen>;
  // Data has arrived but the first effect hasn't copied it into the draft yet.
  if (cv.data && !draft) return <Screen scroll={false}><LoadingState title="Opening your CV" detail="Getting the text ready to edit." /></Screen>;
  if (cv.isError || !draft || !cv.data) {
    const notFound = isApiError(cv.error) && cv.error.status === 404;
    return (
      <Screen>
        {header}
        <ErrorNotice message={notFound ? (cv.error as Error).message : 'We couldn’t open your CV. Check your connection and try again.'} />
        {notFound ? (
          <Button icon="refresh-cw" loading={remake.isPending} onPress={() => remake.mutate()}>Create my CV again</Button>
        ) : (
          <Button variant="secondary" icon="refresh-cw" onPress={() => void cv.refetch()}>Try again</Button>
        )}
        {remake.isError ? <ErrorNotice message={isApiError(remake.error) && remake.error.status === 429 ? remake.error.message : 'We couldn’t create the CV. You can try again.'} /> : null}
      </Screen>
    );
  }

  const content = cv.data.content;
  const jobs = content.experience ?? [];
  const projects = content.key_projects ?? [];
  const steps: Step[] = [{ kind: 'summary' }, ...jobs.map((_, j) => ({ kind: 'job' as const, j })), ...(projects.length ? [{ kind: 'projects' as const }] : []), { kind: 'review' }];
  const at = Math.min(stepIndex, steps.length - 1);
  const step = steps[at];
  const progress = { step: at + 1, of: steps.length };
  const goBack = () => (at === 0 ? router.back() : setStepIndex(at - 1));
  const next = () => setStepIndex(Math.min(at + 1, steps.length - 1));
  const nextLabel = (s: Step | undefined) => (!s ? '' : s.kind === 'job' ? `Next: ${jobs[s.j]?.title || 'a job'}` : s.kind === 'projects' ? 'Next: your projects' : 'Next: review');

  const setBullet = (job: number, index: number, text: string) =>
    setDraft((d) => d && { ...d, bullets: d.bullets.map((list, j) => (j === job ? list.map((b, i) => (i === index ? text : b)) : list)) });
  const addBullet = (job: number) =>
    setDraft((d) => d && { ...d, bullets: d.bullets.map((list, j) => (j === job ? [...list, ''] : list)) });
  const removeBullet = (job: number, index: number) =>
    setDraft((d) => d && { ...d, bullets: d.bullets.map((list, j) => (j === job ? list.filter((_, i) => i !== index) : list)) });

  const flagNote = (
    <Text style={[type.labelCaption, { color: colors.mutedForeground, lineHeight: 18 }]}>
      If you add a number or an achievement that isn’t in your profile, we’ll flag it after you save, so you keep it only if it’s true.
    </Text>
  );

  if (step.kind === 'summary') {
    return (
      <StepScreen eyebrow="Edit your CV" title="Your summary" progress={progress} onBack={goBack} showHome={false} primary={{ label: nextLabel(steps[at + 1]), onPress: next }}>
        <Field label="Summary" multiline value={draft.summary} onChangeText={(text) => setDraft((d) => d && { ...d, summary: text })} />
        {flagNote}
      </StepScreen>
    );
  }

  if (step.kind === 'job') {
    const job = jobs[step.j];
    return (
      <StepScreen eyebrow={`Job ${step.j + 1} of ${jobs.length}`} title={job.title || 'Role'} progress={progress} onBack={goBack} showHome={false} primary={{ label: nextLabel(steps[at + 1]), onPress: next }}>
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>{[job.company, job.dates].filter(Boolean).join(' · ')}</Text>
        {draft.bullets[step.j].map((bullet, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field multiline value={bullet} onChangeText={(text) => setBullet(step.j, i, text)} accessibilityLabel={`Bullet ${i + 1} for ${job.title || 'this role'}`} />
            </View>
            {draft.bullets[step.j].length > 1 ? <IconButton icon="trash-2" onPress={() => removeBullet(step.j, i)} label="Remove this bullet" /> : null}
          </View>
        ))}
        <Button variant="ghost" icon="plus" onPress={() => addBullet(step.j)}>Add a bullet</Button>
      </StepScreen>
    );
  }

  if (step.kind === 'projects') {
    return (
      <StepScreen eyebrow="Edit your CV" title="Your projects" progress={progress} onBack={goBack} showHome={false} primary={{ label: nextLabel(steps[at + 1]), onPress: next }}>
        {projects.map((project, p) => (
          <Field
            key={`${project.name}-${p}`}
            label={project.name || `Project ${p + 1}`}
            multiline
            value={draft.projects[p]}
            onChangeText={(text) => setDraft((d) => d && { ...d, projects: d.projects.map((x, i) => (i === p ? text : x)) })}
          />
        ))}
      </StepScreen>
    );
  }

  // Review: what will be saved, a way back to any part, then save.
  const saved = !!savedPdf && !dirty;
  const reviewRow = (title: string, sub: string, to: number) => (
    <Pressable
      key={title + to}
      onPress={() => setStepIndex(to)}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${title}`}
      style={({ pressed }) => ({ minHeight: 64, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.72 : 1 })}
    >
      <Feather name="check" size={18} color={colors.success} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.titleCard, { color: colors.navy }]}>{title}</Text>
        <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{sub}</Text>
      </View>
      <Text style={[type.bodySemibold, { color: colors.primary }]}>Edit</Text>
    </Pressable>
  );
  return (
    <StepScreen
      eyebrow="Edit your CV"
      title={saved ? 'Saved' : 'Looks right?'}
      progress={progress}
      onBack={goBack}
      showHome={false}
      primary={saved ? { label: 'Back to your CV', onPress: () => router.replace(`/job/${id}/cv`) } : { label: 'Save changes', icon: 'check', onPress: () => save.mutate(), loading: save.isPending, disabled: !dirty }}
      secondary={saved && savedPdf ? { label: 'Open the PDF', icon: 'download', onPress: () => void Linking.openURL(savedPdf) } : undefined}
    >
      <View style={{ gap: 10 }}>
        {reviewRow('Summary', draft.summary ? draft.summary.slice(0, 70) + (draft.summary.length > 70 ? '…' : '') : 'Empty', 0)}
        {jobs.map((job, j) => reviewRow(job.title || `Job ${j + 1}`, `${draft.bullets[j].length} ${draft.bullets[j].length === 1 ? 'bullet' : 'bullets'}`, 1 + j))}
        {projects.length ? reviewRow('Projects', `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`, 1 + jobs.length) : null}
      </View>
      {save.isError ? (
        <ErrorNotice message={isApiError(save.error) && [400, 422, 429].includes(save.error.status) ? save.error.message : 'We couldn’t save your changes. You can try again.'} />
      ) : null}
      {save.data && !dirty ? <WarningList warnings={save.data.warnings} /> : null}
      {saved ? <Text style={[type.bodySemibold, { color: colors.foreground }]}>Your PDF is updated.</Text> : flagNote}
    </StepScreen>
  );
}
