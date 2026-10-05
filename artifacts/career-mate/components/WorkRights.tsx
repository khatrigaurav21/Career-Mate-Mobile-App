import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Field } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import type { WorkRights, WorkRightsStatus, WorkRightsVerdict } from '@/lib/api';

export const WORK_RIGHTS_OPTIONS: { status: WorkRightsStatus; label: string; caption: string }[] = [
  { status: 'citizen_pr', label: 'Citizen or permanent resident', caption: 'Australian citizen, PR, or NZ citizen' },
  { status: 'visa_491', label: 'Regional visa (491)', caption: 'Must live and work outside Sydney, Melbourne and Brisbane' },
  { status: 'visa_494', label: 'Employer-sponsored regional (494)', caption: 'Regional, and tied to your sponsoring employer' },
  { status: 'needs_sponsorship', label: 'I need visa sponsorship', caption: 'No current Australian work rights for these roles' },
  { status: 'other', label: 'Something else', caption: 'Student, working holiday, bridging visa…' },
];

export function workRightsLabel(status?: WorkRightsStatus | null) {
  return WORK_RIGHTS_OPTIONS.find((o) => o.status === status)?.label ?? 'Not set';
}

export function WorkRightsPicker({
  value,
  onChange,
}: {
  value: WorkRights | null;
  onChange: (value: WorkRights) => void;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }} accessibilityRole="radiogroup">
      {WORK_RIGHTS_OPTIONS.map((option) => {
        const selected = value?.status === option.status;
        return (
          <Pressable
            key={option.status}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange({ status: option.status, note: value?.note ?? '' })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Feather name={selected ? 'check-circle' : 'circle'} size={20} color={selected ? colors.primary : colors.mutedForeground} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>{option.label}</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 }}>{option.caption}</Text>
            </View>
          </Pressable>
        );
      })}
      {value?.status === 'other' && (
        <Field
          label="Tell us about your visa"
          placeholder="e.g. Student visa, 48 hours per fortnight"
          value={value.note}
          onChangeText={(note) => onChange({ ...value, note: note.slice(0, 200) })}
        />
      )}
    </View>
  );
}

const VERDICT_STYLE: Record<WorkRightsVerdict, { icon: React.ComponentProps<typeof Feather>['name']; title: string; tone: 'good' | 'mid' | 'bad' | 'neutral' }> = {
  eligible: { icon: 'check-circle', title: 'You can take this role', tone: 'good' },
  check: { icon: 'alert-circle', title: 'Check your visa conditions', tone: 'mid' },
  not_eligible: { icon: 'x-circle', title: 'Not allowed on your visa', tone: 'bad' },
  unknown: { icon: 'help-circle', title: 'Work rights not set', tone: 'neutral' },
};

function toneColors(colors: ReturnType<typeof useColors>, tone: 'good' | 'mid' | 'bad' | 'neutral') {
  return {
    good: { bg: colors.successSoft, fg: colors.success },
    mid: { bg: colors.warningSoft, fg: colors.warning },
    bad: { bg: colors.destructiveSoft, fg: colors.destructive },
    neutral: { bg: colors.muted, fg: colors.mutedForeground },
  }[tone];
}

export function WorkRightsBanner({ workRights }: { workRights: { verdict: WorkRightsVerdict; summary: string; evidence: string } }) {
  const colors = useColors();
  const style = VERDICT_STYLE[workRights.verdict] ?? VERDICT_STYLE.unknown;
  const { bg, fg } = toneColors(colors, style.tone);
  return (
    <View style={{ backgroundColor: bg, borderRadius: 18, padding: 16, gap: 8 }} accessibilityRole="summary">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Feather name={style.icon} size={20} color={fg} />
        <Text style={{ color: fg, fontFamily: 'Inter_700Bold', fontSize: 16, flex: 1 }}>{style.title}</Text>
      </View>
      <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 }}>{workRights.summary}</Text>
      {workRights.evidence && workRights.evidence !== 'Not stated' && (
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, fontStyle: 'italic' }}>“{workRights.evidence.replace(/^"|"$/g, '')}”</Text>
      )}
      {workRights.verdict === 'unknown' ? (
        <Pressable onPress={() => router.push('/profile')} accessibilityRole="link">
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Set your work rights in Profile →</Text>
        </Pressable>
      ) : (
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}>
          Guidance only, not legal advice. Confirm anything unusual with a registered migration agent.
        </Text>
      )}
    </View>
  );
}

// Only flags problems on pipeline cards; "eligible" stays quiet to avoid clutter.
export function WorkRightsChip({ verdict }: { verdict?: WorkRightsVerdict | null }) {
  const colors = useColors();
  if (verdict !== 'not_eligible' && verdict !== 'check') return null;
  const { bg, fg } = toneColors(colors, verdict === 'not_eligible' ? 'bad' : 'mid');
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Feather name={verdict === 'not_eligible' ? 'x-circle' : 'alert-circle'} size={12} color={fg} />
      <Text style={{ color: fg, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{verdict === 'not_eligible' ? 'Not on your visa' : 'Check visa'}</Text>
    </View>
  );
}
