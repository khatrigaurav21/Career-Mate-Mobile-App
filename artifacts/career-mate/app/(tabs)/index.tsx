import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api, JobSummary } from '@/lib/api';
import type { CareerInsights, WorkRights, WorkRightsVerdict } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useDeleteJob } from '@/hooks/useDeleteJob';
import { type } from '@/constants/typography';
import { AppHeader } from '@/components/AppHeader';
import { VISA_SUMMARY } from '@/components/WorkRights';
import { STATUS_META, toneColors } from '@/components/ApplicationTracker';
import { Button, ErrorNotice, SectionEyebrow } from '@/components/ui';

type Colors = ReturnType<typeof useColors>;
type Filter = 'all' | 'active' | 'ready';

// Applied or further along, but not withdrawn: the roles still in play or decided.
const ACTIVE = new Set(['applied', 'interviewing', 'offer']);

const HIGH_MATCH = 4.0;

export default function Home() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const pipeline = useQuery({ queryKey: ['pipeline'], queryFn: api.getPipeline, enabled: !!session });
  const insights = useQuery({ queryKey: ['insights'], queryFn: api.getInsights, enabled: !!session && (pipeline.data?.jobs.length ?? 0) > 0 });
  const { confirmDelete } = useDeleteJob();
  const [filter, setFilter] = useState<Filter>('all');

  const jobs = pipeline.data?.jobs ?? [];
  const stats = useMemo(
    () => ({
      evaluated: jobs.length,
      highMatch: jobs.filter((j) => (j.score ?? 0) >= HIGH_MATCH).length,
      cvReady: jobs.filter((j) => j.has_cv).length,
      active: jobs.filter((j) => ACTIVE.has(j.status)).length,
      followUps: jobs.filter((j) => j.follow_up_due).length,
    }),
    [jobs],
  );
  const visible =
    filter === 'ready' ? jobs.filter((j) => j.has_cv) : filter === 'active' ? jobs.filter((j) => ACTIVE.has(j.status)) : jobs;
  const workRights = (profile?.preferences?.work_rights as WorkRights | undefined) ?? null;

  if (pipeline.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader section="Home" />
        <View style={{ padding: 20 }}>
          <ErrorNotice message={pipeline.error instanceof Error ? pipeline.error.message : 'We could not load your roles.'} onRetry={() => void pipeline.refetch()} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section="Home" />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.job_id}
        renderItem={({ item }) => <JobCard job={item} colors={colors} onDelete={() => confirmDelete(item)} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 110, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={pipeline.isRefetching} onRefresh={() => void pipeline.refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            <View style={{ gap: 4 }}>
              <SectionEyebrow>Your pipeline</SectionEyebrow>
              <Text style={[type.headlineLg, { color: colors.navy }]}>Active roles</Text>
              <Text style={[type.bodyLg, { color: colors.mutedForeground }]}>Every role is checked against your CV and your work rights.</Text>
            </View>
            <VisaCard workRights={workRights} colors={colors} />
            {jobs.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <StatTile label="Evaluated" value={stats.evaluated} unit={stats.evaluated === 1 ? 'role' : 'roles'} tone={colors.navy} colors={colors} />
                  <StatTile label="High match" value={stats.highMatch} unit="4.0+" tone={colors.success} colors={colors} />
                  <StatTile label="Applied" value={stats.active} unit={stats.active === 1 ? 'role' : 'roles'} tone={colors.primary} colors={colors} />
                </View>
                {stats.followUps > 0 && (
                  <View accessibilityRole="summary" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.warningSoft, borderRadius: 16, padding: 14 }}>
                    <Feather name="bell" size={18} color={colors.warning} />
                    <Text style={[type.bodySemibold, { color: colors.warning, flex: 1 }]}>
                      {stats.followUps === 1 ? '1 application is ready for a follow-up' : `${stats.followUps} applications are ready for a follow-up`}
                    </Text>
                  </View>
                )}
                <View style={{ gap: 10 }}>
                  <Text style={[type.headlineSm, { color: colors.navy }]}>Your roles</Text>
                  <View style={{ flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.muted, borderRadius: 99, padding: 3 }}>
                    <FilterPill label={`All (${jobs.length})`} selected={filter === 'all'} onPress={() => setFilter('all')} colors={colors} />
                    <FilterPill label={`Applied (${stats.active})`} selected={filter === 'active'} onPress={() => setFilter('active')} colors={colors} />
                    <FilterPill label={`CV ready (${stats.cvReady})`} selected={filter === 'ready'} onPress={() => setFilter('ready')} colors={colors} />
                  </View>
                </View>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          pipeline.isLoading ? (
            <Text style={[type.bodyMd, { color: colors.mutedForeground, textAlign: 'center', paddingVertical: 40 }]}>Loading your roles…</Text>
          ) : filter === 'ready' && jobs.length > 0 ? (
            <Text style={[type.bodyMd, { color: colors.mutedForeground, textAlign: 'center', paddingVertical: 32 }]}>No tailored CVs yet. Open a role and tap Tailored CV.</Text>
          ) : filter === 'active' && jobs.length > 0 ? (
            <Text style={[type.bodyMd, { color: colors.mutedForeground, textAlign: 'center', paddingVertical: 32 }]}>Nothing marked as applied yet. Open a role and set where you are with it.</Text>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 12, gap: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="compass" size={28} color={colors.teal} />
              </View>
              <Text style={[type.headlineSm, { color: colors.navy }]}>Your next move starts here</Text>
              <Text style={[type.bodyMd, { color: colors.mutedForeground, textAlign: 'center' }]}>Evaluate a job to see your fit, check it against your visa, and tailor your application.</Text>
            </View>
          )
        }
        ListFooterComponent={
          pipeline.isLoading ? null : (
            <View style={{ gap: 12 }}>
              {jobs.length > 0 && <InsightsCard insights={insights.data?.insights ?? null} colors={colors} />}
              <FindRoleCard colors={colors} />
            </View>
          )
        }
      />
    </View>
  );
}

