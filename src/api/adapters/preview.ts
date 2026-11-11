import type { Preview } from '../../types/plan';
import type { PreviewDto } from '../types';

export function toPreview(dto: PreviewDto): Preview {
  return {
    subscriptionId: dto.subscriptionId,
    planId: dto.planId,
    quoteId: dto.quoteId,
    dueNow: { amountMinor: dto.amountMinor, currency: dto.currency },
    effectiveDate: dto.effectiveDate,
    expiresAt: dto.expiresAt,
  };
}
