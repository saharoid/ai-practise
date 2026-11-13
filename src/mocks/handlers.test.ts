import { describe, expect, it } from 'vitest';
import type { NestedPreviewDto, SubscriptionDto } from '../api/types';
import { control } from './control';
import { capturedChangeRequests } from './db';

const url = (path: string) => new URL(path, window.location.origin);

async function getPreviewDto(planId: string): Promise<NestedPreviewDto> {
  const response = await fetch(url(`/api/subscriptions/sub_1/preview?planId=${planId}`));
  return (await response.json()) as NestedPreviewDto;
}

function postChange(quoteId: string) {
  return fetch(url('/api/subscriptions/sub_1/change'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quoteId }),
  });
}

describe('mock handlers', () => {
  it('returns subscription sub_1 on basic, version 1', async () => {
    const response = await fetch(url('/api/subscriptions/sub_1'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ subscriptionId: 'sub_1', planId: 'basic', version: 1 });
  });

  it('returns 404 for unknown subscription', async () => {
    const response = await fetch(url('/api/subscriptions/sub_x'));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: 'NOT_FOUND' });
  });

  it('preview returns nested dto with price for plan', async () => {
    const dto = await getPreviewDto('pro');
    expect(dto).toMatchObject({
      subscriptionId: 'sub_1',
      plan: { id: 'pro' },
      dueNow: { amountMinor: 3900, currency: 'EUR' },
    });
    expect(dto).not.toHaveProperty('planId');
    expect(dto.quoteId).toMatch(/^quote_/);
    expect(dto.effectiveDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(Date.parse(dto.expiresAt)).toBeGreaterThan(Date.now());
  });

  it('change applies plan and bumps version', async () => {
    const { quoteId } = await getPreviewDto('standard');
    const response = await postChange(quoteId);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      subscriptionId: 'sub_1',
      planId: 'standard',
      version: 2,
    });
    const current = (await (
      await fetch(url('/api/subscriptions/sub_1'))
    ).json()) as SubscriptionDto;
    expect(current.planId).toBe('standard');
    expect(capturedChangeRequests).toEqual([{ quoteId }]);
  });

  it('change rejects reused quote', async () => {
    const { quoteId } = await getPreviewDto('standard');
    await postChange(quoteId);
    const second = await postChange(quoteId);
    expect(second.status).toBe(409);
    expect(await second.json()).toEqual({ code: 'QUOTE_INVALID' });
    const current = (await (
      await fetch(url('/api/subscriptions/sub_1'))
    ).json()) as SubscriptionDto;
    expect(current.version).toBe(2);
  });

  it('change rejects expired quote', async () => {
    control.quoteTtlMs = 0;
    const { quoteId } = await getPreviewDto('pro');
    const response = await postChange(quoteId);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: 'QUOTE_EXPIRED' });
    const current = (await (
      await fetch(url('/api/subscriptions/sub_1'))
    ).json()) as SubscriptionDto;
    expect(current.planId).toBe('basic');
  });

  it('change rejects unknown quote', async () => {
    const response = await postChange('quote_missing');
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: 'QUOTE_INVALID' });
  });

  it('resets state between tests', async () => {
    const dto = await getPreviewDto('basic');
    expect(dto.quoteId).toBe('quote_1');
    expect(capturedChangeRequests).toEqual([]);
  });
});
