import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PreviewSummary } from './PreviewSummary';

describe('PreviewSummary', () => {
  it('renders plan, amount and effective date', () => {
    render(
      <PreviewSummary
        plan={{ id: 'pro', name: 'Pro' }}
        preview={{
          subscriptionId: 'sub_1',
          plan: { id: 'pro' },
          quoteId: 'quote_1',
          dueNow: { amountMinor: 3900, currency: 'EUR' },
          effectiveDate: '2026-12-01',
          expiresAt: '2026-11-11T13:05:00.000Z',
        }}
      />,
    );
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('2026-12-01')).toBeInTheDocument();
  });
});
