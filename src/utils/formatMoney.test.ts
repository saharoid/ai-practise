import { describe, expect, it } from 'vitest';
import { formatMoney } from './formatMoney';

describe('formatMoney', () => {
  it('formats EUR minor units', () => {
    expect(formatMoney({ amountMinor: 1900, currency: 'EUR' }, 'en-US')).toBe('€19.00');
  });

  it('formats zero', () => {
    expect(formatMoney({ amountMinor: 0, currency: 'EUR' }, 'en-US')).toBe('€0.00');
  });

  it('respects currency', () => {
    expect(formatMoney({ amountMinor: 1900, currency: 'USD' }, 'en-US')).toBe('$19.00');
  });
});
