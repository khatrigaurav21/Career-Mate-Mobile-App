import React from 'react';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, ErrorNotice } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { type } from '@/constants/typography';

/**
 * Asked right after someone downloads a CV or cover letter: three in four
 * jobs get documents but almost none were marked Applied (Oct 2026), so
 * tracking, follow-up reminders and outcome data never started. One tap
 * here moves the job to Applied.
 */
export function AppliedPrompt({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const applied = useMutation({
    mutationFn: () => api.setJobStatus(jobId, 'applied'),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      onDone();
    },
  });

  return (
    <View style={{ backgroundColor: colors.successSoft, borderRadius: 18, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Feather name="send" size={18} color={colors.success} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[type.titleCard, { color: colors.success }]}>Did you apply?</Text>
          <Text style={[type.bodyMd, { color: colors.foreground }]}>
            Mark it as applied and Trozi will tell you when it’s time to follow up.
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button icon="check" style={{ flex: 1 }} loading={applied.isPending} onPress={() => applied.mutate()}>
          I applied
        </Button>
        <Button variant="secondary" style={{ flex: 1 }} onPress={onDone}>
          Not yet
        </Button>
      </View>
      {applied.isError ? <ErrorNotice message="We couldn’t save that. Please try again." /> : null}
    </View>
  );
}
