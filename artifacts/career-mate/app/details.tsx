import React, { useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProfileDetails } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { ErrorNotice, Field, LoadingState, Screen } from '@/components/ui';
import { StepScreen } from '@/components/StepScreen';

type RoleAnswers = { scope: string; result: string; tools: string };
const BLANK: RoleAnswers = { scope: '', result: '', tools: '' };

// Optional profile details for improving tailored CVs, letters, answers and
// interview prep. Users can add these later from Profile or when a CV suggestion
// needs supporting information. One role per screen, skippable at any point.
export default function DetailsScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { session, hydrated, profile, refreshProfile } = useAuth();
  const colors = useColors();
  const saved = (profile?.preferences?.details ?? null) as ProfileDetails | null;
  const roles = useQuery({ queryKey: ['profile-roles', profile?.updated_at], queryFn: () => api.getProfileRoles(), enabled: !!session && !!profile?.cv_markdown, staleTime: Infinity });

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, RoleAnswers>>({});
  const [extras, setExtras] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const leave = () => router.replace(next === 'welcome' ? '/welcome' : '/(tabs)/profile');

  if (hydrated && !session) return <Redirect href="/" />;
  if (!hydrated || roles.isLoading) return <Screen scroll={false}><LoadingState title="Reading your roles" detail="Finding your recent jobs so we can ask about each." /></Screen>;

  const labels = roles.data?.roles ?? [];
  const get = (label: string): RoleAnswers => answers[label] ?? saved?.roles.find((r) => r.label === label) ?? BLANK;
  const set = (label: string, patch: Partial<RoleAnswers>) => setAnswers((a) => ({ ...a, [label]: { ...get(label), ...patch } }));
  const extrasText = extras ?? saved?.extras ?? '';
  const last = labels.length + 1; // intro = 0, roles = 1..n, extras = n+1

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.saveProfileDetails({
        roles: labels.map((label) => ({ label, ...get(label) })),
        extras: extrasText,
      });
      await refreshProfile();
      leave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We could not save that. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const back = step > 0 ? () => setStep(step - 1) : undefined;
  const skip = { label: 'Skip for now', onPress: leave };

  if (step === 0) {
    return (
      <StepScreen title="Add details when you’re ready" progress={{ step: 1, of: last + 1 }} onBack={leave} showHome={false} primary={{ label: labels.length ? 'Let’s go' : 'Add other work', onPress: () => setStep(labels.length ? 1 : last) }} secondary={skip}>
        <Text style={[type.bodyLg, { color: colors.foreground }]}>
          A few optional details—like team size, results and tools—can help strengthen tailored CVs and cover letters.
        </Text>
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
          Add them now, or skip and return later from Profile or when a CV suggestion needs more information.
        </Text>
        {roles.isError ? <ErrorNotice message="We couldn’t read your jobs from the CV. You can still add other work." /> : null}
      </StepScreen>
    );
  }

  if (step < last) {
    const label = labels[step - 1];
    const a = get(label);
    return (
      <StepScreen eyebrow={label} title="What did this job involve?" progress={{ step: step + 1, of: last + 1 }} onBack={back} showHome={false} primary={{ label: 'Next', onPress: () => setStep(step + 1) }} secondary={skip}>
        <Field label="How big was it?" helper="People you led, customers or cases a day, budget, anything with a number." value={a.scope} onChangeText={(v) => set(label, { scope: v })} multiline placeholder="e.g. Led 12 people handling about 400 customer queries a day" />
        <Field label="One thing that got better" helper="What changed because of you? Add a number if you have one." value={a.result} onChangeText={(v) => set(label, { result: v })} multiline placeholder="e.g. Cut average handling time from 9 to 7 minutes" />
        <Field label="Tools and systems" helper="Software, platforms or methods you used." value={a.tools} onChangeText={(v) => set(label, { tools: v })} multiline placeholder="e.g. Excel, Jira, Tableau" />
      </StepScreen>
    );
  }

  return (
    <StepScreen eyebrow="Last one" title="Anything not on your CV?" progress={{ step: last + 1, of: last + 1 }} onBack={back} showHome={false} primary={{ label: 'Save and continue', onPress: () => void save(), loading: saving }} secondary={skip}>
      <View style={{ gap: 12 }}>
        <Field label="Projects, side work, a business, apps you built" helper="Also what you did in any gaps. Skip this if there’s nothing to add." value={extrasText} onChangeText={setExtras} multiline placeholder="e.g. Built and launched a job-search app used by testers; ran a restaurant with 15 staff" />
        {error ? <ErrorNotice message={error} /> : null}
      </View>
    </StepScreen>
  );
}
