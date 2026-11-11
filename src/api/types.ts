import type { PlanId } from '../types/plan';

export interface SubscriptionDto {
  subscriptionId: string;
  planId: PlanId;
  version: number;
}

/** Preview response in the current (old, flat) API format. */
export interface PreviewDto {
  subscriptionId: string;
  planId: PlanId;
  quoteId: string;
  amountMinor: number;
  currency: string;
  /** ISO date (YYYY-MM-DD) when the new plan applies. */
  effectiveDate: string;
  /** ISO timestamp after which the quote is no longer valid. */
  expiresAt: string;
}

export interface ChangeRequestDto {
  quoteId: string;
}

export interface ApiErrorDto {
  code: 'QUOTE_INVALID' | 'QUOTE_EXPIRED' | 'NOT_FOUND';
}
