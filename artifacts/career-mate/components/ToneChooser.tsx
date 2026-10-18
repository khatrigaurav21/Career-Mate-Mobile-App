import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LETTER_TONES } from '@/lib/api';
import type { LetterTone } from '@/lib/api';
import { useColors } from '@/hooks/useColors';

/** Three chips for how the cover letter should sound, with a one-line hint for the chosen one. */
export function ToneChooser({ value, onChange }: { value: LetterTone; onChange: (tone: LetterTone) => void }) {
  const colors = useColors();
  const current = LETTER_TONES.find((t) => t.key === value) ?? LETTER_TONES[0];
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>How should it sound?</Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {LETTER_TONES.map((t) => {
          const selected = t.key === value;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                borderRadius: 99,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.accent : colors.card,
              }}
            >
              <Text style={{ color: selected ? colors.primary : colors.foreground, fontFamily: selected ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 }}>{current.hint}</Text>
    </View>
  );
}
