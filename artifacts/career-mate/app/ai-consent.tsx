import React from 'react';
import { Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useAiConsent } from '@/lib/aiConsent';
import { AiDisclosure } from '@/components/AiDisclosure';
import { Button, PageHeader, Screen } from '@/components/ui';

// Shown once after sign-in (and again if the wording changes), and from
// Profile → "How Trozi uses AI" for anyone who wants to read it or take their
// agreement back.
export default function AiConsent() {
  const colors = useColors();
  const { session, hydrated, signOut } = useAuth();
  const consent = useAiConsent();
  const { review } = useLocalSearchParams<{ review?: string }>();
  const reviewing = review === '1';

  if (hydrated && !session) return <Redirect href="/" />;
  // Already agreed and not here to review: carry on to wherever they were headed.
  if (consent.ready && consent.accepted && !reviewing) return <Redirect href="/" />;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (reviewing) {
    return (
      <Screen>
        <PageHeader eyebrow="Your data" title="How Trozi uses AI" subtitle={consent.accepted ? 'You’ve agreed to this.' : 'You haven’t agreed to this yet.'} onBack={goBack} />
        <AiDisclosure />
        <View style={{ gap: 10 }}>
          {consent.accepted ? (
            <>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 19 }}>
                If you take your agreement back, Trozi can’t check or write anything until you agree again.
              </Text>
              <Button
                variant="secondary"
                icon="x-circle"
                onPress={() => {
                  void consent.withdraw().then(() => router.replace('/ai-consent'));
                }}
              >
                Take back my agreement
              </Button>
            </>
          ) : (
            <Button icon="check" onPress={() => void consent.accept().then(goBack)}>I agree</Button>
          )}
          <Button variant="ghost" onPress={goBack}>Done</Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Before we start"
        title="How Trozi uses AI"
        subtitle="Trozi works by sending your information to an AI service. Here’s exactly what that means."
      />
      <AiDisclosure />
      <View style={{ gap: 10 }}>
        <Button icon="check" onPress={() => void consent.accept().then(() => router.replace('/'))}>I agree, continue</Button>
        <Button
          variant="ghost"
          onPress={() => {
            void signOut().then(() => router.replace('/login'));
          }}
        >
          No thanks, sign out
        </Button>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
          Without it, Trozi can’t read your CV or job ads. You can change your mind later in Profile.
        </Text>
      </View>
    </Screen>
  );
}
