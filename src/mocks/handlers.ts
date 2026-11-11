import { delay, http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw';
import type { ApiErrorDto, ChangeRequestDto, PreviewDto, SubscriptionDto } from '../api/types';
import { PLANS, type PlanId } from '../types/plan';
import { control } from './control';
import { capturedChangeRequests, db, PRICES } from './db';

function error(status: number, code: ApiErrorDto['code']) {
  return HttpResponse.json<ApiErrorDto>({ code }, { status });
}

function isPlanId(value: string | null): value is PlanId {
  return PLANS.some((plan) => plan.id === value);
}

/** First day of the next month as YYYY-MM-DD (UTC). */
function nextBillingDate(now: Date): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toISOString().slice(0, 10);
}

export const handlers = [
  http.get<PathParams, DefaultBodyType, SubscriptionDto | ApiErrorDto>(
    '/api/subscriptions/:id',
    async ({ params }) => {
      await delay(control.delayMs);
      const subscription = db.subscriptions.get(String(params.id));
      if (!subscription) return error(404, 'NOT_FOUND');
      return HttpResponse.json<SubscriptionDto>({ ...subscription });
    },
  ),

  http.get<PathParams, DefaultBodyType, PreviewDto | ApiErrorDto>(
    '/api/subscriptions/:id/preview',
    async ({ params, request }) => {
      await delay(control.delayMs);
      const subscription = db.subscriptions.get(String(params.id));
      if (!subscription) return error(404, 'NOT_FOUND');
      const planId = new URL(request.url).searchParams.get('planId');
      if (!isPlanId(planId)) return error(404, 'NOT_FOUND');

      const now = Date.now();
      const quoteId = `quote_${db.nextQuoteNumber++}`;
      const quote = {
        quoteId,
        subscriptionId: subscription.subscriptionId,
        planId,
        amountMinor: PRICES[planId],
        currency: 'EUR',
        expiresAt: now + control.quoteTtlMs,
        used: false,
      };
      db.quotes.set(quoteId, quote);

      return HttpResponse.json<PreviewDto>({
        subscriptionId: quote.subscriptionId,
        planId: quote.planId,
        quoteId,
        amountMinor: quote.amountMinor,
        currency: quote.currency,
        effectiveDate: nextBillingDate(new Date(now)),
        expiresAt: new Date(quote.expiresAt).toISOString(),
      });
    },
  ),

  http.post<PathParams, ChangeRequestDto, SubscriptionDto | ApiErrorDto>(
    '/api/subscriptions/:id/change',
    async ({ params, request }) => {
      const body = await request.json();
      capturedChangeRequests.push({ ...body });
      await delay(control.delayMs);

      const subscription = db.subscriptions.get(String(params.id));
      if (!subscription) return error(404, 'NOT_FOUND');

      const quote = db.quotes.get(body.quoteId);
      if (!quote || quote.subscriptionId !== subscription.subscriptionId || quote.used) {
        return error(409, 'QUOTE_INVALID');
      }
      if (quote.expiresAt <= Date.now()) return error(409, 'QUOTE_EXPIRED');

      quote.used = true;
      const updated: SubscriptionDto = {
        ...subscription,
        planId: quote.planId,
        version: subscription.version + 1,
      };
      db.subscriptions.set(updated.subscriptionId, updated);
      return HttpResponse.json<SubscriptionDto>({ ...updated });
    },
  ),
];
