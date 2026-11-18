import React, { useState } from 'react';
import { View } from 'react-native';
import { JobGate } from '@/components/JobGate';
import { DocumentFlow } from '@/components/DocumentFlow';
import type { FlowSuggestion } from '@/components/DocumentFlow';
import { LetterPreview } from '@/components/DocumentPreview';
import { ToneChooser } from '@/components/ToneChooser';
import { CoverLetterText } from '@/components/CoverLetterText';
import { Button } from '@/components/ui';
import { api, getDocumentUrl } from '@/lib/api';
import type { JobDetail, LetterContent, LetterTone } from '@/lib/api';
import { summariseChanges, summariseMatch } from '@/lib/reportSummary';
import { letterEditsFrom } from '@/lib/stagedEdits';

// Your cover letter, start to finish on one screen, the same way as the CV: it
// is written when you arrive, shown for you to read, then you add points and
// press Update once. The tone can be changed from the finished screen.
export default function LetterStep() {
  return <JobGate>{(job, id) => <LetterBody job={job} id={id} />}</JobGate>;
}

function LetterBody({ job, id }: { job: JobDetail; id: string }) {
  const [tone, setTone] = useState<LetterTone>('professional');
  const gaps = summariseMatch(job.report?.B).gaps.slice(0, 3);
  const ideas = summariseChanges(job.report?.E).slice(0, 3);
  const suggestions: FlowSuggestion[] = [
    ...gaps.map((row, i) => ({
      key: `g${i}`,
      text: row.requirement,
      heading: `${row.requirement} (${row.kind === 'missing' ? 'missing' : 'partial'})`,
      detail: row.detail,
      request: `Add a line to the cover letter that connects the candidate's real experience to this requirement, using only what their profile supports: ${row.requirement}. ${row.detail}`.slice(0, 780),
    })),
    ...ideas.map((text, i) => ({ key: `i${i}`, text })),
  ];

  return (
    <DocumentFlow<LetterContent>
      job={job}
      jobId={id}
      noun="cover letter"
      docKey="cover"
      queryKey="letter"
      generate={() => api.generateCoverLetter(id, tone)}
      loadContent={() => api.getCoverLetter(id)}
      save={(content, staged) => api.saveCoverLetter(id, letterEditsFrom(content, staged))}
      renderPreview={(content) => <LetterPreview content={content} />}
      suggestions={suggestions}
      suggestionDoc="letter"
      nextLabel="Next: apply"
      nextTo={`/job/${id}/apply`}
      editPath={`/letter/${id}`}
      extra={(regenerate) => (
        <View style={{ gap: 12 }}>
          <CoverLetterText jobId={id} version={getDocumentUrl(job, 'cover') ?? undefined} />
          <ToneChooser value={tone} onChange={setTone} />
          <Button variant="ghost" icon="refresh-cw" onPress={regenerate}>Write it again in this tone</Button>
        </View>
      )}
      progressSteps={[
        { label: 'Pulling your strongest matches', estimatedMs: 20000 },
        { label: 'Writing the draft', estimatedMs: 40000 },
        { label: 'Formatting the PDF', estimatedMs: 30000 },
      ]}
    />
  );
}
