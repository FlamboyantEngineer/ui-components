import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Button } from '../button/button.js';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
} from './index.js';

it('UIC-DROPDOWN-MENU-2.1 composes a trigger with nested actions and persistent choices', async () => {
  const user = userEvent.setup();
  render(
    <DropdownMenuRoot>
      <Button>View</Button>
      <DropdownMenuContent selectionMode="single" defaultSelectedKeys={['normal']}>
        <DropdownMenuGroup title="Density">
          <DropdownMenuItem id="normal">Normal</DropdownMenuItem>
          <DropdownMenuItem id="compact">Compact</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuItem id="more">More views</DropdownMenuItem>
          <DropdownMenuContent>
            <DropdownMenuItem id="timeline">Timeline</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenuRoot>,
  );
  const trigger = screen.getByRole('button', { name: 'View' });
  await user.tab();
  await user.keyboard('{ArrowDown}');
  const menu = await screen.findByRole('menu', { name: 'View' });
  const density = within(menu).getByRole('group', { name: 'Density' });
  expect(within(density).getByRole('menuitemradio', { name: 'Normal' })).toHaveFocus();
  await user.keyboard('{ArrowDown}{Enter}');
  // The menu hands focus back to its trigger once it has closed, which can land a frame later.
  await waitFor(() => expect(trigger).toHaveFocus());
  await user.keyboard('{ArrowDown}');
  expect(
    await screen.findByRole('menuitemradio', { name: 'Compact', checked: true }),
  ).toBeVisible();
  await user.keyboard('{End}{ArrowRight}');
  expect(await screen.findByRole('menuitem', { name: 'Timeline' })).toHaveFocus();
  expect(screen.getByRole('menu', { name: 'View' })).toBeInTheDocument();
});
