import { describe, expect, it } from 'vitest';
import type { LegacyPreviewDto, NestedPreviewDto } from '../types';
import { toPreview } from './preview';

const common = {
  subscriptionId: 'sub_1',
  quoteId: 'q_1',
  effectiveDate: '2026-12-01',
  expiresAt: '2026-11-11T13:05:00.000Z',
};

const nested: NestedPreviewDto = {
  ...common,
  plan: { id: 'standard' },
  dueNow: { amountMinor: 1900, currency: 'EUR' },
};

const legacy: LegacyPreviewDto = {
  ...common,
  planId: 'standard',
  amountMinor: 1900,
  currency: 'EUR',
};

const expected = {
  ...common,
  plan: { id: 'standard' },
  dueNow: { amountMinor: 1900, currency: 'EUR' },
};

describe('toPreview', () => {
  it('maps nested dto to normalized preview', () => {
    expect(toPreview(nested)).toEqual(expected);
  });

  it('maps legacy flat dto to the same normalized preview', () => {
    expect(toPreview(legacy)).toEqual(expected);
  });

  it('does not leak legacy fields into the model', () => {
    const preview = toPreview(legacy);
    expect(preview).not.toHaveProperty('planId');
    expect(preview).not.toHaveProperty('amountMinor');
    expect(preview).not.toHaveProperty('currency');
  });

  it.each([
    ['nested without dueNow', '{"plan":{"id":"pro"}}'],
    [
      'nested with unknown plan',
      '{"plan":{"id":"gold"},"dueNow":{"amountMinor":1,"currency":"EUR"}}',
    ],
    ['legacy without amount', '{"planId":"pro","currency":"EUR"}'],
    ['neither format', '{"quoteId":"q_1"}'],
  ])('rejects a response in neither format: %s', (_name, body) => {
    // JSON.parse mirrors the unchecked body the HTTP client hands to the adapter.
    expect(() => toPreview(JSON.parse(body))).toThrow('Unsupported preview response format');
  });
});
