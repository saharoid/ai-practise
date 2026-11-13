export type PlanId = 'basic' | 'standard' | 'pro';

export interface Plan {
  id: PlanId;
  name: string;
}

export const PLANS: readonly Plan[] = [
  { id: 'basic', name: 'Basic' },
  { id: 'standard', name: 'Standard' },
  { id: 'pro', name: 'Pro' },
];

export interface Money {
  amountMinor: number;
  currency: string;
}

/** Normalized preview model used by components. */
export interface Preview {
  subscriptionId: string;
  plan: { id: PlanId };
  quoteId: string;
  dueNow: Money;
  effectiveDate: string;
  expiresAt: string;
}
