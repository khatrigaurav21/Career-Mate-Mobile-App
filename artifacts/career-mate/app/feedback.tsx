import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, isApiError } from '@/lib/api';
import type { FeedbackKind } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { Button, ErrorNotice, Field, PageHeader, Screen } from '@/components/ui';

// A direct line to the developer. Sent with the phone type and app version so
// a bug report can be matched to the build it came from.

const KINDS: { key: FeedbackKind; label: string }[] = [
  { key: 'bug', label: 'Something’s wrong' },
  { key: 'idea', label: 'An idea' },
  { key: 'other', label: 'Something else' },
];

function appVersion() {
  const version = Constants.expoConfig?.version ?? '';
  // The id of the over-the-air update the phone is running, when it has one.
  const update = !Updates.isEmbeddedLaunch && Updates.updateId ? Updates.updateId.slice(0, 8) : '';
  return [version, update ? `(${update})` : ''].filter(Boolean).join(' ');
}

export default function Feedback() {
  const colors = useColors();
  const { session, hydrated } = useAuth();
  const [kind, setKind] = useState<FeedbackKind>('idea');
  const [message, setMessage] = useState('');
  const send = useMutation({
    mutationFn: () => api.sendFeedback({ message: message.trim(), kind, app_version: appVersion() || undefined, platform: Platform.OS }),
  });

  if (hydrated && !session) return <Redirect href="/" />;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (send.isSuccess) {
    return (
      <Screen>
        <PageHeader eyebrow="Feedback" title="Thank you" subtitle="It goes straight to the person building Trozi, and it helps." onBack={goBack} />
        <View style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={30} color={colors.success} />
          </View>
          <Button variant="secondary" onPress={() => { send.reset(); setMessage(''); }}>Send another</Button>
          <Button onPress={goBack}>Done</Button>
        </View>
      </Screen>
    );
  }

  const ready = message.trim().length >= 5;
  const error = isApiError(send.error) && [400, 429].includes(send.error.status) ? send.error.message : 'We couldn’t send that. Please try again.';

  return (
    <Screen>
      <PageHeader eyebrow="Feedback" title="Tell us what you think" subtitle="A bug, an idea, or anything that got in your way. We read every message." onBack={goBack} />
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>What is it?</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {KINDS.map((k) => {
            const selected = k.key === kind;
            return (
              <Pressable
                key={k.key}
                onPress={() => setKind(k.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 16,
                  borderRadius: 99,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.accent : colors.card,
                }}
              >
                <Text style={{ color: selected ? colors.primary : colors.foreground, fontFamily: selected ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>{k.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Field
        label="Your message"
        multiline
        placeholder="What happened, or what would make Trozi better?"
        helper={`We also send your phone type and app version${appVersion() ? ` (${appVersion()})` : ''}, so we can find the problem.`}
        value={message}
        onChangeText={setMessage}
        maxLength={2000}
      />
      {send.isError ? <ErrorNotice message={error} /> : null}
      <Button icon="send" loading={send.isPending} disabled={!ready} onPress={() => send.mutate()}>Send feedback</Button>
    </Screen>
  );
}
