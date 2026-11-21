import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CommandPalette } from '../command-palette/command-palette.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Menubar, MenubarMenu } from '../menubar/menubar.js';
import { Menu, type MenuEntry } from './menu.js';

const entries: MenuEntry[] = [
  { id: 'new', label: 'New', shortcut: 'Ctrl+N' },
  { type: 'separator', id: 'rule' },
  { type: 'section', id: 'go', title: 'Go to', items: [{ id: 'lima', label: 'Lima' }] },
];

/** The data-slot names of the open menu's parts, by part. */
function partNames() {
  const menu = screen.getByRole('menu');
  const nameOf = (selector: string) => menu.querySelector(selector)?.getAttribute('data-slot');
  return {
    content: menu.getAttribute('data-slot'),
    item: screen.getByRole('menuitem', { name: /New/ }).getAttribute('data-slot'),
    shortcut: nameOf('.ui-menu-item__shortcut'),
    group: nameOf('.ui-menu-section'),
    label: nameOf('.ui-menu-section__header') ?? null,
    separator: nameOf('.ui-menu-separator'),
  };
}

function prefixed(prefix: string) {
  return {
    content: `${prefix}-content`,
    item: `${prefix}-item`,
    shortcut: `${prefix}-shortcut`,
    group: `${prefix}-group`,
    label: `${prefix}-label`,
    separator: `${prefix}-separator`,
  };
}

describe('Menu part names', () => {
  it('UIC-MENU-4.7 names a dropdown menu’s parts dropdown-menu-*', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu label="File" items={entries} />);
    await user.click(screen.getByRole('button', { name: 'File' }));
    expect(partNames()).toEqual(prefixed('dropdown-menu'));
    expectHooksMatchSpec(document.body, 'MENU');
  });

  it('UIC-CONTEXT-MENU-3.2 names a context menu’s parts context-menu-*', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenuTrigger aria-label="Canvas actions">
        <button type="button">Canvas</button>
        <Menu items={entries} />
      </ContextMenuTrigger>,
    );
    await user.tab();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await screen.findByRole('menu', { name: 'Canvas actions' });
    expect(partNames()).toEqual(prefixed('context-menu'));
    expectHooksMatchSpec(document.body, 'MENU');
  });

  it('UIC-MENUBAR-2.7 names a menubar menu’s parts menubar-*', async () => {
    const user = userEvent.setup();
    render(
      <Menubar aria-label="Editor">
        <MenubarMenu label="File" items={entries} />
      </Menubar>,
    );
    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    expect(partNames()).toEqual(prefixed('menubar'));
    expectHooksMatchSpec(document.body, 'MENU');
  });

  it('UIC-COMMAND-PALETTE-3.3 names the palette list’s parts as a command’s', () => {
    render(<CommandPalette items={entries} defaultOpen />);
    expect(partNames()).toEqual({ ...prefixed('command'), content: 'command-list', label: null });
    expectHooksMatchSpec(document.body, 'MENU', {
      dataSlots: { 'ui-menu-section__header': null },
    });
  });
});
