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
    background: '#F7F2EB',
    foreground: '#1E2A35',
    card: '#FFFDFC',
    cardForeground: '#1E2A35',
    primary: '#E56B5D',
    primaryForeground: '#FFFDFC',
    secondary: '#E8E1D8',
    secondaryForeground: '#11263D',
    muted: '#EEE8E0',
    mutedForeground: '#6F777D',
    accent: '#D8E7DF',
    accentForeground: '#2E5F52',
    destructive: '#C6534C',
    destructiveForeground: '#FFFDFC',
    border: '#DDD4CA',
    input: '#D7CEC4',
    navy: '#11263D',
    teal: '#5A8778',
    amber: '#C68B4A',
    success: '#2E765E',
    warning: '#9C6A28',
  },
  dark: {
    text: '#F7F2EB',
    tint: '#F18272',
    background: '#11263D',
    foreground: '#F7F2EB',
    card: '#1A334B',
    cardForeground: '#F7F2EB',
    primary: '#F18272',
    primaryForeground: '#11263D',
    secondary: '#26425B',
    secondaryForeground: '#F7F2EB',
    muted: '#1C374E',
    mutedForeground: '#B9C2C5',
    accent: '#2A544C',
    accentForeground: '#D8E7DF',
    destructive: '#EF776D',
    destructiveForeground: '#11263D',
    border: '#31516A',
    input: '#35566E',
    navy: '#F7F2EB',
    teal: '#9AC8B5',
    amber: '#E4B46D',
    success: '#9AC8B5',
    warning: '#E4B46D',
  },
  radius: 18,
};

export default colors;
