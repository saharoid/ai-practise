import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useQuoteExpired } from './useQuoteExpired';

const inMs = (ms: number) => new Date(Date.now() + ms).toISOString();

describe('useQuoteExpired', () => {
  it('is false without a quote', () => {
    const { result } = renderHook(() => useQuoteExpired(undefined, undefined));
    expect(result.current).toBe(false);
  });

  it('turns true once the quote expires while mounted', async () => {
    const { result } = renderHook(() => useQuoteExpired('quote_1', inMs(60)));
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('is true for an already expired quote', async () => {
    const { result } = renderHook(() => useQuoteExpired('quote_1', inMs(-1000)));
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('resets for a new quote', async () => {
    const { result, rerender } = renderHook(({ id, at }) => useQuoteExpired(id, at), {
      initialProps: { id: 'quote_1', at: inMs(-1000) },
    });
    await waitFor(() => expect(result.current).toBe(true));
    rerender({ id: 'quote_2', at: inMs(60_000) });
    expect(result.current).toBe(false);
  });
});
