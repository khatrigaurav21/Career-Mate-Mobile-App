import React, { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { api, isApiError } from '@/lib/api';
import type { ApplicationStatus, JobDetail } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';
import { Button, ErrorNotice } from '@/components/ui';

type Colors = ReturnType<typeof useColors>;
type Tone = 'good' | 'mid' | 'bad' | 'neutral' | 'info';

export const STATUS_META: Record<ApplicationStatus, { label: string; icon: keyof typeof Feather.glyphMap; tone: Tone }> = {
  evaluated: { label: 'Not applied', icon: 'circle', tone: 'neutral' },
  applied: { label: 'Applied', icon: 'send', tone: 'info' },
  interviewing: { label: 'Interviewing', icon: 'message-circle', tone: 'mid' },
  offer: { label: 'Offer', icon: 'award', tone: 'good' },
  rejected: { label: 'Rejected', icon: 'x-circle', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', icon: 'corner-up-left', tone: 'neutral' },
};

const STAGES: ApplicationStatus[] = ['evaluated', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];

export function toneColors(tone: Tone, colors: Colors) {
  return {
    good: { fg: colors.success, bg: colors.successSoft },
    mid: { fg: colors.warning, bg: colors.warningSoft },
    bad: { fg: colors.destructive, bg: colors.destructiveSoft },
    info: { fg: colors.accentForeground, bg: colors.accent },
    neutral: { fg: colors.mutedForeground, bg: colors.muted },
  }[tone];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function errorMessage(error: unknown, fallback: string) {
  return isApiError(error) && error.status === 429 ? error.message : fallback;
}

/**
 * "Where are you with this job?" — the stage picker, a follow-up nudge when
 * one is due (7 days after applying, 4 after an interview, decided by the
 * server), a drafted follow-up email the user sends themselves, and the
 * history of changes.
 */
export function ApplicationTracker({ job }: { job: JobDetail }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['job', job.job_id] });
    void queryClient.invalidateQueries({ queryKey: ['pipeline'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => api.setJobStatus(job.job_id, status),
    onSuccess: () => {
      void Haptics.selectionAsync().catch(() => {});
      setDraft(null);
      refresh();
    },
  });
  const followUpMutation = useMutation({
    mutationFn: () => api.logFollowUp(job.job_id),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setDraft(null);
      refresh();
    },
  });
  const draftMutation = useMutation({
    mutationFn: () => api.draftFollowUp(job.job_id),
    onSuccess: (data) => {
      setCopied(false);
      setDraft(data);
    },
  });

  // Show the pending choice straight away so the tap feels instant.
  const current: ApplicationStatus = statusMutation.isPending && statusMutation.variables ? statusMutation.variables : job.status;
  const open = current === 'applied' || current === 'interviewing';
  const sinceStage = daysSince(job.status_changed_at);
  const sinceFollowUp = daysSince(job.last_follow_up_at);
  const events = job.events ?? [];

  const emailText = draft ? `Subject: ${draft.subject}\n\n${draft.body}` : '';

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Feather name="flag" size={18} color={colors.teal} />
        <Text style={[type.headlineSm, { color: colors.navy }]}>Where are you with this?</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {STAGES.map((stage) => {
          const meta = STATUS_META[stage];
          const selected = stage === current;
          const tone = toneColors(meta.tone, colors);
          return (
            <Pressable
              key={stage}
              onPress={() => { if (!selected && !statusMutation.isPending) statusMutation.mutate(stage); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: statusMutation.isPending }}
              accessibilityLabel={meta.label}
              style={({ pressed }) => ({
                minHeight: 44,
                paddingHorizontal: 14,
                borderRadius: 99,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: selected ? tone.fg : colors.border,
                backgroundColor: selected ? tone.bg : colors.card,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Feather name={selected ? 'check' : meta.icon} size={14} color={selected ? tone.fg : colors.mutedForeground} />
              <Text style={[type.labelPill, { color: selected ? tone.fg : colors.navy }]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {statusMutation.isError && <ErrorNotice message={errorMessage(statusMutation.error, 'We couldn’t update this job. Please try again.')} />}

      {open && job.follow_up_due && !statusMutation.isPending && (
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: 18, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Feather name="bell" size={18} color={colors.warning} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[type.titleCard, { color: colors.warning }]}>Time to follow up</Text>
              <Text style={[type.bodyMd, { color: colors.foreground }]}>
                {sinceFollowUp !== null
                  ? `Your last follow-up was ${sinceFollowUp} days ago.`
                  : current === 'interviewing'
                    ? `It’s been ${sinceStage ?? 'a few'} days since your interview.`
                    : `It’s been ${sinceStage ?? 'a few'} days since you applied.`}{' '}
                A short, specific email keeps you on their radar.
              </Text>
            </View>
          </View>
          {!draft && (
            <Button onPress={() => draftMutation.mutate()} loading={draftMutation.isPending} icon="edit-3">
              Draft a follow-up email
            </Button>
          )}
          <Button variant="secondary" onPress={() => followUpMutation.mutate()} loading={followUpMutation.isPending} icon="check">
            I’ve followed up
          </Button>
          {draftMutation.isError && <ErrorNotice message={errorMessage(draftMutation.error, 'We couldn’t write a draft. Please try again.')} />}
          {followUpMutation.isError && <ErrorNotice message="We couldn’t save that. Please try again." />}
        </View>
      )}

      {draft && (
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 10 }}>
          <Text style={[type.labelEyebrow, { color: colors.mutedForeground }]}>Draft — edit before sending</Text>
          <Text selectable style={[type.titleCard, { color: colors.navy }]}>{draft.subject}</Text>
          <Text selectable style={[type.bodyLg, { color: colors.foreground }]}>{draft.body}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              variant="secondary"
              icon={copied ? 'check' : 'copy'}
              style={{ flex: 1 }}
              onPress={() => {
                void Clipboard.setStringAsync(emailText).then(() => setCopied(true)).catch(() => {});
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="secondary"
              icon="share"
              style={{ flex: 1 }}
              onPress={() => void Share.share({ title: draft.subject, message: emailText }).catch(() => {})}
            >
              Share
            </Button>
          </View>
        </View>
      )}

      {events.length > 0 && <Timeline events={events} colors={colors} />}
    </View>
  );
}

function Timeline({ events, colors }: { events: NonNullable<JobDetail['events']>; colors: Colors }) {
  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 10 }}>
      {[...events].reverse().map((event, index) => {
        const meta = event.kind === 'follow_up' ? null : event.status ? STATUS_META[event.status] : null;
        const label = event.kind === 'follow_up' ? 'Followed up' : meta?.label ?? 'Updated';
        return (
          <View key={`${event.created_at}-${index}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Feather name={event.kind === 'follow_up' ? 'mail' : meta?.icon ?? 'circle'} size={14} color={colors.teal} style={{ marginTop: 3 }} />
            <View style={{ flex: 1 }}>
              <Text style={[type.bodySemibold, { color: colors.navy }]}>{label}</Text>
              {event.note ? <Text style={[type.bodyMd, { color: colors.mutedForeground }]}>{event.note}</Text> : null}
            </View>
            <Text style={[type.labelCaption, { color: colors.mutedForeground }]}>{shortDate(event.created_at)}</Text>
          </View>
        );
      })}
    </View>
  );
}
