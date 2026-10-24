import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Feather } from '@expo/vector-icons';
import { Button, IconButton, useReducedMotion } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

type Action = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * One step of a flow: a back button, an optional progress bar, a short title,
 * the content, and a primary button that stays at the bottom. The content eases
 * in and the primary button gives a light tap on press, so each step answers
 * the touch. Keep a step to one idea and about 40 words of body text.
 */
export function StepScreen({
  eyebrow,
  title,
  progress,
  children,
  primary,
  secondary,
  onBack,
  showHome = true,
}: {
  eyebrow?: string;
  title: string;
  progress?: { step: number; of: number };
  children?: React.ReactNode;
  primary?: Action;
  secondary?: Action;
  onBack?: () => void;
  showHome?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')));
  const tap = (action: Action) => () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    action.onPress();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconButton icon="arrow-left" onPress={goBack} label="Go back" />
        {progress ? (
          <View style={{ flex: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 10 }} accessibilityLabel={`Step ${progress.step} of ${progress.of}`}>
            {Array.from({ length: progress.of }).map((_, i) => (
              <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < progress.step ? colors.primary : colors.border }} />
            ))}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {showHome ? <IconButton icon="home" onPress={() => router.replace('/(tabs)')} label="Go to home" /> : null}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: 18, gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(240)} style={{ gap: 16 }}>
          <View style={{ gap: 6 }}>
            {eyebrow ? <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{eyebrow}</Text> : null}
            <Text style={[type.headlineLg, { color: colors.navy }]} accessibilityRole="header">{title}</Text>
          </View>
          {children}
        </Animated.View>
      </ScrollView>

      {primary || secondary ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 16, gap: 8 }}>
          {primary ? (
            <Button onPress={tap(primary)} icon={primary.icon} loading={primary.loading} disabled={primary.disabled} style={{ minHeight: 56, borderRadius: 16 }}>
              {primary.label}
            </Button>
          ) : null}
          {secondary ? (
            <Button variant="ghost" onPress={secondary.onPress} icon={secondary.icon} loading={secondary.loading} disabled={secondary.disabled}>
              {secondary.label}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
