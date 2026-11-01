import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { DropdownMenu, type DropdownMenuProps } from './dropdown-menu.js';

const items = [
  { id: 'copy', label: 'Copy' },
  { id: 'move', label: 'Move' },
];

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

function Menu(props: Partial<DropdownMenuProps>) {
  return <DropdownMenu label="Actions" items={items} {...props} />;
}

describe('DropdownMenu locking', () => {
  it.each([
    ['plain', {}, 'Actions'],
    ['split', { onPress: () => undefined }, 'More options'],
  ] as const)(
    'UIC-DROPDOWN-MENU-1.8 closes an open %s menu for good when the trigger turns disabled',
    async (_, extra, triggerName) => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const onAction = vi.fn();
      const props = { ...extra, onOpenChange, onAction };
      const { rerender } = render(<Menu {...props} />);
      const trigger = screen.getByRole('button', { name: triggerName });
      await user.click(trigger);
      const item = await screen.findByRole('menuitem', { name: 'Copy' });
      rerender(<Menu {...props} isDisabled />);
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
      // The disabled trigger cannot take focus, so focus leaves the closed menu for the page.
      expect(document.activeElement === trigger || document.activeElement === document.body).toBe(
        true,
      );
      await user.click(item);
      expect(onAction).not.toHaveBeenCalled();
      rerender(<Menu {...props} />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    },
  );

  it('UIC-DROPDOWN-MENU-1.8 asks a controlled menu to close when its trigger turns disabled', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Menu isOpen onOpenChange={onOpenChange} />);
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    rerender(<Menu isOpen onOpenChange={onOpenChange} isDisabled />);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onOpenChange.mock.calls).toEqual([[false]]);
  });
});
