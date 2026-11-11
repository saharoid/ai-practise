import { useQuery } from '@tanstack/react-query';
import { getSubscription } from '../../api/client';

export function subscriptionKey(id: string) {
  return ['subscription', id] as const;
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: subscriptionKey(id),
    queryFn: ({ signal }) => getSubscription(id, signal),
    retry: false,
  });
}
