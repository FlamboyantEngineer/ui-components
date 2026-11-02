import { PlusGlyph } from '../src/core/glyphs.js';
// Shared fixtures for the menu family's unit tests.

import { screen, waitFor } from '@testing-library/react';
import type { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { expect, type Mock } from 'vitest';
import { Button } from '../src/components/button/button.js';
import {
  Menu,
  MenuPopover,
  MenuTrigger,
  MenuItem,
  type MenuEntry,
  type MenuPopoverProps,
  type MenuProps,
} from '../src/components/menu/menu.js';

export interface MenuButtonProps extends MenuProps {
  children?: ReactNode;
  label?: string;
  layer?: MenuPopoverProps['layer'];
}

/** A `Button` that opens a `Menu` in a `MenuPopover`. */
export function MenuButton({ children, label = 'Actions', layer, ...menu }: MenuButtonProps) {
  return (
    <MenuTrigger>
      <Button>{label}</Button>
      <MenuPopover layer={layer}>
        <Menu {...menu}>{children}</Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

/** Items, a disabled item, a separator, a section and a submenu. */
export const fruitEntries: MenuEntry[] = [
  { id: 'apple', label: 'Apple', icon: PlusGlyph, shortcut: 'Ctrl+A' },
  { id: 'banana', label: 'Banana', isDisabled: true },
  { type: 'separator', id: 'rule' },
  {
    type: 'section',
    id: 'citrus',
    title: 'Citrus',
    items: [
      { id: 'lemon', label: 'Lemon', description: 'Sour' },
      { id: 'lime', label: 'Lime', tone: 'danger' },
    ],
  },
  { id: 'more', label: 'More fruit', items: [{ id: 'cherry', label: 'Cherry' }] },
];

/** The keys an `onAction` handler received, in order. */
export function actionKeys(handler: Mock) {
  return handler.mock.calls.map((call) => call[0]);
}

/** Presses the trigger named `name` and returns the open menu. */
export async function openMenu(user: ReturnType<typeof userEvent.setup>, name = 'Actions') {
  await user.click(screen.getByRole('button', { name }));
  return screen.getByRole('menu');
}

/** A row control: a button named `label` opening a menu with a Mute item. */
export function RowMenuButton({ label, onAction }: { label: string; onAction?: () => void }) {
  return (
    <MenuTrigger>
      <Button size="sm" icon={PlusGlyph} label={label} />
      <MenuPopover>
        <Menu onAction={onAction}>
          <MenuItem id="mute">Mute</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

/**
 * Reaches the row control named `name` with `reach`, opens its menu with Enter and with Space,
 * closes it with Escape and with an item, and expects focus back on the control each time, not on
 * its row.
 */
export async function expectRowMenuReturnsFocus(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  reach: () => Promise<void>,
) {
  const control = screen.getByRole('button', { name });
  for (const [open, close] of [
    ['{Enter}', '{Escape}'],
    [' ', '{Enter}'],
  ] as const) {
    await reach();
    expect(control).toHaveFocus();
    await user.keyboard(open);
    expect(await screen.findByRole('menuitem', { name: 'Mute' })).toHaveFocus();
    await user.keyboard(close);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(control).toHaveFocus());
  }
}

/**
 * The glyphs drawn as the icons of a menu's items, by item name, `null` for an item without one
 * (`specs/MENU.md`, UIC-MENU-6.1).
 */
export function readMenuIcons(menu: HTMLElement): Record<string, string | null> {
  const items = menu.querySelectorAll<HTMLElement>(
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
  );
  return Object.fromEntries(
    [...items].map((item) => [
      item.querySelector('.ui-menu-item__label')?.textContent ?? item.textContent,
      item.querySelector('.ui-menu-item__icon [data-glyph]')?.getAttribute('data-glyph') ?? null,
    ]),
  );
}
