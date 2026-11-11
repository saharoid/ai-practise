import { describe, expect, it } from 'vitest';
import { toPreview } from './preview';

describe('toPreview', () => {
  it('maps flat dto to normalized preview', () => {
    const preview = toPreview({
      subscriptionId: 'sub_1',
      planId: 'standard',
      quoteId: 'q_1',
      amountMinor: 1900,
      currency: 'EUR',
      effectiveDate: '2026-12-01',
      expiresAt: '2026-11-11T13:05:00.000Z',
    });

    expect(preview).toEqual({
      subscriptionId: 'sub_1',
      planId: 'standard',
      quoteId: 'q_1',
      dueNow: { amountMinor: 1900, currency: 'EUR' },
      effectiveDate: '2026-12-01',
      expiresAt: '2026-11-11T13:05:00.000Z',
    });
  });
});
