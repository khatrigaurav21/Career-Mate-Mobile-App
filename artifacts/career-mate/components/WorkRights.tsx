import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Field } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import type { WorkRights, WorkRightsStatus, WorkRightsVerdict } from '@/lib/api';

/**
 * Work rights belong to a country. Australia gets the full set (491/494
 * regional visas); anywhere else gets the simple version, so someone in
 * India never sees a 491. Saved records without a country mean Australia.
 */
export const AUSTRALIA = 'Australia';
const AUSTRALIA_ONLY: WorkRightsStatus[] = ['visa_491', 'visa_494'];

// One tap for the common cases; anything else is typed under OTHER.
// Australia first (the launch market), then common origins and destinations
// for skilled migrants.
const COUNTRIES = [
  AUSTRALIA, 'New Zealand', 'India', 'United Kingdom', 'United States',
  'Canada', 'Ireland', 'Singapore', 'Philippines', 'United Arab Emirates',
];
const OTHER = 'Other';

export const countryOf =(workRights?: WorkRights | null) => workRights?.country || AUSTRALIA;

type Option = { status: WorkRightsStatus; label: string; caption: string };

export const WORK_RIGHTS_OPTIONS: Option[] = [
  { status: 'citizen_pr', label: 'Citizen or permanent resident', caption: 'Australian citizen, PR, or NZ citizen' },
  { status: 'visa_491', label: 'Regional visa (491)', caption: 'Must live and work outside Sydney, Melbourne and Brisbane' },
  { status: 'visa_494', label: 'Employer-sponsored regional (494)', caption: 'Regional, and tied to your sponsoring employer' },
  { status: 'needs_sponsorship', label: 'I need visa sponsorship', caption: 'No current Australian work rights for these roles' },
  { status: 'other', label: 'Something else', caption: 'Student, working holiday, bridging visa…' },
];

function optionsFor(country: string): Option[] {
  if (country === AUSTRALIA) return WORK_RIGHTS_OPTIONS;
  const place = country || 'that country';
  return [
    { status: 'citizen_pr', label: 'I have the right to work there', caption: `Citizen, permanent resident or equivalent in ${place}` },
    { status: 'needs_sponsorship', label: 'I need visa sponsorship', caption: `No current work rights in ${place}` },
    { status: 'other', label: 'Something else', caption: 'A work visa with conditions, student visa…' },
  ];
}

type Summary = { title: string; areas: string; entitlement: string };

/**
 * Plain-English summary of what each kind of work rights allows, shown on
 * Home and in the Profile visa panel. Mirrors the rules the evaluation uses
 * (career-mate-api/src/workRights.mjs). Guidance, not legal advice.
 */
const AUSTRALIAN_SUMMARY: Record<WorkRightsStatus, Summary> = {
  citizen_pr: {
    title: 'Citizen or permanent resident',
    areas: 'Anywhere in Australia.',
    entitlement: 'Any employer, no visa conditions on where you work.',
  },
  visa_491: {
    title: 'Visa 491 — Skilled Work Regional',
    areas: 'Designated regional areas: all of Australia except greater Sydney, Melbourne and Brisbane.',
    entitlement: 'Any employer, as long as you live and work in a regional area.',
  },
  visa_494: {
    title: 'Visa 494 — Employer Sponsored Regional',
    areas: 'Designated regional areas: all of Australia except greater Sydney, Melbourne and Brisbane.',
    entitlement: 'Tied to your sponsoring employer. A new employer normally needs a new nomination.',
  },
  needs_sponsorship: {
    title: 'Needs visa sponsorship',
    areas: 'Depends on the visa an employer sponsors.',
    entitlement: 'Roles that offer sponsorship. Ads saying "no sponsorship" are flagged.',
  },
  other: {
    title: 'Other visa',
    areas: 'Depends on your visa conditions.',
    entitlement: 'Checked against the note you saved.',
  },
};

export function visaSummary(workRights: WorkRights): Summary {
  const country = countryOf(workRights);
  if (country === AUSTRALIA) return AUSTRALIAN_SUMMARY[workRights.status] ?? AUSTRALIAN_SUMMARY.other;
  switch (workRights.status) {
    case 'citizen_pr':
      return { title: `Right to work in ${country}`, areas: `Anywhere in ${country}.`, entitlement: 'Any employer there. Roles in other countries are flagged.' };
    case 'needs_sponsorship':
      return { title: `Needs sponsorship in ${country}`, areas: 'Depends on the visa an employer sponsors.', entitlement: 'Roles that offer sponsorship. Ads saying "no sponsorship" are flagged.' };
    default:
      return { title: `Other visa in ${country}`, areas: 'Depends on your visa conditions.', entitlement: 'Checked against the note you saved.' };
  }
}

export function workRightsLabel(status?: WorkRightsStatus | null) {
  return WORK_RIGHTS_OPTIONS.find((o) => o.status === status)?.label ?? 'Not set';
}

/**
 * Country first, then the work rights that exist there. Emits null when the
 * choice no longer fits (a 491 after switching away from Australia, or no
 * country typed yet), so nothing invalid gets saved.
 */
export function WorkRightsPicker({
  value,
  onChange,
}: {
  value: WorkRights | null;
  onChange: (value: WorkRights | null) => void;
}) {
  const colors = useColors();
  const saved = countryOf(value);
  const listed = COUNTRIES.includes(saved);
  // `pick` is a listed country or OTHER; `typed` is only used for OTHER.
  const [pick, setPick] = useState(listed ? saved : OTHER);
  const [typed, setTyped] = useState(listed ? '' : saved);
  const country = pick === OTHER ? typed.trim() : pick;
  const options = optionsFor(country);
  // Kept here as well as in `value`, so a choice survives the moment `value`
  // is null (Other picked, country not typed yet).
  const [status, setStatus] = useState<WorkRightsStatus | null>(value?.status ?? null);

  const emit = (nextStatus: WorkRightsStatus | null, nextCountry: string) => {
    // A 491/494 doesn't exist outside Australia: clear it rather than carry it over.
    const fits = nextStatus && (nextCountry === AUSTRALIA || !AUSTRALIA_ONLY.includes(nextStatus)) ? nextStatus : null;
    setStatus(fits);
    onChange(fits && nextCountry ? { status: fits, note: value?.note ?? '', country: nextCountry } : null);
  };
  const chooseCountry = (next: string) => {
    setPick(next);
    emit(status, next === OTHER ? typed.trim() : next);
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Where are you looking for work?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup">
        {[...COUNTRIES, OTHER].map((name) => {
          const selected = pick === name;
          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => chooseCountry(name)}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 14,
                borderRadius: 999,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Text style={{ color: selected ? colors.primary : colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
      {pick === OTHER && (
        <Field
          label="Which country?"
          placeholder="e.g. Nepal"
          value={typed}
          autoCapitalize="words"
          onChangeText={(text) => {
            const next = text.slice(0, 60);
            setTyped(next);
            emit(status, next.trim());
          }}
        />
      )}
      <Text style={{ color: colors.navy, fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 8 }}>Your right to work there</Text>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {options.map((option) => {
          const selected = status === option.status;
          return (
            <Pressable
              key={option.status}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => emit(option.status, country)}
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
      </View>
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
