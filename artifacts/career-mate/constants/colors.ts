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
    tint: '#E07A62',
    background: '#151412',
    foreground: '#F4EFE8',
    card: '#1F1D1A',
    cardForeground: '#F4EFE8',
    primary: '#E07A62',
    primaryForeground: '#1C1C19',
    secondary: '#7FD1A8',
    secondaryForeground: '#17221C',
    muted: '#2A2724',
    mutedForeground: '#BDB6AD',
    accent: '#1E3A2E',
    accentForeground: '#B7F3CD',
    destructive: '#FF9F94',
    destructiveForeground: '#1C1C19',
    border: '#3A3632',
    input: '#86766D',
    navy: '#F4EFE8',
    inkPanel: '#11251D',
    teal: '#7FD1A8',
    amber: '#F0BD70',
    success: '#7FD1A8',
    warning: '#F0BD70',
    onNavy: '#F4EFE8',
    onNavyMuted: '#D4E5DB',
    successSoft: '#1E3A2E',
    warningSoft: '#46351F',
    destructiveSoft: '#4B2928',
  },
  radius: 20,
};

export default colors;
