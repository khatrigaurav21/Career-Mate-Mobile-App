import { parseReport } from '@/lib/reportParse';
import type { Block } from '@/lib/reportParse';

/**
 * Pulls the three short lists the job screens show out of the evaluation
 * report: where you match, where you fall short, and what to change. It reads
 * the report's own text (section B's requirement table, section E's plan), and
 * returns empty lists when the text isn't in a shape it recognises, so a screen
 * can fall back to the full report instead of showing something invented.
 */

type TableBlock = Extract<Block, { kind: 'table' }>;
type ListBlock = Extract<Block, { kind: 'list' }>;

export type MatchKind = 'strong' | 'partial' | 'missing';
export type MatchRow = { requirement: string; kind: MatchKind; detail: string };

const clean = (s: string) => s.replace(/\*\*/g, '').replace(/[`_]/g, '').replace(/\s+/g, ' ').trim();

function kindOf(cell: string): MatchKind | null {
  const v = cell.toLowerCase();
  if (/strong|✅|✔/.test(v)) return 'strong';
  if (/partial|⚠/.test(v)) return 'partial';
  if (/missing|❌|no match|gap/.test(v)) return 'missing';
  return null;
}

function shorten(text: string, max = 140) {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 60)).replace(/[,;:.\s]+$/, '') + '…';
}

export function summariseMatch(sectionB?: string): { strong: MatchRow[]; gaps: MatchRow[]; counts: Record<MatchKind, number> } {
  const counts: Record<MatchKind, number> = { strong: 0, partial: 0, missing: 0 };
  const table = parseReport(sectionB ?? '').find((b): b is TableBlock => b.kind === 'table');
  if (!table) return { strong: [], gaps: [], counts };

  const idx = (re: RegExp) => table.headers.findIndex((h) => re.test(h));
  const reqIdx = Math.max(idx(/requirement/i), 0);
  const matchIdx = idx(/^\s*match/i);
  const evidenceIdx = idx(/evidence|gap/i);
  if (matchIdx < 0) return { strong: [], gaps: [], counts };

  const rows: MatchRow[] = [];
  for (const cells of table.rows) {
    const kind = kindOf(cells[matchIdx] ?? '');
    if (!kind) continue;
    counts[kind] += 1;
    rows.push({ requirement: shorten(cells[reqIdx] ?? '', 80), kind, detail: shorten(cells[evidenceIdx >= 0 ? evidenceIdx : reqIdx] ?? '') });
  }
  return { strong: rows.filter((r) => r.kind === 'strong'), gaps: rows.filter((r) => r.kind !== 'strong'), counts };
}

/** Up to four things to change before applying, from section E (or null if it has none). */
export function summariseChanges(sectionE?: string): string[] {
  const blocks = parseReport(sectionE ?? '');
  const list = blocks.find((b): b is ListBlock => b.kind === 'list');
  if (list && list.items.length) return list.items.slice(0, 4).map((i) => shorten(i, 200));
  const paragraph = blocks.find((b) => b.kind === 'paragraph');
  if (paragraph && paragraph.kind === 'paragraph') {
    return paragraph.text.split(/(?<=[.!?])\s+/).map((s) => shorten(s, 200)).filter(Boolean).slice(0, 3);
  }
  return [];
}
