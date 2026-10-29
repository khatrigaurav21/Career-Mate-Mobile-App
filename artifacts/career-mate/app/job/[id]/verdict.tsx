import React from 'react';
import { router } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { WorkRightsCheck } from '@/components/WorkRightsCheck';
import { useMarkSeen } from '@/lib/jobProgress';
import type { JobDetail } from '@/lib/api';

// Step 1 of 5: can you take this job? Just the verdict, the line in the ad
// that decides it, and the guidance-only note. Opening it ticks the step.
export default function VerdictStep() {
  return <JobGate>{(job, id) => <VerdictBody job={job} id={id} />}</JobGate>;
}

function VerdictBody({ job, id }: { job: JobDetail; id: string }) {
  useMarkSeen(id, 'verdict');
  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Can you take it?"
      progress={{ step: 1, of: 4 }}
      primary={{ label: 'Next: how well you fit', onPress: () => router.push(`/job/${id}/fit`) }}
    >
      <WorkRightsCheck job={job} />
    </StepScreen>
  );
}
