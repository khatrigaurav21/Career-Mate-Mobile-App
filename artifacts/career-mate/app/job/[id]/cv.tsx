import React from 'react';
import { JobGate } from '@/components/JobGate';
import { DocumentFlow } from '@/components/DocumentFlow';
import type { FlowSuggestion } from '@/components/DocumentFlow';
import { CvPreview } from '@/components/DocumentPreview';
import { CvNotes } from '@/components/CvNotes';
import { api } from '@/lib/api';
import type { CvContent, JobDetail } from '@/lib/api';
import { summariseChanges, summariseMatch } from '@/lib/reportSummary';
import { cvEditsFrom } from '@/lib/stagedEdits';

// Your tailored CV, start to finish on one screen: it is built when you arrive,
// shown for you to read, then you add points and press Update once. See
// DocumentFlow for the steps.
export default function CvStep() {
  return <JobGate>{(job, id) => <CvBody job={job} id={id} />}</JobGate>;
}

function CvBody({ job, id }: { job: JobDetail; id: string }) {
  const changes = summariseChanges(job.report?.E);
  const gaps = summariseMatch(job.report?.B).gaps.slice(0, 4);
  const suggestions: FlowSuggestion[] = [
    ...changes.map((text, i) => ({ key: `c${i}`, text })),
    ...gaps.map((row, i) => ({
      key: `g${i}`,
      text: row.requirement,
      heading: `${row.requirement} (${row.kind === 'missing' ? 'missing' : 'partial'})`,
      detail: row.detail,
      request: `Show evidence that the candidate meets this requirement, using only what their profile supports: ${row.requirement}. ${row.detail}`.slice(0, 780),
    })),
  ];

  return (
    <DocumentFlow<CvContent>
      job={job}
      jobId={id}
      noun="CV"
      docKey="cv"
      queryKey="cv"
      generate={() => api.generateCv(id)}
      loadContent={() => api.getCv(id)}
      save={(content, staged, { allowExtraPage }) => api.saveCv(id, cvEditsFrom(content, staged), allowExtraPage)}
      renderPreview={(content) => <CvPreview content={content} />}
      renderNotes={(content) => <CvNotes notes={content.notes} />}
      suggestions={suggestions}
      suggestionDoc="cv"
      nextLabel="Next: cover letter"
      nextTo={`/job/${id}/letter`}
      editPath={`/cv/${id}`}
      progressSteps={[
        { label: 'Pulling your strongest matches', estimatedMs: 25000 },
        { label: 'Writing the draft', estimatedMs: 35000 },
        { label: 'Formatting the PDF', estimatedMs: 30000 },
      ]}
    />
  );
}
