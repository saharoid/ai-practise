import type { PlanId } from '../types/plan';

export interface SubscriptionDto {
  subscriptionId: string;
  planId: PlanId;
  version: number;
}

/** Preview fields that both API formats carry unchanged at the top level. */
interface PreviewDtoBase {
  subscriptionId: string;
  quoteId: string;
  /** ISO date (YYYY-MM-DD) when the new plan applies. */
  effectiveDate: string;
  /** ISO timestamp after which the quote is no longer valid. */
  expiresAt: string;
}

/** Preview response in the current, nested API format. */
export interface NestedPreviewDto extends PreviewDtoBase {
  plan: { id: PlanId };
  /** Amount in minor units of the currency (e.g. cents for EUR). */
  dueNow: { amountMinor: number; currency: string };
}

/**
 * Preview response in the old, flat API format.
 * @deprecated Accepted only by the preview adapter during the migration to NestedPreviewDto.
 */
export interface LegacyPreviewDto extends PreviewDtoBase {
  planId: PlanId;
  amountMinor: number;
  currency: string;
}

/** Either preview format the API may return while the migration is in progress. */
export type PreviewDto = NestedPreviewDto | LegacyPreviewDto;

export interface ChangeRequestDto {
  quoteId: string;
}

export interface ApiErrorDto {
  code: 'QUOTE_INVALID' | 'QUOTE_EXPIRED' | 'NOT_FOUND';
}
