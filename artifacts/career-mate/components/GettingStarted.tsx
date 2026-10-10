import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { CareerInsights, JobSummary, WorkRights } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button } from '@/components/ui';

type Step = { key: string; title: string; detail: string; done: boolean; action?: { label: string; href: Href } };

// The best job to act on next: the highest-scoring one the user can take.
function bestJob(jobs: JobSummary[]) {
  return [...jobs]
    .filter((j) => j.work_rights_verdict !== 'not_eligible')
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
}

export function gettingStartedSteps({ jobs, workRights, insights }: { jobs: JobSummary[]; workRights: WorkRights | null; insights: CareerInsights | null }): Step[] {
  const best = bestJob(jobs);
  const jobHref = (best ? `/job/${best.job_id}` : '/(tabs)/submit') as Href;
  return [
    { key: 'cv', title: 'Add your CV', detail: 'Every evaluation is measured against it.', done: true },
    {
      key: 'visa',
      title: 'Set your work rights',
      detail: 'So each job is checked against where you can legally work.',
      done: !!workRights,
      action: { label: 'Set work rights', href: '/(tabs)/profile' },
    },
    {
      key: 'evaluate',
      title: 'Evaluate your first job',
      detail: 'Paste a link or the ad’s text. Takes about a minute.',
      done: jobs.length > 0,
      action: { label: 'Evaluate a job', href: '/(tabs)/submit' },
    },
    {
      key: 'cv-tailored',
      title: 'Tailor a CV for a job',
      detail: best ? `Try it on ${best.title || 'your best match'}.` : 'Open an evaluated job and tap Tailored CV.',
      done: jobs.some((j) => j.has_cv),
      action: { label: 'Open the job', href: jobHref },
    },
    {
      key: 'applied',
      title: 'Mark a job as applied',
      detail: 'Career Mate will remind you to follow up.',
      done: jobs.some((j) => j.status !== 'evaluated'),
      action: { label: 'Open the job', href: jobHref },
    },
    {
      key: 'insights',
      title: 'See roles you might be missing',
      detail: 'Titles to search for and skills that keep coming up.',
      done: !!insights,
      action: { label: 'See insights', href: '/insights' },
    },
  ];
}

/**
 * First-run checklist on Home. Ticks itself off from what the user has
 * actually done (nothing to tick by hand), offers the next step, and can be
 * hidden. Disappears once everything's done.
 */
export function GettingStarted({ steps, onHide }: { steps: Step[]; onHide: () => void }) {
  const colors = useColors();
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  if (!next) return null;

  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Text style={[type.labelEyebrow, { color: colors.teal }]}>Getting started</Text>
          <Text style={[type.titleCard, { color: colors.navy }]}>{`${doneCount} of ${steps.length} done`}</Text>
        </View>
        <Pressable onPress={onHide} accessibilityRole="button" accessibilityLabel="Hide the getting started checklist" style={{ minHeight: 44, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' }}>
          <Text style={[type.bodySemibold, { color: colors.mutedForeground }]}>Hide</Text>
        </Pressable>
      </View>

      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: steps.length, now: doneCount }} style={{ height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: 'hidden' }}>
        <View style={{ width: `${(doneCount / steps.length) * 100}%`, height: '100%', backgroundColor: colors.success }} />
      </View>

      <View style={{ gap: 10 }}>
        {steps.map((step) => {
          const isNext = step.key === next.key;
          return (
            <View key={step.key} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Feather
                name={step.done ? 'check-circle' : isNext ? 'arrow-right-circle' : 'circle'}
                size={18}
                color={step.done ? colors.success : isNext ? colors.primary : colors.mutedForeground}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={[
                    isNext ? type.bodySemibold : type.bodyMd,
                    { color: step.done ? colors.mutedForeground : colors.navy, textDecorationLine: step.done ? 'line-through' : 'none' },
                  ]}
                >
                  {step.title}
                </Text>
                {isNext && <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>{step.detail}</Text>}
              </View>
            </View>
          );
        })}
      </View>

      {next.action && (
        <Button onPress={() => router.push(next.action!.href)} icon="arrow-right" style={{ alignSelf: 'flex-start' }}>
          {next.action.label}
        </Button>
      )}
    </View>
  );
}
