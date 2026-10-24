import React from 'react';
import { router } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { WorkRightsCheck } from '@/components/WorkRightsCheck';

// Step 1 of 5: can you take this job? Just the verdict, the line in the ad
// that decides it, and the guidance-only note.
export default function VerdictStep() {
  return (
    <JobGate>
      {(job, id) => (
        <StepScreen
          eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
          title="Can you take it?"
          progress={{ step: 1, of: 5 }}
          primary={{ label: 'Next: how well you fit', onPress: () => router.push(`/job/${id}/fit`) }}
        >
          <WorkRightsCheck job={job} />
        </StepScreen>
      )}
    </JobGate>
  );
}
