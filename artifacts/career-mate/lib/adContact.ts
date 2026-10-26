// Some ads name an email address to send your application to. Find it so the
// app can offer a ready message. Kept conservative: when the ad says not to
// email, or the only addresses are system ones, return nothing.

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const SYSTEM_ADDRESS = /^(no-?reply|do-?not-?reply|donotreply|privacy|unsubscribe|support|abuse|postmaster|webmaster)@/i;
const IMAGE_LIKE = /\.(png|jpe?g|gif|svg|webp)$/i;
const ONLINE_ONLY =
  /(do not|don'?t|please don'?t|no)\s+(send\s+)?(your\s+)?(applications?\s+)?(by\s+|via\s+)?e-?mail|no e-?mail(ed)? applications|e-?mail applications (will|can) not|apply online only|online applications only|applications? (must|should) be (made|submitted|lodged) (online|via|through)/i;

export function findAdEmail(description: string | null | undefined): string | null {
  if (!description) return null;
  if (ONLINE_ONLY.test(description)) return null;
  const found = description.match(EMAIL) ?? [];
  for (const raw of found) {
    const email = raw.replace(/[.,;:]+$/, '');
    if (SYSTEM_ADDRESS.test(email) || IMAGE_LIKE.test(email)) continue;
    return email.toLowerCase();
  }
  return null;
}

/** A short, plain first message. The person adds their own line and attaches the files. */
export function draftApplicationEmail({ title, company, name }: { title?: string | null; company?: string | null; name?: string | null }) {
  const role = title || 'this role';
  const at = company ? ` at ${company}` : '';
  const subject = `Application: ${role}${name ? ` – ${name}` : ''}`;
  const body = [
    'Hi,',
    '',
    `I'd like to apply for the ${role} role${at}. My CV and a cover letter are attached.`,
    '',
    '[Add one line on why this role suits you]',
    '',
    'Thanks for your time,',
    name || '[Your name]',
  ].join('\n');
  return { subject, body };
}
