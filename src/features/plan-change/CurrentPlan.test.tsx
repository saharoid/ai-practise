import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CurrentPlan } from './CurrentPlan';

describe('CurrentPlan', () => {
  it('renders the plan name', () => {
    render(<CurrentPlan plan={{ id: 'pro', name: 'Pro' }} />);
    expect(screen.getByText('Trenutni plan: Pro')).toBeInTheDocument();
  });
});