function VisaCard({ workRights, colors }: { workRights: WorkRights | null; colors: Colors }) {
  const summary = workRights ? VISA_SUMMARY[workRights.status] : null;
  return (
    <Pressable
      onPress={() => router.push('/profile')}
      accessibilityRole="button"
      accessibilityHint="Opens your work rights in Profile"
      style={({ pressed }) => ({
        backgroundColor: summary ? colors.accent : colors.warningSoft,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={summary ? 'shield' : 'alert-circle'} size={20} color={summary ? colors.accentForeground : colors.warning} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.titleCard, { color: summary ? colors.accentForeground : colors.warning }]}>
          {summary ? summary.title : 'Set your work rights'}
        </Text>
        <Text style={[type.bodyMd, { color: summary ? colors.accentForeground : colors.foreground }]}>
          {summary ? summary.areas : 'Tell us your visa so every job is checked against where you can legally work.'}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={summary ? colors.accentForeground : colors.warning} style={{ marginTop: 10 }} />
    </Pressable>
  );
}

function StatTile({ label, value, unit, tone, colors }: { label: string; value: number; unit: string; tone: string; colors: Colors }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, gap: 4 }}>
      <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={[type.headlineMd, { color: tone }]}>{value}</Text>
        <Text style={[type.labelCaption, { color: tone }]}>{unit}</Text>
      </View>
    </View>
  );
}

