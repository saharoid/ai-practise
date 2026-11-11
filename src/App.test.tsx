import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { renderWithClient } from './test/helpers';

describe('App', () => {
  it('renders the page heading', async () => {
    renderWithClient(<App />);
    expect(screen.getByRole('heading', { name: 'Promena plana' })).toBeInTheDocument();
    expect(await screen.findByText('Trenutni plan: Basic')).toBeInTheDocument();
  });
});
