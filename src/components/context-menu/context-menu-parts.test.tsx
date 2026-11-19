import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuTrigger,
} from './index.js';

it('UIC-CONTEXT-MENU-3.1 composes contextual actions with submenus and keyboard return focus', async () => {
  const user = userEvent.setup();
  const onAction = vi.fn();
  render(
    <ContextMenuTrigger aria-label="Canvas actions">
      <button type="button">Canvas</button>
      <ContextMenuContent onAction={onAction}>
        <ContextMenuGroup title="Visibility">
          <ContextMenuItem id="grid" isSelected={false}>
            Show grid
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuItem id="export">Export</ContextMenuItem>
          <ContextMenuSubContent>
            <ContextMenuContent>
              <ContextMenuItem id="svg">SVG</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenuTrigger>,
  );
  await user.tab();
  await user.keyboard('{Shift>}{F10}{/Shift}');
  expect(await screen.findByRole('menu', { name: 'Canvas actions' })).toBeVisible();
  expect(screen.getByRole('menuitemcheckbox', { name: 'Show grid', checked: false })).toHaveFocus();
  await user.keyboard('{ArrowDown}{ArrowRight}');
  expect(await screen.findByRole('menuitem', { name: 'SVG' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(onAction).toHaveBeenCalledWith('svg');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Canvas' })).toHaveFocus());
});
