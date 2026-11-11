import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PLANS } from '../../types/plan';
import { PlanPicker } from './PlanPicker';

describe('PlanPicker', () => {
  it('renders one radio per plan and reports selection', async () => {
    const onSelect = vi.fn();
    render(
      <PlanPicker plans={PLANS} currentPlanId="basic" selectedPlanId={null} onSelect={onSelect} />,
    );
    expect(screen.getByRole('group', { name: 'Izaberi plan' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Basic (trenutni)' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(onSelect).toHaveBeenCalledWith('pro');
  });
});
