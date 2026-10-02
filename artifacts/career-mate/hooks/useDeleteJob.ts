import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';

/**
 * Confirm-then-delete for a pipeline job. Deleting also removes the job's
 * evaluation and generated CV/cover letter on the server, and it can't be
 * undone, so it always goes through a native confirmation first.
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => api.deleteJob(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['job', id] });
      void queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });

  const confirmDelete = (job: { job_id: string; title?: string | null }, onDeleted?: () => void) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Delete this job?',
      `“${job.title || 'Untitled role'}” will be removed from your pipeline, along with its evaluation, CV and cover letter. This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            mutation.mutate(job.job_id, {
              onSuccess: () => onDeleted?.(),
              onError: () => Alert.alert('Couldn’t delete', 'Something went wrong. Please try again.'),
            }),
        },
      ],
    );
  };

  return { confirmDelete, isDeleting: mutation.isPending };
}
