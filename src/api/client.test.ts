import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../mocks/server';
import { ApiError, confirmChange, getPreview } from './client';

describe('api client', () => {
  it('getPreview returns normalized preview', async () => {
    const preview = await getPreview('sub_1', 'pro');
    expect(preview.plan).toEqual({ id: 'pro' });
    expect(preview.dueNow).toEqual({ amountMinor: 3900, currency: 'EUR' });
    expect(preview).not.toHaveProperty('amountMinor');
  });

  it('getPreview normalizes a legacy flat response the same way', async () => {
    server.use(
      http.get('/api/subscriptions/:id/preview', () =>
        HttpResponse.json({
          subscriptionId: 'sub_1',
          planId: 'pro',
          quoteId: 'quote_legacy',
          amountMinor: 3900,
          currency: 'EUR',
          effectiveDate: '2026-12-01',
          expiresAt: '2026-11-11T13:05:00.000Z',
        }),
      ),
    );
    const preview = await getPreview('sub_1', 'pro');
    expect(preview.plan).toEqual({ id: 'pro' });
    expect(preview.dueNow).toEqual({ amountMinor: 3900, currency: 'EUR' });
    expect(preview.quoteId).toBe('quote_legacy');
    expect(preview).not.toHaveProperty('planId');
  });

  it('confirmChange throws ApiError with code QUOTE_EXPIRED on 409', async () => {
    server.use(
      http.post('/api/subscriptions/:id/change', () =>
        HttpResponse.json({ code: 'QUOTE_EXPIRED' }, { status: 409 }),
      ),
    );
    const result = confirmChange('sub_1', { quoteId: 'quote_1' });
    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ status: 409, code: 'QUOTE_EXPIRED' });
  });

  it('maps non-json error body to UNKNOWN', async () => {
    server.use(http.get('/api/subscriptions/:id', () => new HttpResponse('boom', { status: 500 })));
    const { getSubscription } = await import('./client');
    await expect(getSubscription('sub_1')).rejects.toMatchObject({ status: 500, code: 'UNKNOWN' });
  });
});
