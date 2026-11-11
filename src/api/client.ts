import type { PlanId, Preview } from '../types/plan';
import { toPreview } from './adapters/preview';
import type { ApiErrorDto, ChangeRequestDto, PreviewDto, SubscriptionDto } from './types';

export type ApiErrorCode = ApiErrorDto['code'] | 'UNKNOWN';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode) {
    super(`API request failed with ${status} (${code})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const KNOWN_CODES: readonly ApiErrorDto['code'][] = ['QUOTE_INVALID', 'QUOTE_EXPIRED', 'NOT_FOUND'];

function apiUrl(path: string): URL {
  return new URL(`/api${path}`, window.location.origin);
}

async function readErrorCode(response: Response): Promise<ApiErrorCode> {
  try {
    const body = (await response.json()) as Partial<ApiErrorDto>;
    return body.code && KNOWN_CODES.includes(body.code) ? body.code : 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorCode(response));
  }
  return (await response.json()) as T;
}

export function getSubscription(id: string, signal?: AbortSignal): Promise<SubscriptionDto> {
  return request<SubscriptionDto>(`/subscriptions/${encodeURIComponent(id)}`, { signal });
}

export async function getPreview(
  id: string,
  planId: PlanId,
  signal?: AbortSignal,
): Promise<Preview> {
  const query = new URLSearchParams({ planId });
  const dto = await request<PreviewDto>(
    `/subscriptions/${encodeURIComponent(id)}/preview?${query}`,
    { signal },
  );
  return toPreview(dto);
}

export function confirmChange(id: string, body: ChangeRequestDto): Promise<SubscriptionDto> {
  return request<SubscriptionDto>(`/subscriptions/${encodeURIComponent(id)}/change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
