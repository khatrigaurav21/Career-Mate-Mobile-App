import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api, isApiError } from '@/lib/api';
import type { CvContent } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { Button, ErrorNotice, Field, IconButton, LoadingState, PageHeader, Screen, WarningList } from '@/components/ui';

// Reword the summary and bullets of a generated CV. Employers, titles and
// dates stay as generated, so nothing about the person's history can be
// changed here. Saving re-makes the PDF and flags anything that isn't in
// their profile, so they keep it only if it's true.

type Draft = { summary: string; bullets: string[][]; projects: string[] };

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
  const setBullet = (job: number, index: number, text: string) =>
    setDraft((d) => d && { ...d, bullets: d.bullets.map((list, j) => (j === job ? list.map((b, i) => (i === index ? text : b)) : list)) });
  const addBullet = (job: number) =>
    setDraft((d) => d && { ...d, bullets: d.bullets.map((list, j) => (j === job ? [...list, ''] : list)) });
  const removeBullet = (job: number, index: number) =>
    setDraft((d) => d && { ...d, bullets: d.bullets.map((list, j) => (j === job ? list.filter((_, i) => i !== index) : list)) });

  return (
    <Screen>
      {header}
      <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 19 }}>
        If you add a number or an achievement that isn’t in your profile, we’ll flag it after you save, so you keep it only if it’s true.
      </Text>

      <Field label="Summary" multiline value={draft.summary} onChangeText={(text) => setDraft((d) => d && { ...d, summary: text })} />

      {(content.experience ?? []).map((job, j) => (
        <View key={`${job.company}-${j}`} style={{ gap: 10 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>{job.title || 'Role'}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>
              {[job.company, job.dates].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {draft.bullets[j].map((bullet, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field multiline value={bullet} onChangeText={(text) => setBullet(j, i, text)} accessibilityLabel={`Bullet ${i + 1} for ${job.title || 'this role'}`} />
              </View>
              {draft.bullets[j].length > 1 ? <IconButton icon="trash-2" onPress={() => removeBullet(j, i)} label="Remove this bullet" /> : null}
            </View>
          ))}
          <Button variant="ghost" icon="plus" onPress={() => addBullet(j)}>Add a bullet</Button>
        </View>
      ))}

      {(content.key_projects ?? []).map((project, p) => (
        <Field
          key={`${project.name}-${p}`}
          label={project.name || `Project ${p + 1}`}
          multiline
          value={draft.projects[p]}
          onChangeText={(text) => setDraft((d) => d && { ...d, projects: d.projects.map((x, i) => (i === p ? text : x)) })}
        />
      ))}

      {save.isError ? (
        <ErrorNotice message={isApiError(save.error) && [400, 422, 429].includes(save.error.status) ? save.error.message : 'We couldn’t save your changes. You can try again.'} />
      ) : null}
      {save.data && !dirty ? <WarningList warnings={save.data.warnings} /> : null}
      <Button icon="check" loading={save.isPending} disabled={!dirty} onPress={() => save.mutate()}>Save changes</Button>
      {savedPdf && !dirty ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.foreground, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>Saved. Your PDF is updated.</Text>
          <Button variant="secondary" icon="download" onPress={() => void Linking.openURL(savedPdf)}>Open the PDF</Button>
        </View>
      ) : null}
    </Screen>
  );
}
