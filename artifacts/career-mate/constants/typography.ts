import type { TextStyle } from 'react-native';

/**
 * Type scale from the "Warm Editorial Career Coach" design system (Stitch),
 * kept in step with DESIGN.md. Nothing renders below 12pt; body and card
 * titles are 16pt. Use these instead of ad-hoc fontSize values.
 */
export const type = {
  headlineHero: { fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 40, letterSpacing: -1.2 },
  headlineLg: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  headlineMd: { fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  headlineSm: { fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 24 },
  titleCard: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 22 },
  bodyLg: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  bodySemibold: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  labelPill: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  labelEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
  labelCaption: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;
