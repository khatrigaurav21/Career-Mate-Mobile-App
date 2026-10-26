import React from 'react';
import { router } from 'expo-router';
import { JobGate } from '@/components/JobGate';
import { StepScreen } from '@/components/StepScreen';
import { ApplicationAnswers } from '@/components/ApplicationAnswers';
import { useMarkSeen } from '@/lib/jobProgress';
import type { JobDetail } from '@/lib/api';

// Application questions on their own screen: paste a question, get an answer
// drawn from your CV. Opening it ticks the step.
export default function AnswersStep() {
  return <JobGate>{(job, id) => <AnswersBody job={job} id={id} />}</JobGate>;
}

function AnswersBody({ job, id }: { job: JobDetail; id: string }) {
  useMarkSeen(id, 'questions');
  return (
    <StepScreen
      eyebrow={[job.title, job.company].filter(Boolean).join(' · ') || 'This job'}
      title="Application questions"
      primary={{ label: 'Next: interview prep', onPress: () => router.push(`/prep/${id}`) }}
    >
      <ApplicationAnswers jobId={job.job_id} />
    </StepScreen>
  );
}
