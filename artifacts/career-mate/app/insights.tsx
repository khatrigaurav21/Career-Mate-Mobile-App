import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, isApiError } from '@/lib/api';
import type { CareerInsights } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button, ErrorNotice, IconButton, LoadingState, Screen, SectionEyebrow, SegmentedProgress } from '@/components/ui';
import type { ProgressStep } from '@/components/ui';

type Colors = ReturnType<typeof useColors>;

const PROGRESS: ProgressStep[] = [
  { label: 'Reading your evaluated jobs', estimatedMs: 8000 },
  { label: 'Finding patterns across them', estimatedMs: 14000 },
  { label: 'Matching titles to your CV', estimatedMs: 14000 },
];

const AXIS: Record<CareerInsights['adjacent_titles'][number]['axis'], { label: string; hint: string }> = {
  lateral: { label: 'Same work', hint: 'What you do now, under another name' },
  stretch: { label: 'Step up', hint: 'A bigger scope than you have today' },
  pivot: { label: 'Nearby move', hint: 'A neighbouring field your CV can reach' },
};

const GAP_KIND: Record<CareerInsights['skill_gaps'][number]['kind'], string> = {
  tooling: 'Tool or system',
  domain: 'Industry knowledge',
  soft: 'Experience',
  credential: 'Qualification',
};

function errorMessage(error: unknown) {
  return isApiError(error) && error.status === 429 ? error.message : 'We couldn’t build your insights. Please try again.';
}

/**
 * Career insights: job titles the user isn't searching for, skill gaps that
 * keep coming up across their evaluated jobs, and the strengths employers
 * keep counting. Counts and CV quotes are checked by the API, not the model.
 */
