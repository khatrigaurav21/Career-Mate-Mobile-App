// The details application forms ask for first, taken from the CV's own
// contact line so the person doesn't retype them on a phone keyboard.

export type ContactDetails = { first: string; family: string; email: string; phone: string };

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
const PHONE = /\+?\d[\d\s()-]{7,}\d/;

export function parseContact(name?: string | null, contactLine?: string | null): ContactDetails {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const family = parts.length > 1 ? parts[parts.length - 1] : '';
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? '';
  const line = contactLine ?? '';
  return {
    first: titleCase(first),
    family: titleCase(family),
    email: (line.match(EMAIL)?.[0] ?? '').toLowerCase(),
    phone: (line.match(PHONE)?.[0] ?? '').trim(),
  };
}

// CVs often have the name in capitals ("GAURAV KHATRI"); forms want "Gaurav".
function titleCase(text: string) {
  return text === text.toUpperCase()
    ? text.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (_, sep: string, c: string) => `${sep}${c.toUpperCase()}`)
    : text;
}
