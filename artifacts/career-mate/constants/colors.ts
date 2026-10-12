/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#1C1C19',
    tint: '#A83223',
    background: '#FCF9F4',
    foreground: '#1C1C19',
    card: '#FFFFFF',
    cardForeground: '#1C1C19',
    primary: '#A83223',
    primaryForeground: '#FFFFFF',
    secondary: '#2C694E',
    secondaryForeground: '#FFFFFF',
    muted: '#F0EDE9',
    mutedForeground: '#58413D',
    accent: '#AEEECB',
    accentForeground: '#316E52',
    destructive: '#BA1A1A',
    destructiveForeground: '#FFFFFF',
    border: '#E5E2DD',
    input: '#8C716C',
    navy: '#1C1C19',
    inkPanel: '#0E1E23',
    teal: '#2C694E',
    amber: '#946326',
    success: '#2C694E',
    warning: '#946326',
    onNavy: '#FFFFFF',
    onNavyMuted: '#D4E5ED',
    successSoft: '#AEEECB',
    warningSoft: '#FFEDDB',
    destructiveSoft: '#FFDAD6',
  },
  dark: {
    text: '#F4EFE8',
    tint: '#F18272',
    background: '#10283D',
    foreground: '#F4EFE8',
    card: '#19364E',
    cardForeground: '#F4EFE8',
    primary: '#F18272',
    primaryForeground: '#10283D',
    secondary: '#26425B',
    secondaryForeground: '#F4EFE8',
    muted: '#1C374E',
    mutedForeground: '#B9C2C5',
    accent: '#2C554D',
    accentForeground: '#D8E7DF',
    destructive: '#EF776D',
    destructiveForeground: '#10283D',
    border: '#31516A',
    input: '#35566E',
    navy: '#F4EFE8',
    inkPanel: '#0C2235',
    teal: '#9AC8B5',
    amber: '#E4B46D',
    success: '#9AC8B5',
    warning: '#E4B46D',
    onNavy: '#F4EFE8',
    onNavyMuted: '#BFCACE',
    successSoft: '#21473F',
    warningSoft: '#4A3A29',
    destructiveSoft: '#4B2C30',
  },
  radius: 20,
};

export default colors;
