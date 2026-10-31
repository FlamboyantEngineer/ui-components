import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { MenuEntry } from '../menu/menu.js';
import { Menubar, MenubarMenu } from './menubar.js';

const menus: Record<string, MenuEntry[]> = {
  File: [
    { id: 'new', label: 'New' },
    { id: 'open', label: 'Open recent', items: [{ id: 'report', label: 'Report.pdf' }] },
  ],
  Edit: [{ id: 'undo', label: 'Undo' }],
  View: [{ id: 'ruler', label: 'Ruler' }],
};

function bar(labels: string[]) {
  return (
    <Menubar aria-label="Editor">
      {labels.map((label) => (
        <MenubarMenu key={label} label={label} items={menus[label]} />
      ))}
    </Menubar>
  );
}

const top = (name: string) => within(screen.getByRole('menubar')).getByRole('menuitem', { name });

describe('Menubar with top-level menus that leave', () => {
  it('UIC-MENUBAR-2.6 opens another menu after the open one is removed', async () => {
    const user = userEvent.setup();
    const { rerender } = render(bar(['File', 'Edit', 'View']));
    await user.click(top('File'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    rerender(bar(['Edit', 'View']));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(top('Edit'));
    expect(top('Edit')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toBeInTheDocument();
    await user.hover(top('View'));
    expect(screen.getByRole('menuitem', { name: 'Ruler' })).toBeInTheDocument();
  });

  it('UIC-MENUBAR-2.6 gives focus to the tab stop when an open menu with a submenu leaves', async () => {
    const user = userEvent.setup();
    const { rerender } = render(bar(['File', 'Edit']));
    top('File').focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Report.pdf' })).toHaveFocus();
    rerender(bar(['Edit']));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(top('Edit')).toHaveFocus();
    expect(top('Edit')).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveFocus();
  });

  it('UIC-MENUBAR-2.6 works again after every menu is removed and added back', async () => {
    const user = userEvent.setup();
    const { rerender } = render(bar(['File', 'Edit']));
    await user.click(top('Edit'));
    rerender(bar([]));
    rerender(bar(['File', 'Edit']));
    await user.click(top('File'));
    expect(top('File')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toHaveFocus();
  });

  it('UIC-MENUBAR-2.6 keeps focus where the reader put it when a closed menu leaves', async () => {
    const user = userEvent.setup();
    const { rerender } = render(bar(['File', 'Edit', 'View']));
    await user.click(top('Edit'));
    rerender(bar(['Edit', 'View']));
    expect(screen.getByRole('menuitem', { name: 'Undo' })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Ruler' })).toHaveFocus();
  });
});
