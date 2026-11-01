import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ActionRow, type ActionRowAction } from './action-row.js';

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('ActionRow menus while locking', () => {
  it.each([
    ['disabled', { isDisabled: true }],
    ['pending', { isPending: true }],
  ] as const)(
    'UIC-ACTION-ROW-1.6 closes an open action menu for good when the action turns %s',
    async (_, lock) => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      const more = (extra: Partial<ActionRowAction>): ActionRowAction[] => [
        {
          verb: 'custom',
          id: 'more',
          label: 'More',
          items: [{ id: 'archive', label: 'Archive' }],
          onAction,
          ...extra,
        } as ActionRowAction,
      ];
      const { rerender } = render(<ActionRow actions={more({})} />);
      await user.click(screen.getByRole('button', { name: 'More' }));
      const item = await screen.findByRole('menuitem', { name: 'Archive' });
      rerender(<ActionRow actions={more(lock)} />);
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
      await user.click(item);
      expect(onAction).not.toHaveBeenCalled();
      rerender(<ActionRow actions={more({})} />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    },
  );
});
