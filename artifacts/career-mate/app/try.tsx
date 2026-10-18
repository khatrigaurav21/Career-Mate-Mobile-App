import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api, isApiError } from '@/lib/api';
import type { WorkRights } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { Button, ErrorNotice, Field, PageHeader, Screen } from '@/components/ui';
import { WorkRightsBanner, WorkRightsPicker } from '@/components/WorkRights';

// Check a job before making an account: say what your work rights are, paste
// an ad, and get the same work-rights verdict the app gives. Nothing is saved.
// The fit score needs a CV, so that part waits behind sign-in.

const MIN_AD = 200;

export default function TryFirst() {
  const colors = useColors();
  const [workRights, setWorkRights] = useState<WorkRights | null>(null);
  const [ad, setAd] = useState('');
  const check = useMutation({ mutationFn: () => api.previewWorkRights(ad.trim(), workRights as WorkRights) });

  const ready = workRights !== null && ad.trim().length >= MIN_AD;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));
  const message = isApiError(check.error) && [400, 429, 503].includes(check.error.status)
    ? check.error.message
    : 'We couldn’t check that right now. Please try again.';

  return (
    <Screen>
      <PageHeader eyebrow="Try it first" title="Can you take this job?" subtitle="No account needed. Pick your work rights, paste the ad, and we’ll tell you." onBack={goBack} />

      {check.data ? (
        <View style={{ gap: 16 }}>
          <WorkRightsBanner workRights={check.data.work_rights} />
          <View style={{ gap: 10, padding: 16, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>There’s more</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, lineHeight: 21 }}>
              Sign in to see how well you fit (out of 5) and get a CV and cover letter built from your real experience.
            </Text>
            <Button icon="arrow-right" onPress={() => router.push('/login')}>Sign in to continue</Button>
          </View>
          <Button variant="ghost" icon="refresh-cw" onPress={() => { check.reset(); setAd(''); }}>Check another job</Button>
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>Your work rights</Text>
            <WorkRightsPicker value={workRights} onChange={setWorkRights} />
          </View>
          <Field
            label="The job ad"
            multiline
            placeholder="Paste the whole job ad here"
            helper="Paste the ad’s text, not a link. We don’t save it."
            value={ad}
            onChangeText={setAd}
            autoCorrect={false}
          />
          {check.isError ? <ErrorNotice message={message} /> : null}
          <Button icon="check-circle" loading={check.isPending} disabled={!ready} onPress={() => check.mutate()}>Check this job</Button>
          {!ready ? (
            <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, textAlign: 'center' }}>
              {workRights === null ? 'Pick your work rights, then paste the ad.' : 'Paste the whole ad so we can check it properly.'}
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
