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

  it('uses the currency minor unit for zero-decimal currencies', () => {
    expect(formatMoney({ amountMinor: 500, currency: 'JPY' }, 'en-US')).toBe('¥500');
  });

  it('uses the currency minor unit for three-decimal currencies', () => {
    expect(formatMoney({ amountMinor: 1500, currency: 'KWD' }, 'en-US')).toBe('KWD\u00a01.500');
  });
});
