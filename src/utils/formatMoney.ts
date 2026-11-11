import type { Money } from '../types/plan';

export function formatMoney({ amountMinor, currency }: Money, locale = 'sr-RS'): string {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  // Minor units depend on the currency: EUR has 2 decimals, JPY 0, KWD 3.
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** digits);
}
