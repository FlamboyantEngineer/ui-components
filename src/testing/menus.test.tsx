import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../components/button/button.js';
import { DropdownMenu } from '../components/dropdown-menu/dropdown-menu.js';
import { Popover, PopoverTrigger } from '../components/popover/popover.js';
import { chooseMenuItem, dismissOverlay, openMenu } from './index.js';

const items = [
  { id: 'cut', label: 'Cut' },
  { id: 'copy', label: 'Copy' },
];

describe('testing menus', () => {
  it('UIC-TESTING-2.3 opens a menu and returns it', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu label="Edit" items={items} />);
    const menu = await openMenu(user, screen.getByRole('button', { name: 'Edit' }));
    expect(menu).toHaveAttribute('role', 'menu');
    expect(menu).toHaveTextContent('CutCopy');
  });

  it('UIC-TESTING-2.3 chooses a plain or checkbox menu item from its trigger', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onSelectionChange = vi.fn();
    const { rerender } = render(<DropdownMenu label="Edit" items={items} onAction={onAction} />);
    await chooseMenuItem(user, screen.getByRole('button', { name: 'Edit' }), 'Copy');
    expect(onAction.mock.lastCall?.[0]).toBe('copy');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(
      <DropdownMenu
        label="Edit"
        items={items}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    await chooseMenuItem(user, screen.getByRole('button', { name: 'Edit' }), /^Cut/);
    expect([...(onSelectionChange.mock.lastCall?.[0] as Set<string>)]).toEqual(['cut']);
  });

  it('UIC-TESTING-2.7 dismisses the overlay holding focus and waits for it to leave', async () => {
    const user = userEvent.setup();
    render(
      <PopoverTrigger>
        <Button>Filters</Button>
        <Popover title="Filters">
          <input aria-label="City" />
        </Popover>
      </PopoverTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog');
    await dismissOverlay(user, dialog);
    expect(dialog).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-TESTING-2.7 presses Escape without waiting when given no overlay', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu label="Edit" items={items} />);
    const menu = await openMenu(user, screen.getByRole('button', { name: 'Edit' }));
    await dismissOverlay(user);
    expect(menu).not.toBeInTheDocument();
  });
});

describe('testing menus in a shadow root', () => {
  it('UIC-TESTING-2.3 returns the menu a shadow-root trigger controls, not one in the document', async () => {
    const user = userEvent.setup();
    document.body.insertAdjacentHTML('beforeend', '<div role="menu" id="menu">Page menu</div>');
    const host = document.body.appendChild(document.createElement('div'));
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<button type="button" aria-controls="menu">Edit</button><div role="menu" id="menu">Own menu</div>';
    const trigger = shadow.querySelector('button') as HTMLButtonElement;
    const menu = await openMenu(user, trigger);
    expect(menu).toHaveTextContent('Own menu');
    expect(menu.getRootNode()).toBe(shadow);
    // Without aria-controls, a menu in the trigger's shadow root comes before the document's.
    trigger.removeAttribute('aria-controls');
    expect(await openMenu(user, trigger)).toHaveTextContent('Own menu');
    document.body.replaceChildren();
  });

  it('UIC-TESTING-2.3 finds a controlled menu inside the element the trigger controls', async () => {
    const user = userEvent.setup();
    document.body.innerHTML =
      '<button type="button" aria-controls="popover">Edit</button><div id="popover"><div role="menu">Inner menu</div></div><div role="menu">Last menu</div>';
    const menu = await openMenu(user, screen.getByRole('button', { name: 'Edit' }));
    expect(menu).toHaveTextContent('Inner menu');
    document.body.replaceChildren();
  });
});
