import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { control } from '../../mocks/control';
import { db } from '../../mocks/db';
import { capturedChangeRequests, server } from '../../mocks/server';
import { deferred, renderWithClient } from '../../test/helpers';
import { formatMoney } from '../../utils/formatMoney';
import { PlanChangePage } from './PlanChangePage';

// Testing Library normalizes the non-breaking space Intl inserts, so the expected text does too.
const eur = (amountMinor: number) =>
  formatMoney({ amountMinor, currency: 'EUR' }).replace(/\s/g, ' ');

async function renderPage() {
  const user = userEvent.setup();
  const result = renderWithClient(<PlanChangePage subscriptionId="sub_1" />);
  await screen.findByText('Trenutni plan: Basic');
  return { user, ...result };
}

const confirmButton = () => screen.getByRole('button', { name: 'Potvrdi promenu' });
const summary = () => screen.getByRole('region', { name: 'Obračun' });

describe('PlanChangePage', () => {
  it('shows current plan', async () => {
    await renderPage();
    expect(screen.getByRole('radio', { name: /Basic/ })).toBeChecked();
  });

  it('selecting current plan again does not request a preview or enable confirm', async () => {
    const requested: string[] = [];
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith('/preview')) requested.push(url.searchParams.get('planId') ?? '');
    });
    const { user } = await renderPage();
    await user.click(screen.getByRole('radio', { name: /Pro/ }));
    await within(summary()).findByText(eur(3900));
    await user.click(screen.getByRole('radio', { name: /Basic/ }));

    expect(screen.getByRole('radio', { name: /Basic/ })).toBeChecked();
    expect(confirmButton()).toBeDisabled();
    expect(within(summary()).queryByText(eur(3900))).not.toBeInTheDocument();
    expect(requested).toEqual(['pro']);
  });

  it('selecting a plan shows its amount', async () => {
    const { user } = await renderPage();
    await user.click(screen.getByRole('radio', { name: /Pro/ }));
    expect(await within(summary()).findByText(eur(3900))).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it('confirm sends quote of selected plan and shows new plan', async () => {
    const { user } = await renderPage();
    await user.click(screen.getByRole('radio', { name: /Standard/ }));
    await within(summary()).findByText(eur(1900));
    await user.click(confirmButton());

    expect(await screen.findByText('Plan je promenjen na Standard.')).toBeInTheDocument();
    expect(capturedChangeRequests).toHaveLength(1);
    expect(db.quotes.get(capturedChangeRequests[0].quoteId)?.planId).toBe('standard');
    expect(await screen.findByText('Trenutni plan: Standard')).toBeInTheDocument();
  });

  it('double click sends one request', async () => {
    control.delayMs = 30;
    const { user } = await renderPage();
    await user.click(screen.getByRole('radio', { name: /Pro/ }));
    await within(summary()).findByText(eur(3900));
    await user.dblClick(confirmButton());

    await screen.findByText('Plan je promenjen na Pro.');
    expect(capturedChangeRequests).toHaveLength(1);
  });

  it('expired quote disables confirm and loads a new one', async () => {
    control.quoteTtlMs = 0;
    const { user } = await renderPage();
    await user.click(screen.getByRole('radio', { name: /Pro/ }));
    await within(summary()).findByText(eur(3900));
    await waitFor(() => expect(confirmButton()).toBeDisabled());
    const expiredQuotes = db.quotes.size;

    // The next quote the service issues is valid again.
    control.quoteTtlMs = 300_000;
    await waitFor(() => expect(confirmButton()).toBeEnabled());
    expect(db.quotes.size).toBeGreaterThan(expiredQuotes);

    await user.click(confirmButton());
    expect(await screen.findByText('Plan je promenjen na Pro.')).toBeInTheDocument();
  });

  it('quote that expires before confirm shows message and loads new preview', async () => {
    const { user } = await renderPage();
    await user.click(screen.getByRole('radio', { name: /Pro/ }));
    await within(summary()).findByText(eur(3900));
    const firstQuote = db.quotes.size;
    server.use(
      http.post(
        '/api/subscriptions/:id/change',
        () => HttpResponse.json({ code: 'QUOTE_EXPIRED' }, { status: 409 }),
        { once: true },
      ),
    );
    await user.click(confirmButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Obračun je istekao. Učitali smo novi.',
    );
    await waitFor(() => expect(db.quotes.size).toBe(firstQuote + 1));
    expect(screen.getByText('Trenutni plan: Basic')).toBeInTheDocument();
  });

  it('preview failure can be retried', async () => {
    server.use(
      http.get('/api/subscriptions/:id/preview', () => new HttpResponse(null, { status: 500 }), {
        once: true,
      }),
    );
    const { user } = await renderPage();
    await user.click(screen.getByRole('radio', { name: /Pro/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Obračun nije dostupan.');
    await user.click(screen.getByRole('button', { name: 'Pokušaj ponovo' }));
    expect(await within(summary()).findByText(eur(3900))).toBeInTheDocument();
  });

  it('A/B: late response for A does not replace B', async () => {
    const gates = { standard: deferred<void>(), pro: deferred<void>() };
    const started: string[] = [];
    server.use(
      http.get('/api/subscriptions/:id/preview', async ({ request }) => {
        const planId = new URL(request.url).searchParams.get('planId') as 'standard' | 'pro';
        started.push(planId);
        await gates[planId].promise;
        // Returning nothing falls through to the default handler, which issues the quote.
      }),
    );
    const { user, queryClient } = await renderPage();

    await user.click(screen.getByRole('radio', { name: /Standard/ }));
    await waitFor(() => expect(started).toEqual(['standard']));
    await user.click(screen.getByRole('radio', { name: /Pro/ }));
    await waitFor(() => expect(started).toEqual(['standard', 'pro']));

    gates.pro.resolve();
    await within(summary()).findByText(eur(3900));

    gates.standard.resolve();
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(within(summary()).getByText(eur(3900))).toBeInTheDocument();
    expect(within(summary()).queryByText(eur(1900))).not.toBeInTheDocument();

    await user.click(confirmButton());
    await screen.findByText('Plan je promenjen na Pro.');
    expect(capturedChangeRequests).toHaveLength(1);
    expect(db.quotes.get(capturedChangeRequests[0].quoteId)?.planId).toBe('pro');
  });
});
