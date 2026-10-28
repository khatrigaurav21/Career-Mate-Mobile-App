import type { LetterContent } from '@/lib/api';

// The cover letter as plain text for an application form's text box. A PDF
// copied out of a viewer comes with broken line breaks and lost hyphens, so
// build the text from the saved fields instead: one paragraph per block, in
// the same order as the PDF.

export type LetterTextOptions = {
  /** Keep the achievements as short lines. Off folds them into nothing, for tight limits. */
  bullets: boolean;
  /** Keep "Dear ..." and the sign-off. Many forms have their own name fields. */
  salutation: boolean;
};

export const DEFAULT_LETTER_OPTIONS: LetterTextOptions = { bullets: true, salutation: true };

export function letterToText(letter: LetterContent, options: LetterTextOptions = DEFAULT_LETTER_OPTIONS): string {
  const blocks: (string | undefined)[] = [
    options.salutation ? letter.greeting : undefined,
    letter.opening,
    letter.profile_intro,
    options.bullets && letter.achievements?.length ? letter.achievements.map((a) => `- ${a}`).join('\n') : undefined,
    letter.contribution,
    letter.bridge,
    letter.closing,
    options.salutation ? `Sincerely,\n${letter.candidate_name ?? ''}`.trim() : undefined,
  ];
  return blocks
    .map((b) => (b ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/[ \t]+\n/g, '\n').trim())
    .filter(Boolean)
    .join('\n\n');
}

/** Characters as a form counts them: every character, line breaks included. */
export const countChars = (text: string) => text.length;
