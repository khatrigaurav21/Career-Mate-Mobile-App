import type { CvContent, CvEdits, LetterContent, LetterEdits } from '@/lib/api';

// Lines the person has ticked on the "make it stronger" screen. They are held
// here, not saved one at a time, and applied together in one save, so the CV or
// letter is rebuilt once and the person sees one clear "updated" result.

export type StagedEdit = {
  /** CV: 'bullet' | 'summary'. Letter: 'achievement' | 'bridge'. */
  target: string;
  /** CV bullets: which job (index into the CV's experience). */
  job_index?: number | null;
  line: string;
};

export function cvEditsFrom(content: CvContent, staged: StagedEdit[]): CvEdits {
  const summaries = staged.filter((s) => s.target === 'summary');
  const jobs = content.experience ?? [];
  return {
    // The last summary the person added wins; it is a full rewrite.
    summary: summaries.length ? summaries[summaries.length - 1].line : content.summary ?? '',
    experience: jobs.map((job, i) => ({
      bullets: [...job.bullets, ...staged.filter((s) => s.target === 'bullet' && s.job_index === i).map((s) => s.line)],
    })),
    key_projects: (content.key_projects ?? []).map((p) => ({ description: p.description })),
  };
}

export function letterEditsFrom(content: LetterContent, staged: StagedEdit[]): LetterEdits {
  const bridges = staged.filter((s) => s.target === 'bridge');
  return {
    greeting: content.greeting ?? '',
    opening: content.opening ?? '',
    profile_intro: content.profile_intro ?? '',
    achievements: [...(content.achievements ?? []), ...staged.filter((s) => s.target === 'achievement').map((s) => s.line)],
    contribution: content.contribution ?? '',
    // One bridge sentence only: the last one added replaces the current one.
    bridge: bridges.length ? bridges[bridges.length - 1].line : content.bridge ?? '',
    closing: content.closing ?? '',
  };
}
