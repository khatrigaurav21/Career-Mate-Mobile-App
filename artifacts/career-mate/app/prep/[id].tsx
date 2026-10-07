import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { InterviewPrep, PrepAudience } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button, ErrorNotice, IconButton, LoadingState, Screen, SectionEyebrow, SegmentedProgress } from '@/components/ui';
import { PREP_PROGRESS, PrepQuestion, prepErrorMessage, useBuildInterviewPrep } from '@/components/InterviewPrep';

type Colors = ReturnType<typeof useColors>;

const AUDIENCES: { key: PrepAudience; label: string; hint: string }[] = [
  { key: 'recruiter_screen', label: 'Recruiter', hint: 'The first call: motivation, availability, salary and your background.' },
  { key: 'hiring_manager', label: 'Manager', hint: 'Why this role, how you’d start, and the doubts from your evaluation.' },
  { key: 'role_specific', label: 'The job', hint: 'The core skills and duties in the ad.' },
];

export default function InterviewPrepScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Opened straight from a link, this screen can mount before the saved
  // session is restored; a request then would go out without a token, get a
  // 401 and sign the user out. Wait for the session, and send signed-out
  // visitors to the start screen.
  const { session, hydrated } = useAuth();
  const job = useQuery({ queryKey: ['job', id], queryFn: () => api.getJob(id), enabled: !!id && !!session });
  const rebuild = useBuildInterviewPrep(id);
  const [audience, setAudience] = useState<PrepAudience>('recruiter_screen');

  if (hydrated && !session) return <Redirect href="/" />;
  if (!hydrated || job.isLoading) return <Screen scroll={false}><LoadingState title="Opening your prep" detail="Loading your questions and answers." /></Screen>;
  if (job.isError || !job.data) {
    return (
      <Screen>
        <IconButton icon="arrow-left" onPress={() => router.back()} label="Go back" />
        <ErrorNotice message="We couldn’t load this job." onRetry={() => void job.refetch()} />
      </Screen>
    );
  }

  const prep: InterviewPrep | null | undefined = job.data.interview_prep;
  const title = job.data.title || 'Untitled role';
  const header = (
    <>
      <IconButton icon="arrow-left" onPress={() => router.back()} label="Go back" />
      <View style={{ gap: 4 }}>
        <SectionEyebrow>Interview prep</SectionEyebrow>
        <Text style={[type.headlineLg, { color: colors.navy }]}>{title}</Text>
        <Text style={[type.bodyLg, { color: colors.mutedForeground }]}>{job.data.company || 'Company not listed'}</Text>
      </View>
    </>
  );

  if (!prep) {
    return (
      <Screen>
        {header}
        <Text style={[type.bodyLg, { color: colors.foreground }]}>You haven’t built prep for this role yet.</Text>
        {rebuild.isPending && <SegmentedProgress steps={PREP_PROGRESS} />}
        {rebuild.isError && <ErrorNotice message={prepErrorMessage(rebuild.error)} />}
        <Button onPress={() => rebuild.mutate()} loading={rebuild.isPending} icon="zap">Build my interview prep</Button>
      </Screen>
    );
  }

  const current = AUDIENCES.find((a) => a.key === audience) ?? AUDIENCES[0];
  const questions = prep.questions.filter((q) => q.audience === audience);
  const asks = prep.questions_to_ask.filter((q) => q.audience === audience);

  return (
    <Screen>
      {header}

      <View style={{ backgroundColor: colors.accent, borderRadius: 18, padding: 16, gap: 6 }}>
        <Text style={[type.labelEyebrow, { color: colors.accentForeground }]}>What they’ll probe</Text>
        <Text style={[type.bodyLg, { color: colors.accentForeground }]}>{prep.overview}</Text>
      </View>

      <SpokenCard icon="shield" title="When they ask about your visa" text={prep.work_rights_answer} colors={colors} />
      <SpokenCard icon="user" title="Your 60-second introduction" text={prep.elevator_pitch} colors={colors} />

      <View style={{ gap: 12 }}>
        <SectionTitle icon="help-circle" title="Likely questions" colors={colors} />
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.muted, borderRadius: 99, padding: 3 }}>
          {AUDIENCES.map((a) => {
            const selected = a.key === audience;
            const n = prep.questions.filter((q) => q.audience === a.key).length;
            return (
              <Pressable
                key={a.key}
                onPress={() => setAudience(a.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={{ flex: 1, minHeight: 44, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.card : 'transparent' }}
              >
                <Text style={[type.labelPill, { color: selected ? colors.navy : colors.mutedForeground }]}>{`${a.label} (${n})`}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>{current.hint}</Text>
        {questions.map((q, i) => <PrepQuestion key={`${audience}-${i}`} item={q} />)}
        {asks.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 10 }}>
            <Text style={[type.labelEyebrow, { color: colors.mutedForeground }]}>Questions to ask them</Text>
            {asks.map((q, i) => <Bullet key={i} icon="corner-down-right" text={q.question} colors={colors} />)}
          </View>
        )}
      </View>

      {prep.gap_stories.length > 0 && (
        <View style={{ gap: 12 }}>
          <SectionTitle icon="book-open" title="Stories to prepare" colors={colors} />
          {prep.gap_stories.map((g, i) => (
            <View key={i} style={{ backgroundColor: colors.warningSoft, borderRadius: 18, padding: 16, gap: 4 }}>
              <Text style={[type.titleCard, { color: colors.warning }]}>{g.topic}</Text>
              <Text style={[type.bodyMd, { color: colors.foreground }]}>{g.suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ gap: 12 }}>
        <SectionTitle icon="check-square" title="Before the interview" colors={colors} />
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 10 }}>
          {prep.checklist.map((c, i) => <Bullet key={i} icon="chevron-right" text={c} colors={colors} />)}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <SectionTitle icon="alert-triangle" title="Watch out for" colors={colors} />
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 10 }}>
          {prep.watch_outs.map((w, i) => <Bullet key={i} icon="alert-circle" text={w} colors={colors} tone={colors.warning} />)}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>
          These questions are predicted from the job ad and your evaluation, not reported by past candidates. Answers only use what’s in your CV — make them your own before the interview.
        </Text>
        {rebuild.isPending && <SegmentedProgress steps={PREP_PROGRESS} />}
        {rebuild.isError && <ErrorNotice message={prepErrorMessage(rebuild.error)} />}
        <Button variant="secondary" onPress={() => rebuild.mutate()} loading={rebuild.isPending} icon="refresh-cw">
          Rebuild prep
        </Button>
        <Text style={[type.labelCaption, { color: colors.mutedForeground, textAlign: 'center' }]}>
          Built {new Date(prep.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </Text>
      </View>
    </Screen>
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

function SpokenCard({ icon, title, text, colors }: { icon: keyof typeof Feather.glyphMap; title: string; text: string; colors: Colors }) {
  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Feather name={icon} size={16} color={colors.teal} />
        <Text style={[type.titleCard, { color: colors.navy }]}>{title}</Text>
      </View>
      <Text selectable style={[type.bodyLg, { color: colors.foreground }]}>{text}</Text>
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
