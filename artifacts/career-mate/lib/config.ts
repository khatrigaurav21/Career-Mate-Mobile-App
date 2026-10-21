export const API_BASE_URL =
  process.env.EXPO_PUBLIC_CAREER_MATE_API_URL ??
  'https://career-mate-api.onrender.com';

// On the Trozi website, not the API's address (which still serves the same
// pages for builds made before this).
export const PRIVACY_POLICY_URL = 'https://trozi.app/privacy';
export const TERMS_URL = 'https://trozi.app/terms';

export const SESSION_KEY = 'career_mate_session';

export const reportLabels: Record<string, string> = {
  A: 'Role snapshot',
  B: 'Requirement match',
  C: 'Positioning strategy',
  D: 'Compensation outlook',
  E: 'Customization plan',
  F: 'Interview prep',
  G: 'Posting legitimacy',
  H: 'Draft application answers',
};