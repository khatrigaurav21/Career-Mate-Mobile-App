import React, { useState } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { DocumentAction, documentErrorMessage } from '@/components/DocumentAction';
import { AppliedPrompt } from '@/components/AppliedPrompt';
import { CvNotes } from '@/components/CvNotes';
import { Button, ErrorNotice, WarningList } from '@/components/ui';
import { api, getDocumentUrl } from '@/lib/api';
import type { JobDetail } from '@/lib/api';

// Your tailored CV on its own screen: make it, download it, or edit it first.
export default function CvStep() {
  return <JobGate>{(job, id) => <CvBody job={job} id={id} />}</JobGate>;
}

function CvBody({ job, id }: { job: JobDetail; id: string }) {
  const queryClient = useQueryClient();
  // Set when the PDF is opened: the moment to ask "Did you apply?".
  const [askApplied, setAskApplied] = useState(false);
  const mutation = useMutation({
    mutationFn: () => api.generateCv(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job', id] });
      void queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      void queryClient.invalidateQueries({ queryKey: ['cv', id] });
      // The CV exists now, so offer what to add to it right away instead of
      // sending the person back a screen.
      router.push(`/job/${id}/changes?from=cv` as never);
    },
  });
  const url = mutation.data?.pdf_url ?? getDocumentUrl(job, 'cv');
  // The notes live with the CV, so they show again when the screen is reopened.
  const saved = useQuery({ queryKey: ['cv', id], queryFn: () => api.getCv(id), enabled: !!url });
  const notes = mutation.data?.notes ?? saved.data?.content.notes;
  const open = (link: string) => {
    void Linking.openURL(link);
    if (job.status === 'evaluated') setAskApplied(true);
  };

  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Your CV"
      primary={url ? { label: 'Next: cover letter', onPress: () => router.push(`/job/${id}/letter`) } : { label: 'Make my CV', onPress: () => mutation.mutate(), loading: mutation.isPending }}
      secondary={url ? { label: 'Edit before downloading', icon: 'edit-2', onPress: () => router.push(`/cv/${id}`) } : undefined}
    >
      <DocumentAction
        title="Tailored CV"
        accessibilityLabel="Download tailored CV"
        description={url ? 'Ready. Edit it first, or tap to download.' : 'Built from your real experience'}
        icon="file-text"
        url={url}
        loading={mutation.isPending}
        progressSteps={[
          { label: 'Pulling your strongest matches', estimatedMs: 25000 },
          { label: 'Writing the draft', estimatedMs: 35000 },
          { label: 'Formatting the PDF', estimatedMs: 30000 },
        ]}
        onPress={() => (url ? open(url) : mutation.mutate())}
      />
      {url && !mutation.isPending ? (
        <Button variant="secondary" icon="trending-up" onPress={() => router.push(`/job/${id}/changes?from=cv` as never)}>Make it stronger</Button>
      ) : null}
      <CvNotes notes={notes} />
      {mutation.data ? <WarningList warnings={mutation.data.warnings} /> : null}
      {mutation.isError ? <ErrorNotice message={documentErrorMessage(mutation.error)} /> : null}
      {askApplied && job.status === 'evaluated' ? <AppliedPrompt jobId={job.job_id} onDone={() => setAskApplied(false)} /> : null}
    </StepScreen>
  );
}
