import { PlusGlyph } from '../src/core/glyphs.js';
// Shared fixtures for the menu family's unit tests.

import { screen } from '@testing-library/react';
import type { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { Mock } from 'vitest';
import { Button } from '../src/components/button/button.js';
import {
  Menu,
  MenuPopover,
  MenuTrigger,
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
