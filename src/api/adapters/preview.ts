import { PLANS, type Preview } from '../../types/plan';
import type { LegacyPreviewDto, NestedPreviewDto, PreviewDto } from '../types';

function isNested(dto: PreviewDto): dto is NestedPreviewDto {
  return 'plan' in dto;
}

/** The only place that knows the old flat format; remove once the API no longer sends it. */
function fromLegacy(dto: LegacyPreviewDto): Pick<NestedPreviewDto, 'plan' | 'dueNow'> {
  return {
    plan: { id: dto.planId },
    dueNow: { amountMinor: dto.amountMinor, currency: dto.currency },
  };
}

/**
 * The HTTP client does not validate response bodies, so check the migrated fields at runtime.
 * A response in neither format fails the query instead of reaching the UI half-filled.
 */
function hasValidPlanAndAmount(plan: unknown, dueNow: unknown): boolean {
  if (typeof plan !== 'object' || plan === null || !('id' in plan)) return false;
  if (typeof dueNow !== 'object' || dueNow === null) return false;
  if (!('amountMinor' in dueNow) || !('currency' in dueNow)) return false;
  return (
    PLANS.some((candidate) => candidate.id === plan.id) &&
    typeof dueNow.amountMinor === 'number' &&
    typeof dueNow.currency === 'string'
  );
}

/** Normalizes either preview API format into the model components use. */
export function toPreview(dto: PreviewDto): Preview {
  const { plan, dueNow } = isNested(dto) ? dto : fromLegacy(dto);
  if (!hasValidPlanAndAmount(plan, dueNow)) {
    throw new Error('Unsupported preview response format');
  }
  return {
    subscriptionId: dto.subscriptionId,
    plan: { id: plan.id },
    quoteId: dto.quoteId,
    dueNow: { amountMinor: dueNow.amountMinor, currency: dueNow.currency },
    effectiveDate: dto.effectiveDate,
    expiresAt: dto.expiresAt,
  };
}
