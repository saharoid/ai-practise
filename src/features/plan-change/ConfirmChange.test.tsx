import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmChange } from './ConfirmChange';

describe('ConfirmChange', () => {
  it('is disabled without a preview', () => {
    render(
      <ConfirmChange preview={undefined} isExpired={false} isPending={false} onConfirm={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Potvrdi promenu' })).toBeDisabled();
  });
});
