import type { ChangeRequestDto, SubscriptionDto } from '../api/types';
import type { PlanId } from '../types/plan';

/** Monthly price per plan in EUR minor units (cents). */
export const PRICES: Record<PlanId, number> = { basic: 900, standard: 1900, pro: 3900 };

export interface StoredQuote {
  quoteId: string;
  subscriptionId: string;
  planId: PlanId;
  amountMinor: number;
  currency: string;
  /** Epoch milliseconds. */
  expiresAt: number;
  used: boolean;
}

interface Db {
  subscriptions: Map<string, SubscriptionDto>;
  quotes: Map<string, StoredQuote>;
  nextQuoteNumber: number;
}

function initialDb(): Db {
  return {
    subscriptions: new Map([['sub_1', { subscriptionId: 'sub_1', planId: 'basic', version: 1 }]]),
    quotes: new Map(),
    nextQuoteNumber: 1,
  };
}

export const db: Db = initialDb();

/** Every change request body the mock received, in order. */
export const capturedChangeRequests: ChangeRequestDto[] = [];

export function resetDb(): void {
  Object.assign(db, initialDb());
  capturedChangeRequests.length = 0;
}
