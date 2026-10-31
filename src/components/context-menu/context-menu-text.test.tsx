import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { Menu, MenuItem } from '../menu/menu.js';
import { ContextMenuTrigger } from './context-menu.js';

function FileMenu() {
  return (
    <Menu aria-label="File actions">
      <MenuItem id="open">Open</MenuItem>
    </Menu>
  );
}

const editors: Array<[string, ReactElement]> = [
  ['an input', <input key="input" aria-label="Editor" />],
  ['a text area', <textarea key="area" aria-label="Editor" />],
  [
    'editable content',
    <div key="editable" role="textbox" aria-label="Editor" contentEditable tabIndex={0} />,
  ],
];

describe('ContextMenuTrigger and keys pressed in a text control', () => {
  it.each(editors)(
    'UIC-CONTEXT-MENU-1.2 leaves Shift+F10 and the Context Menu key in %s inside the target to it',
    async (_case, editor) => {
      const user = userEvent.setup();
      render(
        <ContextMenuTrigger>
          <div tabIndex={0} role="group" aria-label="Row">
            {editor}
          </div>
          <FileMenu />
        </ContextMenuTrigger>,
      );
      const field = screen.getByRole('textbox', { name: 'Editor' });
      act(() => field.focus());
      await user.keyboard('{Shift>}{F10}{/Shift}');
      await user.keyboard('{ContextMenu}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(field).toHaveFocus();
      act(() => screen.getByRole('group', { name: 'Row' }).focus());
      await user.keyboard('{Shift>}{F10}{/Shift}');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    },
  );

  it('UIC-CONTEXT-MENU-1.2 opens from a text control that is the target itself', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenuTrigger>
        <input aria-label="Name" />
        <FileMenu />
      </ContextMenuTrigger>,
    );
    act(() => screen.getByRole('textbox', { name: 'Name' }).focus());
    await user.keyboard('{ContextMenu}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('UIC-CONTEXT-MENU-1.2 opens from a text control inside the target with opensFromTextKeys', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenuTrigger opensFromTextKeys>
        <div role="group" aria-label="Row">
          <input aria-label="Editor" />
        </div>
        <FileMenu />
      </ContextMenuTrigger>,
    );
    act(() => screen.getByRole('textbox', { name: 'Editor' }).focus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
