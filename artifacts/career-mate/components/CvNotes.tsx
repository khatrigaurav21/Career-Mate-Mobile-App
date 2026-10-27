import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CvNotes as Notes } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

/**
 * What the CV doesn't print: where it matches the ad, what the ad asks for that
 * the record doesn't support, and any facts still to confirm before sending.
 */
export function CvNotes({ notes }: { notes?: Notes | null }) {
  const colors = useColors();
  if (!notes) return null;
  type Section = { icon: keyof typeof Feather.glyphMap; title: string; items: string[]; tone: string; bg: string };
  const all: Section[] = [
    { icon: 'check-circle', title: 'Strongest matches', items: notes.strongest_matches ?? [], tone: colors.success, bg: colors.successSoft },
    { icon: 'alert-circle', title: 'Not shown in your record', items: notes.unsupported_requirements ?? [], tone: colors.warning, bg: colors.warningSoft },
    { icon: 'help-circle', title: 'Check before you send', items: notes.questions ?? [], tone: colors.warning, bg: colors.warningSoft },
  ];
  const sections = all.filter((s) => s.items.length > 0);
  if (sections.length === 0) return null;
  return (
    <View style={{ gap: 10 }}>
      {sections.map((s) => (
        <View key={s.title} style={{ gap: 8, padding: 14, borderRadius: 16, backgroundColor: s.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name={s.icon} size={16} color={s.tone} />
            <Text style={[type.titleCard, { color: s.tone }]}>{s.title}</Text>
          </View>
          {s.items.map((item, i) => <Text key={i} style={[type.bodyMd, { color: colors.foreground }]}>{item}</Text>)}
        </View>
      ))}
    </View>
  );
}
