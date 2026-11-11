import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, confirmChange } from '../../api/client';
import type { ChangeRequestDto } from '../../api/types';
import { previewsKey } from './usePreview';
import { subscriptionKey } from './useSubscription';

export function useConfirmChange(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ChangeRequestDto) => confirmChange(id, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: subscriptionKey(id) }),
        queryClient.invalidateQueries({ queryKey: previewsKey(id) }),
      ]);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({ queryKey: previewsKey(id) });
      }
    },
  });
}
