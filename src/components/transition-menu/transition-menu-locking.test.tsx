import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { TransitionMenu, type TransitionMenuProps } from './transition-menu.js';

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('TransitionMenu locking', () => {
  it('UIC-TRANSITION-MENU-1.6 closes an open menu for good when it turns disabled', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn();
    const props: TransitionMenuProps = {
      states: [
        { id: 'open', label: 'Open' },
        { id: 'active', label: 'In progress' },
      ],
      value: 'open',
      transitions: [{ id: 'start', to: 'active', label: 'Start work' }],
      onTransition,
    };
    const { rerender } = render(<TransitionMenu {...props} />);
    await user.click(screen.getByRole('button', { name: /^Status: Open/ }));
    const item = await screen.findByRole('menuitem', { name: /Start work/ });
    rerender(<TransitionMenu {...props} isDisabled />);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await user.click(item);
    expect(onTransition).not.toHaveBeenCalled();
    rerender(<TransitionMenu {...props} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