export default function InsightsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  // Can be opened from a link: wait for the restored session (see job/[id]).
  const { session, hydrated } = useAuth();
  const insights = useQuery({ queryKey: ['insights'], queryFn: api.getInsights, enabled: !!session });
  const build = useMutation({
    mutationFn: api.buildInsights,
    onSuccess: (data) => queryClient.setQueryData(['insights'], data),
  });

  if (hydrated && !session) return <Redirect href="/" />;
  if (!hydrated || insights.isLoading) return <Screen scroll={false}><LoadingState title="Opening your insights" detail="Loading titles and skill gaps." /></Screen>;

  const data = insights.data?.insights ?? null;
  const header = (
    <>
      <IconButton icon="arrow-left" onPress={() => router.back()} label="Go back" />
      <View style={{ gap: 4 }}>
        <SectionEyebrow>Career insights</SectionEyebrow>
        <Text style={[type.headlineLg, { color: colors.navy }]}>Widen your search</Text>
        <Text style={[type.bodyLg, { color: colors.mutedForeground }]}>Titles you’re not searching for, and the skills your evaluated jobs keep asking about.</Text>
      </View>
    </>
  );
  const buildControls = (label: string, variant: 'primary' | 'secondary') => (
    <>
      {build.isPending && <SegmentedProgress steps={PROGRESS} />}
      {build.isError && <ErrorNotice message={errorMessage(build.error)} />}
      <Button variant={variant} onPress={() => build.mutate()} loading={build.isPending} icon={variant === 'primary' ? 'zap' : 'refresh-cw'}>{label}</Button>
    </>
  );

  if (insights.isError) {
    return <Screen>{header}<ErrorNotice message="We couldn’t load your insights." onRetry={() => void insights.refetch()} /></Screen>;
  }

  if (!data) {
    return (
      <Screen>
        {header}
        <Text style={[type.bodyLg, { color: colors.foreground }]}>
          We’ll compare your CV with every job you’ve evaluated. The more jobs you evaluate, the clearer the patterns.
        </Text>
        {buildControls('Build my insights', 'primary')}
      </Screen>
    );
  }

  return (
    <Screen>
      {header}

      {data.summary ? (
        <View style={{ backgroundColor: colors.accent, borderRadius: 18, padding: 16, gap: 6 }}>
          <Text style={[type.labelEyebrow, { color: colors.accentForeground }]}>{`Across ${data.jobs_considered} ${data.jobs_considered === 1 ? 'job' : 'jobs'}`}</Text>
          <Text style={[type.bodyLg, { color: colors.accentForeground }]}>{data.summary}</Text>
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <SectionTitle icon="search" title="Titles to search for" colors={colors} />
        {data.adjacent_titles.length === 0 ? (
          <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>No new titles this time. Try rebuilding after you update your CV.</Text>
        ) : (
          data.adjacent_titles.map((t) => <TitleCard key={t.title} item={t} colors={colors} />)
        )}
      </View>

      <View style={{ gap: 12 }}>
        <SectionTitle icon="trending-up" title="Skills that keep coming up" colors={colors} />
        {data.skill_gaps.length === 0 ? (
          <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
            {data.jobs_considered < 3
              ? 'Evaluate a few more jobs to see which gaps repeat.'
              : 'No gap came up in more than one job — nice.'}
          </Text>
        ) : (
          data.skill_gaps.map((g) => (
            <View key={g.skill} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text style={[type.titleCard, { color: colors.navy, flex: 1 }]}>{g.skill}</Text>
                <View style={{ backgroundColor: colors.warningSoft, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={[type.labelPill, { color: colors.warning }]}>{`In ${g.seen_in} of ${data.jobs_considered} jobs`}</Text>
                </View>
              </View>
              <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{`${GAP_KIND[g.kind] ?? 'Skill'} · ${g.jobs.map((j) => j.title || 'Untitled role').join(', ')}`}</Text>
              <Text style={[type.bodyMd, { color: colors.foreground }]}>{g.how_to_start}</Text>
            </View>
          ))
        )}
      </View>

      {data.strengths.length > 0 && (
        <View style={{ gap: 12 }}>
          <SectionTitle icon="award" title="What employers keep valuing" colors={colors} />
          {data.strengths.map((s) => (
            <View key={s.strength} style={{ backgroundColor: colors.successSoft, borderRadius: 18, padding: 16, gap: 4 }}>
              <Text style={[type.titleCard, { color: colors.success }]}>{s.strength}</Text>
              <Text style={[type.labelCaption, { color: colors.success }]}>{`Counted in your favour in ${s.seen_in} ${s.seen_in === 1 ? 'job' : 'jobs'}`}</Text>
              <Text style={[type.bodyMd, { color: colors.foreground }]}>“{s.cv_evidence}”</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
          Suggestions are based on your CV and your evaluated jobs. Titles quote your CV word for word; job counts are checked against your evaluations.
        </Text>
        {buildControls('Rebuild insights', 'secondary')}
        <Text style={[type.labelCaption, { color: colors.mutedForeground, textAlign: 'center' }]}>
          Built {new Date(data.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </Text>
      </View>
    </Screen>
  );
}

function TitleCard({ item, colors }: { item: CareerInsights['adjacent_titles'][number]; colors: Colors }) {
  const [copied, setCopied] = React.useState(false);
  const axis = AXIS[item.axis] ?? AXIS.lateral;
  const hasGap = item.gap_note && item.gap_note.trim().toLowerCase() !== 'none';
  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={[type.titleCard, { color: colors.navy }]}>{item.title}</Text>
          <Text style={[type.labelCaption, { color: colors.teal }]}>{`${axis.label} · ${axis.hint}`}</Text>
        </View>
        <Pressable
          onPress={() => void Clipboard.setStringAsync(item.title).then(() => setCopied(true)).catch(() => {})}
          accessibilityRole="button"
          accessibilityLabel={copied ? `${item.title} copied` : `Copy ${item.title} to search for it`}
          style={({ pressed }) => ({ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name={copied ? 'check' : 'copy'} size={18} color={copied ? colors.success : colors.mutedForeground} />
        </Pressable>
      </View>
      <Text style={[type.bodyMd, { color: colors.foreground }]}>{item.why}</Text>
      <View style={{ backgroundColor: colors.accent, borderRadius: 12, padding: 12, gap: 2 }}>
        <Text style={[type.labelCaption, { color: colors.accentForeground }]}>From your CV</Text>
        <Text style={[type.bodyMd, { color: colors.accentForeground }]}>“{item.cv_evidence}”</Text>
      </View>
      {hasGap ? <Bullet icon="alert-circle" text={item.gap_note} colors={colors} tone={colors.warning} /> : null}
      <Bullet icon="search" text={item.search_tip} colors={colors} />
    </View>
  );
}

function SectionTitle({ icon, title, colors }: { icon: keyof typeof Feather.glyphMap; title: string; colors: Colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <Feather name={icon} size={18} color={colors.teal} />
      <Text style={[type.headlineSm, { color: colors.navy }]}>{title}</Text>
    </View>
  );
}

function Bullet({ icon, text, colors, tone }: { icon: keyof typeof Feather.glyphMap; text: string; colors: Colors; tone?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Feather name={icon} size={15} color={tone ?? colors.teal} style={{ marginTop: 3 }} />
      <Text style={[type.bodyMd, { color: colors.foreground, flex: 1 }]}>{text}</Text>
    </View>
  );
}
