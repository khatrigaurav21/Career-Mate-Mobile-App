import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import { DEFAULT_LETTER_OPTIONS, countChars, letterToText } from '@/lib/letterText';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button } from '@/components/ui';

const LIMITS = [1000, 2000, 4000];

/**
 * For forms that want the letter pasted in rather than uploaded: the letter as
 * clean text, a character count against a chosen limit, and two switches that
 * shorten it without rewriting anything. Copy puts it on the clipboard.
 */
export function CoverLetterText({ jobId, version }: { jobId: string; version?: string }) {
  const colors = useColors();
  const letter = useQuery({ queryKey: ['letter', jobId, version], queryFn: () => api.getCoverLetter(jobId), retry: false });
  const [options, setOptions] = useState(DEFAULT_LETTER_OPTIONS);
  const [limit, setLimit] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (!letter.data) return null;
  const text = letterToText(letter.data.content, options);
  const count = countChars(text);
  const over = limit !== null && count > limit;

  const copy = () =>
    void Clipboard.setStringAsync(text)
      .then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setCopied(true);
      })
      .catch(() => {});

  const toggle = (key: keyof typeof options, label: string) => (
    <Pressable
      onPress={() => { setCopied(false); setOptions((o) => ({ ...o, [key]: !o[key] })); }}
      accessibilityRole="switch"
      accessibilityState={{ checked: options[key] }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: options[key] ? colors.primary : colors.input, backgroundColor: options[key] ? colors.primary : 'transparent' }} />
      <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
      <Text style={[type.titleCard, { color: colors.navy }]}>Paste it into the application</Text>
      <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>For forms with a text box instead of an upload.</Text>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {LIMITS.map((n) => {
          const selected = limit === n;
          return (
            <Pressable
              key={n}
              onPress={() => setLimit(selected ? null : n)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Limit of ${n.toLocaleString()} characters`}
              style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 99, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.primary : colors.border, justifyContent: 'center' }}
            >
              <Text style={[type.labelPill, { color: colors.navy }]}>{n.toLocaleString()} max</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[type.bodySemibold, { color: over ? colors.destructive : colors.success }]}>
        {count.toLocaleString()} characters{limit !== null ? (over ? `, ${(count - limit).toLocaleString()} over` : `, fits in ${limit.toLocaleString()}`) : ''}
      </Text>
      {over ? <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>Try the switches below, or edit the letter to shorten it.</Text> : null}

      {toggle('bullets', 'Include the achievement lines')}
      {toggle('salutation', 'Include "Dear…" and the sign-off')}

      <Text selectable numberOfLines={8} style={[type.bodyMd, { color: colors.foreground, padding: 12, borderRadius: 14, backgroundColor: colors.background }]}>{text}</Text>

      <Button onPress={copy} icon={copied ? 'check' : 'copy'}>{copied ? 'Copied' : 'Copy as text'}</Button>
    </View>
  );
}
