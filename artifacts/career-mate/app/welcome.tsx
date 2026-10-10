import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/lib/onboarding';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button } from '@/components/ui';

type Slide = {
  icon: keyof typeof Feather.glyphMap;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

// Copy follows DESIGN.md's rules: no claims the app can't back (no
// "verified", no auto-apply, no notifications), Seek always means paste,
// and visa checks are guidance only.
const SLIDES: Slide[] = [
  {
    icon: 'compass',
    eyebrow: 'Welcome to Career Mate',
    title: 'Know if a job is worth your time',
    body: 'Give Career Mate a job ad and it scores how well you fit, using your CV — in about a minute.',
    points: ['A fit score out of 5', 'Where you match and where you fall short', 'What to change before you apply'],
  },
  {
    icon: 'shield',
    eyebrow: 'Work rights',
    title: 'Can you legally take it?',
    body: 'Every job is checked against the work rights you set, including regional 491 and 494 visa conditions.',
    points: ['Eligible, check, or not on your visa', 'The line in the ad it’s based on', 'Guidance only — confirm anything unusual with a registered migration agent'],
  },
  {
    icon: 'file-text',
    eyebrow: 'Apply',
    title: 'A CV tailored to each job',
    body: 'Turn any evaluated job into a tailored CV and a cover letter, built only from what’s in your CV.',
    points: ['PDFs you can open and share', 'Nothing invented — your real experience, reordered for the role'],
  },
  {
    icon: 'flag',
    eyebrow: 'Track',
    title: 'From applied to offer',
    body: 'Mark where you are with each job. Career Mate keeps track and helps at each step.',
    points: ['A nudge to follow up, with an email drafted for you', 'Interview prep with answers from your CV', 'Job titles you’re not searching for yet'],
  },
  {
    icon: 'share-2',
    eyebrow: 'Adding jobs',
    title: 'Bring jobs in your way',
    body:
      Platform.OS === 'android'
        ? 'Share a job link from LinkedIn or a company site straight to Career Mate, or paste it into Evaluate.'
        : 'Copy a job link from LinkedIn or a company site and paste it into Evaluate.',
    points: ['Seek ads: copy the job description text and paste it in', 'Got the ad as a file? Upload a PDF or Word document'],
  },
];

export default function Welcome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, hydrated } = useAuth();
  const { markWelcomeSeen } = useOnboarding();
  const [index, setIndex] = useState(0);

  if (hydrated && !session) return <Redirect href="/" />;

  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;
  const finish = (to: '/(tabs)' | '/(tabs)/submit') => {
    void markWelcomeSeen();
    router.replace(to);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, paddingHorizontal: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
        <View accessibilityRole="progressbar" accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`} style={{ flexDirection: 'row', gap: 6 }}>
          {SLIDES.map((_, i) => (
            <View key={i} style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= index ? colors.primary : colors.border }} />
          ))}
        </View>
        {!last && (
          <Pressable onPress={() => finish('/(tabs)')} accessibilityRole="button" accessibilityLabel="Skip the tour" style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }}>
            <Text style={[type.bodySemibold, { color: colors.mutedForeground }]}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={slide.icon} size={32} color={colors.teal} />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={[type.labelEyebrow, { color: colors.teal }]}>{slide.eyebrow}</Text>
          <Text accessibilityRole="header" style={[type.headlineHero, { color: colors.navy }]}>{slide.title}</Text>
          <Text style={[type.bodyLg, { color: colors.foreground }]}>{slide.body}</Text>
        </View>
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 12 }}>
          {slide.points.map((point) => (
            <View key={point} style={{ flexDirection: 'row', gap: 10 }}>
              <Feather name="check" size={16} color={colors.success} style={{ marginTop: 3 }} />
              <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{point}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {last ? (
          <>
            <Button onPress={() => finish('/(tabs)/submit')} icon="arrow-right">Evaluate my first job</Button>
            <Button variant="ghost" onPress={() => finish('/(tabs)')}>Look around first</Button>
          </>
        ) : (
          <>
            <Button onPress={() => setIndex(index + 1)} icon="arrow-right">Next</Button>
            {index > 0 && <Button variant="ghost" onPress={() => setIndex(index - 1)}>Back</Button>}
          </>
        )}
      </View>
    </View>
  );
}
