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
    text: '#1E2A35',
    tint: '#E56B5D',
    background: '#F4EFE8',
    foreground: '#1E2A35',
    card: '#FEFCF8',
    cardForeground: '#1E2A35',
    primary: '#D96153',
    primaryForeground: '#FEFCF8',
    secondary: '#E9E0D6',
    secondaryForeground: '#11263D',
    muted: '#ECE5DC',
    mutedForeground: '#6C767B',
    accent: '#DDE9E0',
    accentForeground: '#2E5F52',
    destructive: '#B94F48',
    destructiveForeground: '#FEFCF8',
    border: '#DED5CB',
    input: '#CFC5BA',
    navy: '#143249',
    inkPanel: '#143249',
    teal: '#507A6F',
    amber: '#B97939',
    success: '#2D705B',
    warning: '#946326',
    onNavy: '#FEFCF8',
    onNavyMuted: '#C6D0D3',
    successSoft: '#E2EFE7',
    warningSoft: '#F3E8D7',
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
  },
  radius: 18,
};

export default colors;
