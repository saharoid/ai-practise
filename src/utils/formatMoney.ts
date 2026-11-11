import type { Money } from '../types/plan';

export function formatMoney({ amountMinor, currency }: Money, locale = 'sr-RS'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amountMinor / 100);
}
