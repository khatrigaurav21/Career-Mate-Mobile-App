export const API_BASE_URL =
  process.env.EXPO_PUBLIC_CAREER_MATE_API_URL ??
  'https://career-mate-api.onrender.com';

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