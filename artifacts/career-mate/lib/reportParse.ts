// Pure parsing of an evaluation section's text into blocks. No React here, so it
// can be tested on its own and reused by the job screens' summaries.

export type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'facts'; facts: { label: string; value: string }[] }
  | { kind: 'callout'; label: string; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };

// "Role Summary — archetype: ..." repeats the section title; drop that lead-in.
function stripLeadTitle(text: string) {
  return text.replace(/^\s*[A-Z][A-Za-z &/]{2,40}\s+—\s*/, '');
}

function splitCells(line: string) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

// A run like "archetype: X, domain: Y, TL;DR: Z" becomes label/value pairs.
function parseFacts(text: string) {
  const parts = text.split(/(?:,|(?<=\.))\s*(?=[A-Za-z][A-Za-z ;/]{1,24}:\s)/);
  const facts = parts.map((p) => {
    const m = p.match(/^([A-Za-z][A-Za-z ;/]{1,24}):\s*([\s\S]+)$/);
    return m ? { label: m[1].trim(), value: m[2].trim() } : null;
  });
  return facts.length >= 3 && facts.every(Boolean) ? (facts as { label: string; value: string }[]) : null;
}

function isCallout(label: string) {
  return /^(tl;?dr|summary|verdict)$/i.test(label);
}

function paragraphBlocks(text: string): Block[] {
  const facts = parseFacts(text);
  if (!facts) return [{ kind: 'paragraph', text }];
  // Long facts (TL;DR, culture screen) read better as their own callouts.
  const short = facts.filter((f) => f.value.length <= 60 && !isCallout(f.label));
  const long = facts.filter((f) => !short.includes(f));
  const blocks: Block[] = [];
  const tldr = long.find((f) => isCallout(f.label));
  if (tldr) blocks.push({ kind: 'callout', label: 'TL;DR', text: tldr.value });
  if (short.length) blocks.push({ kind: 'facts', facts: short });
  long.filter((f) => f !== tldr).forEach((f) => blocks.push({ kind: 'callout', label: f.label, text: f.value }));
  return blocks;
}

export function parseReport(raw: string): Block[] {
  const lines = stripLeadTitle(raw).split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) tableLines.push(lines[i++]);
      const rows = tableLines.map(splitCells).filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c)));
      if (rows.length > 1) blocks.push({ kind: 'table', headers: rows[0], rows: rows.slice(1) });
      else rows.forEach((r) => blocks.push({ kind: 'paragraph', text: r.join(' · ') }));
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      blocks.push({ kind: 'heading', text: heading[1].replace(/\s+Section$/i, '') });
      i++;
      continue;
    }
    const listMatch = line.match(/^(\d+[.)]|[-*•])\s+/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items: string[] = [];
      while (i < lines.length && /^(\d+[.)]|[-*•])\s+/.test(lines[i])) items.push(lines[i++].replace(/^(\d+[.)]|[-*•])\s+/, ''));
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }
    const labelLine = line.match(/^([A-Z][A-Za-z ]{1,30}):\s+([\s\S]+)$/);
    if (labelLine && !parseFacts(line)) {
      // Consecutive "Label: value" lines (section D) group into one fact list.
      const facts: { label: string; value: string }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^([A-Z][A-Za-z ]{1,30}):\s+([\s\S]+)$/);
        if (!m) break;
        facts.push({ label: m[1], value: m[2] });
        i++;
      }
      blocks.push({ kind: 'facts', facts });
      continue;
    }
    blocks.push(...paragraphBlocks(line));
    i++;
  }
  return blocks;
}