function FilterPill({ label, selected, onPress, colors }: { label: string; selected: boolean; onPress: () => void; colors: Colors }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 99, justifyContent: 'center', backgroundColor: selected ? colors.card : 'transparent' }}
    >
      <Text style={[type.labelPill, { color: selected ? colors.navy : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

function scoreTone(score: number | null, colors: Colors) {
  if (score === null) return { fg: colors.mutedForeground, bg: colors.muted };
  if (score >= HIGH_MATCH) return { fg: colors.success, bg: colors.successSoft };
  if (score >= 2.8) return { fg: colors.warning, bg: colors.warningSoft };
  return { fg: colors.destructive, bg: colors.destructiveSoft };
}

const VERDICT_PILL: Record<WorkRightsVerdict, { label: string; icon: keyof typeof Feather.glyphMap; tone: 'good' | 'mid' | 'bad' | 'neutral' }> = {
  eligible: { label: 'Eligible', icon: 'check-circle', tone: 'good' },
  check: { label: 'Check visa', icon: 'alert-triangle', tone: 'mid' },
  not_eligible: { label: 'Not on your visa', icon: 'x-circle', tone: 'bad' },
  unknown: { label: 'Work rights not set', icon: 'help-circle', tone: 'neutral' },
};

function Pill({ label, icon, tone, colors }: { label: string; icon: keyof typeof Feather.glyphMap; tone: 'good' | 'mid' | 'bad' | 'neutral'; colors: Colors }) {
  const { fg, bg } = {
    good: { fg: colors.success, bg: colors.successSoft },
    mid: { fg: colors.warning, bg: colors.warningSoft },
    bad: { fg: colors.destructive, bg: colors.destructiveSoft },
    neutral: { fg: colors.mutedForeground, bg: colors.muted },
  }[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 }}>
      <Feather name={icon} size={13} color={fg} />
      <Text style={[type.labelPill, { color: fg }]}>{label}</Text>
    </View>
  );
}

function JobCard({ job, colors, onDelete }: { job: JobSummary; colors: Colors; onDelete: () => void }) {
  const tone = scoreTone(job.score, colors);
  const verdict = job.work_rights_verdict ? VERDICT_PILL[job.work_rights_verdict] : null;
  const open = () => router.push(`/job/${job.job_id}`);
  const title = job.title || 'Untitled role';
  const stage = STATUS_META[job.status] ?? STATUS_META.evaluated;
  const stageTone = toneColors(stage.tone, colors);
  const tracked = job.status !== 'evaluated';
  // A due follow-up is the most useful next step; otherwise tailoring a CV —
  // but never push that for a job the user can't legally take.
  const followUp = !!job.follow_up_due;
  const primaryAction = followUp || (!tracked && !job.has_cv && job.work_rights_verdict !== 'not_eligible');
  const actionLabel = followUp ? 'Follow up' : primaryAction ? 'Tailor CV' : 'Review';
  // The card body and the action button are siblings, not nested: nested
  // buttons are invalid on web and confusing for screen readers.
  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, overflow: 'hidden' }}>
    <Pressable
      onPress={open}
      onLongPress={onDelete}
      accessibilityRole="button"
      accessibilityLabel={`${title} at ${job.company || 'company not listed'}${job.score !== null ? `, fit ${job.score.toFixed(1)} out of 5` : ''}`}
      accessibilityHint="Opens the evaluation. Long press to delete."
      style={({ pressed }) => ({ padding: 16, paddingBottom: 8, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          {verdict && (
            <View style={{ flexDirection: 'row' }}>
              <Pill label={verdict.label} icon={verdict.icon} tone={verdict.tone} colors={colors} />
            </View>
          )}
          <Text numberOfLines={2} style={[type.titleCard, { color: colors.navy }]}>{title}</Text>
          <Text numberOfLines={1} style={[type.bodyMd, { color: colors.mutedForeground }]}>{job.company || 'Company not listed'}</Text>
        </View>
        <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[type.headlineMd, { color: tone.fg }]}>{job.score === null ? '—' : job.score.toFixed(1)}</Text>
          <Text style={[type.labelCaption, { color: tone.fg, marginTop: -4 }]}>/5</Text>
        </View>
      </View>
    </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          {tracked ? (
            <>
              <Feather name={stage.icon} size={14} color={stageTone.fg} />
              <Text style={[type.labelCaption, { color: stageTone.fg }]}>{stage.label}</Text>
            </>
          ) : (
            <>
              <Feather name={job.has_cv ? 'file-text' : 'clock'} size={14} color={job.has_cv ? colors.success : colors.mutedForeground} />
              <Text style={[type.labelCaption, { color: job.has_cv ? colors.success : colors.mutedForeground }]}>
                {job.has_cv ? (job.has_cover_letter ? 'CV and cover letter ready' : 'Tailored CV ready') : 'Evaluated'}
              </Text>
            </>
          )}
        </View>
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={followUp ? `Follow up on ${title}` : primaryAction ? `Tailor a CV for ${title}` : `Review ${title}`}
          style={({ pressed }) => ({
            minHeight: 44,
            paddingHorizontal: 16,
            borderRadius: 14,
            justifyContent: 'center',
            backgroundColor: primaryAction ? colors.primary : colors.muted,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={[type.bodySemibold, { color: primaryAction ? colors.primaryForeground : colors.navy }]}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InsightsCard({ insights, colors }: { insights: CareerInsights | null; colors: Colors }) {
  const detail = insights
    ? [
        `${insights.adjacent_titles.length} ${insights.adjacent_titles.length === 1 ? 'title' : 'titles'} to search for`,
        insights.skill_gaps.length > 0 && `${insights.skill_gaps.length} recurring skill ${insights.skill_gaps.length === 1 ? 'gap' : 'gaps'}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'See job titles you’re not searching for and the skills your evaluated jobs keep asking about.';
  return (
    <Pressable
      onPress={() => router.push('/insights')}
      accessibilityRole="button"
      accessibilityLabel="Career insights"
      accessibilityHint="Opens job titles to search for and recurring skill gaps"
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        marginTop: 4,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="compass" size={18} color={colors.teal} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.titleCard, { color: colors.navy }]}>Roles you might be missing</Text>
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

function FindRoleCard({ colors }: { colors: Colors }) {
  return (
    <View style={{ backgroundColor: colors.inkPanel, borderRadius: 18, padding: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="share-2" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[type.titleCard, { color: colors.onNavy }]}>Found a role you like?</Text>
          <Text style={[type.bodyMd, { color: colors.onNavyMuted }]}>
            Share a LinkedIn or company job link to Career Mate. For Seek ads, copy the job description and paste it into Evaluate.
          </Text>
        </View>
      </View>
      <Button onPress={() => router.push('/submit')} icon="arrow-right" style={{ alignSelf: 'flex-end' }}>Assess a new job</Button>
    </View>
  );
}
