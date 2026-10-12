import type { TextStyle } from 'react-native';

/**
 * Type scale aligned with the Terracotta & Eucalyptus Career Mate direction.
 * Body and card titles are at least 16pt; labels stay at least 12pt.
 */
export const type = {
  headlineHero: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 34, lineHeight: 42, letterSpacing: -1.2 },
  headlineLg: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  headlineMd: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, lineHeight: 30, letterSpacing: -0.3 },
  headlineSm: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, lineHeight: 28 },
  titleCard: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, lineHeight: 24 },
  bodyLg: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, lineHeight: 26 },
  bodyMd: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, lineHeight: 24 },
  bodySemibold: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, lineHeight: 22 },
  labelPill: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  labelEyebrow: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
  labelCaption: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;
