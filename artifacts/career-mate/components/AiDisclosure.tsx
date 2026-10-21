import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useColors } from '@/hooks/useColors';
import { PRIVACY_POLICY_URL } from '@/lib/config';

// One plain statement of what is sent, to whom and why. Mirrors the privacy
// policy; if that changes, change this and bump AI_CONSENT_VERSION.
const POINTS: { icon: keyof typeof Feather.glyphMap; title: string; body: string }[] = [
  {
    icon: 'send',
    title: 'What is sent',
    body: 'Your CV text, the job ads you add, the work rights you choose, and any application question you ask Trozi to answer.',
  },
  {
    icon: 'cpu',
    title: 'Who receives it',
    body: 'Google’s Gemini AI, on its paid tier. Under Google’s terms for that tier, Google doesn’t use it to improve its products.',
  },
  {
    icon: 'edit-3',
    title: 'Why',
    body: 'To check a job against your work rights, score your fit, and write your CV, cover letter, answers and interview prep.',
  },
  {
    icon: 'lock',
    title: 'What we don’t do',
    body: 'We don’t sell your data or show ads. You can delete a job, or your whole account, from the app at any time.',
  },
];

export function AiDisclosure() {
  const colors = useColors();
  return (
    <View style={{ gap: 14 }}>
      {POINTS.map((p) => (
        <View key={p.title} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={p.icon} size={17} color={colors.accentForeground} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>{p.title}</Text>
            <Text style={{ color: colors.foreground, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, lineHeight: 21 }}>{p.body}</Text>
          </View>
        </View>
      ))}
      <Text
        onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
        accessibilityRole="link"
        style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, textDecorationLine: 'underline' }}
      >
        Read the full privacy policy
      </Text>
    </View>
  );
}
