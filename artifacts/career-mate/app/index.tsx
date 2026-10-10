import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { BrandMark, LoadingState } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/lib/onboarding';

export default function Index() {
  const { hydrated, session, profile, profileChecked } = useAuth();
  const colors = useColors();
  const onboarding = useOnboarding();

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!profileChecked) return;
    if (!profile) {
      router.replace('/setup');
      return;
    }
    // Everyone sees the welcome tour once, including people who signed up
    // before it existed.
    if (!onboarding.ready) return;
    router.replace(onboarding.welcomeSeen ? '/(tabs)' : '/welcome');
  }, [hydrated, profile, profileChecked, session, onboarding.ready, onboarding.welcomeSeen]);

  if (!hydrated || (session && !profileChecked)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <BrandMark />
        <LoadingState title="Getting your workspace ready" detail="Checking your profile and recent opportunities." />
      </View>
    );
  }
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}