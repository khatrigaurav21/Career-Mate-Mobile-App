import React from 'react';
import { Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

// Renders an evaluation section's markdown-ish text as mobile-friendly blocks.
// The report comes from the LLM as prose, "label: value" runs, numbered lists
// and markdown tables; anything we can't recognise falls back to a readable
// paragraph, so a formatting surprise degrades gracefully instead of breaking.

type Colors = ReturnType<typeof useColors>;
type Tone = 'good' | 'mid' | 'bad' | 'neutral';

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'facts'; facts: { label: string; value: string }[] }
  | { kind: 'callout'; label: string; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };

const BODY = { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 } as const;

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

// **bold** → bold spans; strips stray markdown markers.
function Inline({ text, colors, style }: { text: string; colors: Colors; style?: object }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text style={[BODY, { color: colors.foreground }, style]}>
      {parts.map((p, idx) =>
        p.startsWith('**') ? (
          <Text key={idx} style={{ fontFamily: 'Inter_600SemiBold', color: colors.navy }}>{p.slice(2, -2)}</Text>
        ) : (
          p.replace(/(^|\s)[*_](\S)/g, '$1$2')
        ),
      )}
    </Text>
  );
}

function toneFor(value: string): Tone {
  const v = value.toLowerCase();
  if (/strong|critical|pass|high confidence/.test(v)) return v.includes('critical') ? 'bad' : 'good';
  if (/partial|high|medium|moderate/.test(v)) return 'mid';
  if (/missing|weak|none|gap|fail|no match/.test(v)) return 'bad';
  return 'neutral';
}

function Chip({ label, tone, colors }: { label: string; tone: Tone; colors: Colors }) {
  const palette = {
    good: [colors.successSoft, colors.success],
    mid: [colors.warningSoft, colors.warning],
    bad: [colors.destructiveSoft, colors.destructive],
    neutral: [colors.muted, colors.mutedForeground],
  }[tone];
  return (
    <View style={{ backgroundColor: palette[0], borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 }}>
      <Text style={{ color: palette[1], fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function Label({ children, colors }: { children: React.ReactNode; colors: Colors }) {
  return (
    <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 3 }}>
      {children}
    </Text>
  );
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function TableCards({ headers, rows, colors }: { headers: string[]; rows: string[][]; colors: Colors }) {
  const col = (re: RegExp) => headers.findIndex((h) => re.test(h));
  const importanceIdx = col(/importance|priority|weight/i);
  const matchIdx = col(/^match|fit|status/i);
  const evidenceIdx = col(/evidence|gap|notes?/i);
  const skipIdx = col(/jd signal|quote|source/i);
  const chipIdx = [importanceIdx, matchIdx].filter((x) => x > 0);

  const counts = matchIdx > 0
    ? rows.reduce<Record<string, number>>((acc, r) => {
        const key = capitalise((r[matchIdx] || '').toLowerCase());
        if (key) acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    : null;

  return (
    <View style={{ gap: 10 }}>
      {counts && (
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 14 }}>
          {Object.entries(counts).map(([k, n]) => `${n} ${k.toLowerCase()}`).join('  ·  ')}
        </Text>
      )}
      {rows.map((cells, r) => {
        const matchTone = matchIdx > 0 ? toneFor(cells[matchIdx] || '') : 'neutral';
        const evidenceLabel = matchTone === 'bad' || matchTone === 'mid' ? 'Gap' : 'Your evidence';
        return (
          <View key={r} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, gap: 10 }}>
            <Inline text={cells[0] || ''} colors={colors} style={{ fontFamily: 'Inter_600SemiBold', color: colors.navy, fontSize: 16, lineHeight: 22 }} />
            {chipIdx.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {chipIdx.map((idx) => cells[idx] ? (
                  <Chip key={idx} colors={colors}
                    label={idx === matchIdx ? `${capitalise(cells[idx])} match` : capitalise(cells[idx])}
                    tone={idx === importanceIdx ? (/critical/i.test(cells[idx]) ? 'bad' : /high/i.test(cells[idx]) ? 'mid' : 'neutral') : toneFor(cells[idx])} />
                ) : null)}
              </View>
            )}
            {cells.map((cell, idx) => {
              if (idx === 0 || chipIdx.includes(idx) || idx === skipIdx || !cell) return null;
              const label = idx === evidenceIdx ? evidenceLabel : headers[idx];
              return (
                <View key={idx}>
                  <Label colors={colors}>{label}</Label>
                  <Inline text={cell.replace(/^"|"$/g, '')} colors={colors} style={{ fontSize: 15, lineHeight: 22 }} />
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export function ReportView({ text }: { text: string }) {
  const colors = useColors();
  const blocks = parseReport(text);
  return (
    <View style={{ gap: 14 }}>
      {blocks.map((block, b) => {
        switch (block.kind) {
          case 'paragraph':
            return <Inline key={b} text={block.text} colors={colors} />;
          case 'heading':
            return <Text key={b} style={{ color: colors.navy, fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 6 }}>{block.text}</Text>;
          case 'callout':
            return (
              <View key={b} style={{ backgroundColor: colors.accent, borderRadius: 14, padding: 14 }}>
                <Label colors={colors}>{block.label}</Label>
                <Inline text={block.text} colors={colors} style={{ color: colors.accentForeground }} />
              </View>
            );
          case 'facts':
            return (
              <View key={b} style={{ gap: 12 }}>
                {block.facts.map((f, idx) => (
                  <View key={idx}>
                    <Label colors={colors}>{f.label}</Label>
                    <Inline text={f.value} colors={colors} />
                  </View>
                ))}
              </View>
            );
          case 'list':
            return (
              <View key={b} style={{ gap: 12 }}>
                {block.items.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: block.ordered ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      <Text style={{ color: colors.accentForeground, fontFamily: 'Inter_700Bold', fontSize: block.ordered ? 13 : 18 }}>{block.ordered ? idx + 1 : '•'}</Text>
                    </View>
                    <View style={{ flex: 1 }}><Inline text={item} colors={colors} /></View>
                  </View>
                ))}
              </View>
            );
          case 'table':
            return <TableCards key={b} headers={block.headers} rows={block.rows} colors={colors} />;
        }
      })}
    </View>
  );
}
