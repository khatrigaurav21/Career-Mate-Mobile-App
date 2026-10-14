/**
 * Reads what someone put in the Evaluate box: a job link (possibly wrapped in
 * a short share message) or the ad's own text. Decides how the job is sent, so
 * there's no "Link or Paste?" question to answer first.
 */
export const MIN_AD_TEXT = 80;
// Share sheets often send "Check out this job at X: https://…". Text this
// short around a single link is the link, not the ad.
const MAX_TEXT_AROUND_LINK = 200;

export function readEntry(raw: string): { kind: 'empty' } | { kind: 'link'; url: string } | { kind: 'text'; text: string } {
  const value = raw.trim();
  if (!value) return { kind: 'empty' };
  const links = value.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  if (links.length === 1 && value.replace(links[0], '').trim().length <= MAX_TEXT_AROUND_LINK) {
    return { kind: 'link', url: links[0].replace(/[).,;]+$/, '') };
  }
  return { kind: 'text', text: value };
}
