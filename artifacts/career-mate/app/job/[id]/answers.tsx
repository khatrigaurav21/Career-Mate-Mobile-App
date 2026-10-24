import React from 'react';
import { router } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { ApplicationAnswers } from '@/components/ApplicationAnswers';

// Application questions on their own screen: paste a question, get an answer drawn from your CV.
export default function AnswersStep() {
  return (
    <JobGate>
      {(job, id) => (
        <StepScreen
          eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
          title="Application questions"
          primary={{ label: 'Next: interview prep', onPress: () => router.push(`/prep/${id}`) }}
        >
          <ApplicationAnswers jobId={job.job_id} />
        </StepScreen>
      )}
    </JobGate>
  );
}
