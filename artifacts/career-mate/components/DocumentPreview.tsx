import React from 'react';
import { Text, View, type TextStyle } from 'react-native';
import type { CvContent, LetterContent } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

// The CV and cover letter as text on the screen, so the person can read what
// was made without opening a PDF. It mirrors the PDF's order and wording.

function Card({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <View style={{ gap: 12, padding: 18, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>{children}</View>;
}

function Heading({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[type.labelEyebrow, { color: colors.teal, marginTop: 4 }]}>{children.toUpperCase()}</Text>;
}

const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1');

export function CvPreview({ content }: { content: CvContent }) {
  const colors = useColors();
  const body: TextStyle[] = [type.bodyMd, { color: colors.foreground }];
  return (
    <Card>
      <View style={{ gap: 2 }}>
        <Text style={[type.headlineLg, { color: colors.navy }]}>{content.name}</Text>
        {content.headline ? <Text style={[type.bodySemibold, { color: colors.teal }]}>{content.headline}</Text> : null}
        {content.contact_line ? <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{content.contact_line}</Text> : null}
      </View>

      {content.summary ? (<><Heading>Summary</Heading><Text style={body}>{content.summary}</Text></>) : null}
      {content.core_competencies?.length ? (<><Heading>Core capabilities</Heading><Text style={body}>{content.core_competencies.join('  |  ')}</Text></>) : null}

      {content.experience?.length ? <Heading>Experience</Heading> : null}
      {(content.experience ?? []).map((job, i) => (
        <View key={i} style={{ gap: 4 }}>
          <Text style={[type.bodySemibold, { color: colors.navy }]}>{[job.title, job.company].filter(Boolean).join(', ')}</Text>
          <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{[job.dates, job.location].filter(Boolean).join('  ·  ')}</Text>
          {job.bullets.map((b, j) => (
            <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>•</Text>
              <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{plain(b)}</Text>
            </View>
          ))}
        </View>
      ))}

      {content.key_projects?.length ? <Heading>Projects</Heading> : null}
      {(content.key_projects ?? []).map((p, i) => (
        <View key={i} style={{ gap: 2 }}>
          <Text style={[type.bodySemibold, { color: colors.navy }]}>{p.name}</Text>
          <Text style={body}>{p.description}</Text>
        </View>
      ))}

      {content.education?.length || content.certifications?.length ? <Heading>Qualifications</Heading> : null}
      {(content.education ?? []).map((e, i) => (
        <Text key={`e${i}`} style={body}>{[e.degree, e.institution, e.year].filter(Boolean).join(', ')}</Text>
      ))}
      {(content.certifications ?? []).map((c, i) => (
        <Text key={`c${i}`} style={body}>{[c.name, c.issuer, c.year].filter(Boolean).join(', ')}</Text>
      ))}

      {content.skill_groups?.length ? <Heading>Skills</Heading> : null}
      {(content.skill_groups ?? []).map((g, i) => (
        <Text key={i} style={body}>
          <Text style={type.bodySemibold}>{g.category}: </Text>{(g.items ?? []).join(', ')}
        </Text>
      ))}

      {content.additional_information?.length ? (<><Heading>Additional information</Heading>{content.additional_information.map((l, i) => <Text key={i} style={body}>{l}</Text>)}</>) : null}
    </Card>
  );
}

export function LetterPreview({ content }: { content: LetterContent }) {
  const colors = useColors();
  const body: TextStyle[] = [type.bodyMd, { color: colors.foreground }];
  return (
    <Card>
      {content.greeting ? <Text style={body}>{content.greeting}</Text> : null}
      {content.opening ? <Text style={body}>{content.opening}</Text> : null}
      {content.profile_intro ? <Text style={body}>{content.profile_intro}</Text> : null}
      {(content.achievements ?? []).map((a, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>•</Text>
          <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{plain(a)}</Text>
        </View>
      ))}
      {content.contribution ? <Text style={body}>{content.contribution}</Text> : null}
      {content.bridge ? <Text style={body}>{content.bridge}</Text> : null}
      {content.closing ? <Text style={body}>{content.closing}</Text> : null}
      <Text style={body}>{`Sincerely,\n${content.candidate_name ?? ''}`}</Text>
    </Card>
  );
}
