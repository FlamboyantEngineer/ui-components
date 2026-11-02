import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const overview = (page: Page) => page.locator('[data-lab-demo="overview"]');
const layout = (page: Page) => overview(page).locator('[data-lab-output="layout"]');
async function menuItems(page: Page, name: string) {
  const menu = page.getByRole('menu', { name });
  await menu.waitFor();
  return menu.getByRole('menuitem').allTextContents();
}

test.describe('Dashboard Grid menus', () => {
  test('UIC-DASHBOARD-GRID-5.1 offers layout and host actions on a tile, by pointer and keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const grid = overview(page).getByRole('group', { name: 'Overview' });
    const orders = grid.getByRole('group', { name: 'Orders', exact: true });
    await orders.locator('.ui-dashboard-grid__tile-content').click({ button: 'right' });
    expect(await menuItems(page, 'Orders actions')).toEqual([
      'Move Orders',
      'Resize Orders',
      'Remove Orders',
      'Full width',
    ]);
    await lab.expectAccessible('[role="menu"]');
    await page.getByRole('menuitem', { name: 'Full width' }).click();
    await expect(layout(page)).toContainText('orders 0,0 12×1');
    // No drag started: nothing moves but Full width's change.
    await expect(orders).not.toHaveAttribute('data-moving');

    const handle = grid.getByRole('button', { name: 'Move Visitors' });
    await handle.focus();
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Resize Visitors' }).click();
    await expect(grid.getByRole('button', { name: 'Resize Visitors' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(layout(page)).toContainText('visitors 0,0 4×1');

    await handle.focus();
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Remove Visitors' }).press('Enter');
    await expect(grid.getByRole('group', { name: 'Visitors', exact: true })).toHaveCount(0);
    await expect(layout(page)).not.toContainText('visitors');
    // Focus, fallen with the tile, goes to a neighbouring tile's move handle.
    await expect(grid.locator('.ui-dashboard-grid__move').first()).toBeFocused();

    await overview(page).getByRole('button', { name: 'Done editing' }).click();
    await grid.getByRole('group', { name: 'Notes', exact: true }).click({ button: 'right' });
    expect(await menuItems(page, 'Notes actions')).toEqual(['Full width']);
  });

  test('UIC-DASHBOARD-GRID-5.2 adds a tile from the empty space menu, whose field keeps its own menu', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const grid = overview(page).getByRole('group', { name: 'Overview' });
    const notesTile = grid.getByRole('group', { name: 'Notes', exact: true });
    await notesTile.scrollIntoViewIfNeeded();
    const notes = requireDefined(await notesTile.boundingBox());
    const gridBox = requireDefined(await grid.boundingBox());
    // The empty cells after Notes, on its row.
    await page.mouse.click(
      (notes.x + notes.width + gridBox.x + gridBox.width) / 2,
      notes.y + notes.height / 2,
      { button: 'right' },
    );
    expect(await menuItems(page, 'Empty space actions')).toEqual(['Add a note here']);
    await page.getByRole('menuitem', { name: 'Add a note here' }).click();
    await expect(layout(page)).toContainText('note-1 10,3 2×1');
    const note = grid.getByRole('group', { name: 'Note 1', exact: true });
    await expect(note).toBeVisible();
    await note.getByRole('textbox', { name: 'Note' }).click({ button: 'right' });
    await expect(page.getByRole('menu', { name: 'Note actions' })).toBeVisible();
    await expect(page.getByRole('menu', { name: 'Note 1 actions' })).toHaveCount(0);
  });
});
