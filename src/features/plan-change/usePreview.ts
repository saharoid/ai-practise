import { useQuery } from '@tanstack/react-query';
import { getPreview } from '../../api/client';
import type { PlanId } from '../../types/plan';

/** Prefix for every preview of one subscription; used for invalidation. */
export function previewsKey(id: string) {
  return ['preview', id] as const;
}

export function usePreview(id: string, planId: PlanId | null, currentPlanId: PlanId | undefined) {
  return useQuery({
    // The key identifies which context a response belongs to (stale-response guard).
    queryKey: [...previewsKey(id), planId] as const,
    queryFn: ({ signal }) => {
      if (!planId) throw new Error('usePreview ran without a planId');
      return getPreview(id, planId, signal);
    },
    enabled: planId !== null && currentPlanId !== undefined && planId !== currentPlanId,
    retry: false,
  });
}
