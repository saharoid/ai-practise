import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../mocks/server';
import { createWrapper } from '../../test/helpers';
import { usePreview } from './usePreview';

function countPreviewRequests() {
  const seen: string[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/preview')) seen.push(url.searchParams.get('planId') ?? '');
  });
  return seen;
}

describe('usePreview', () => {
  it('does not request preview when planId equals current plan', async () => {
    const seen = countPreviewRequests();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePreview('sub_1', 'basic', 'basic'), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current.fetchStatus).toBe('idle');
    expect(seen).toEqual([]);
  });

  it('requests preview with key per plan', async () => {
    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => usePreview('sub_1', 'pro', 'basic'), { wrapper });
    await waitFor(() => expect(result.current.data?.planId).toBe('pro'));
    expect(queryClient.getQueryData(['preview', 'sub_1', 'pro'])).toEqual(result.current.data);
  });

  it('surfaces errors without retrying', async () => {
    let calls = 0;
    server.use(
      http.get('/api/subscriptions/:id/preview', () => {
        calls += 1;
        return new HttpResponse(null, { status: 500 });
      }),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePreview('sub_1', 'pro', 'basic'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(calls).toBe(1);
  });
});
