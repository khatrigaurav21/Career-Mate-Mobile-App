import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { isApiError } from '@/lib/api';
import { MotionIndicator, SegmentedProgress, StatusChip } from '@/components/ui';
import type { ProgressStep } from '@/components/ui';
import { useColors } from '@/hooks/useColors';

/** A generated document (CV or cover letter): create it, or download it once ready. */
export function DocumentAction({
  title,
  description,
  accessibilityLabel,
  icon,
  url,
  loading,
  progressSteps,
  onPress,
}: {
  title: string;
  description: string;
  accessibilityLabel: string;
  icon: keyof typeof Feather.glyphMap;
  url: string | null;
  loading: boolean;
  progressSteps: ProgressStep[];
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={url ? accessibilityLabel : title}
      style={({ pressed }) => ({ borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.72 : 1 })}
    >
      <View style={{ width: 41, height: 41, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Feather name={icon} size={19} color={colors.teal} /></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.navy, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, lineHeight: 22 }}>{title}</Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 16 }}>{description}</Text>
        {loading && <SegmentedProgress steps={progressSteps} />}
      </View>
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <MotionIndicator color={colors.primary} />
          <StatusChip tone="warning">Preparing PDF</StatusChip>
        </View>
      ) : url ? (
        <View style={{ minHeight: 36, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Feather name="download" size={14} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }}>Download</Text>
        </View>
      ) : (
        <StatusChip tone="neutral">Create</StatusChip>
      )}
    </Pressable>
  );
}

export function documentErrorMessage(error: unknown) {
  return isApiError(error) && error.status === 429 ? error.message : 'We couldn’t generate that document. You can try again.';
}
