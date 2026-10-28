import React, { useState } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { DocumentAction, documentErrorMessage } from '@/components/DocumentAction';
import { ToneChooser } from '@/components/ToneChooser';
import { AppliedPrompt } from '@/components/AppliedPrompt';
import { CoverLetterText } from '@/components/CoverLetterText';
import { Button, ErrorNotice, WarningList } from '@/components/ui';
import { api, getDocumentUrl } from '@/lib/api';
import type { JobDetail, LetterTone } from '@/lib/api';

// Your cover letter on its own screen: choose a tone, make it, download it, or edit it first.
export default function LetterStep() {
  return <JobGate>{(job, id) => <LetterBody job={job} id={id} />}</JobGate>;
}

function LetterBody({ job, id }: { job: JobDetail; id: string }) {
  const queryClient = useQueryClient();
  const [tone, setTone] = useState<LetterTone>('professional');
  const [askApplied, setAskApplied] = useState(false);
  const mutation = useMutation({
    mutationFn: () => api.generateCoverLetter(id, tone),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job', id] });
      void queryClient.invalidateQueries({ queryKey: ['letter', id] });
      void queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
  const url = mutation.data?.pdf_url ?? getDocumentUrl(job, 'cover');
  const open = (link: string) => {
    void Linking.openURL(link);
    if (job.status === 'evaluated') setAskApplied(true);
  };

  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Cover letter"
      primary={url ? { label: 'Next: apply', onPress: () => router.push(`/job/${id}/apply`) } : { label: 'Write my letter', onPress: () => mutation.mutate(), loading: mutation.isPending }}
      secondary={url && !mutation.isPending ? { label: 'Write it again in this tone', icon: 'refresh-cw', onPress: () => mutation.mutate() } : undefined}
    >
      <ToneChooser value={tone} onChange={setTone} />
      <DocumentAction
        title="Cover letter"
        accessibilityLabel="Download cover letter"
        description={url ? 'Ready. Edit it first, or tap to download.' : 'Written from your CV and this ad'}
        icon="edit-3"
        url={url}
        loading={mutation.isPending}
        progressSteps={[
          { label: 'Pulling your strongest matches', estimatedMs: 20000 },
          { label: 'Writing the draft', estimatedMs: 40000 },
          { label: 'Formatting the PDF', estimatedMs: 30000 },
        ]}
        onPress={() => (url ? open(url) : mutation.mutate())}
      />
      {url ? <Button variant="secondary" icon="edit-2" onPress={() => router.push(`/letter/${id}`)}>Edit before downloading</Button> : null}
      {url && !mutation.isPending ? <CoverLetterText jobId={id} version={mutation.data?.pdf_url ?? url} /> : null}
      {mutation.data ? <WarningList warnings={mutation.data.warnings} /> : null}
      {mutation.isError ? <ErrorNotice message={documentErrorMessage(mutation.error)} /> : null}
      {askApplied && job.status === 'evaluated' ? <AppliedPrompt jobId={job.job_id} onDone={() => setAskApplied(false)} /> : null}
    </StepScreen>
  );
}
