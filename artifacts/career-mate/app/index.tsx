import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { BrandMark, LoadingState } from '@/components/ui';
import { useColors } from '@/hooks/useColors';

export default function Index() {
  const { hydrated, session, profile, profileChecked } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!profileChecked) return;
    router.replace(profile ? '/(tabs)' : '/setup');
  }, [hydrated, profile, profileChecked, session]);

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