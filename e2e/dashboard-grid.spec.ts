import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const overview = (page: Page) => page.locator('[data-lab-demo="overview"]');
const layout = (page: Page) => overview(page).locator('[data-lab-output="layout"]');

test.describe('Dashboard Grid lab', () => {
  test('UIC-DASHBOARD-GRID-2.1 UIC-DASHBOARD-GRID-2.2 drops a pointer preview when editing stops', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const demo = overview(page);
    const grid = demo.getByRole('group', { name: 'Overview' });
    const tile = grid.getByRole('group', { name: 'Visitors', exact: true });
    const handle = grid.getByRole('button', { name: 'Move Visitors' });
    await handle.hover();
    const bounds = requireDefined(await handle.boundingBox());
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 + 120, {
      steps: 4,
    });
    await expect(tile).toHaveAttribute('data-moving', 'true');
    const toggle = demo.getByRole('button', { name: 'Done editing' });
    await toggle.focus();
    await toggle.press('Enter');
    await expect(tile).not.toHaveAttribute('data-moving');
    await page.mouse.up();
    await expect(layout(page)).toHaveText(
      'visitors 0,0 3×1; orders 3,0 3×1; results 6,0 6×3; crates 0,1 6×3; notes 6,3 6×1',
    );
    await demo.getByRole('button', { name: 'Edit layout' }).press('Enter');
    await expect(tile).not.toHaveAttribute('data-moving');
    await expect(tile).toHaveCSS('grid-row-start', '1');
  });
  test('UIC-DASHBOARD-GRID-1.1 UIC-DASHBOARD-GRID-2.1 UIC-DASHBOARD-GRID-4.1 places named tiles with handles in edit mode', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const grid = overview(page).getByRole('group', { name: 'Overview' });
    await expect(grid).toHaveAttribute('data-editing', 'true');
    expect(await grid.evaluate((node) => getComputedStyle(node).display)).toBe('grid');
    const visitors = grid.getByRole('group', { name: 'Visitors', exact: true });
    const orders = grid.getByRole('group', { name: 'Orders', exact: true });
    const [left, right] = await Promise.all([visitors.boundingBox(), orders.boundingBox()]);
    expect(requireDefined(right).x).toBeGreaterThan(
      requireDefined(left).x + requireDefined(left).width,
    );
    expect(Math.round(requireDefined(right).y)).toBe(Math.round(requireDefined(left).y));
    await expect(grid.getByRole('button', { name: 'Move Visitors' })).toBeVisible();
    await expect(grid.getByRole('button', { name: 'Resize Visitors' })).toBeVisible();
    await overview(page).getByRole('button', { name: 'Done editing' }).click();
    await expect(grid).not.toHaveAttribute('data-editing');
    await expect(grid.locator('.ui-dashboard-grid__move')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-DASHBOARD-GRID-2.2 UIC-DASHBOARD-GRID-2.4 moves a tile by pointer and pushes others down', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const grid = overview(page).getByRole('group', { name: 'Overview' });
    const width = requireDefined(await grid.boundingBox()).width;
    const step = (width + 12) / 12;
    const handle = grid.getByRole('button', { name: 'Move Visitors' });
    await handle.hover();
    const box = requireDefined(await handle.boundingBox());
    const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.down();
    await page.mouse.move(start.x + step, start.y, { steps: 4 });
    await page.mouse.move(start.x + 3 * step, start.y, { steps: 4 });
    await expect(grid.getByRole('group', { name: 'Visitors', exact: true })).toHaveAttribute(
      'data-moving',
      'true',
    );
    await page.mouse.up();
    await expect(layout(page)).toHaveText(
      'visitors 3,0 3×1; orders 3,1 3×1; results 6,0 6×3; crates 0,2 6×3; notes 6,3 6×1',
    );
    await expect(grid.locator('[data-moving]')).toHaveCount(0);
  });

  test('UIC-DASHBOARD-GRID-2.7 keeps tiles added during a drag and stops a drag whose tile goes', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const demo = page.locator('[data-lab-demo="shared"]');
    const grid = demo.getByRole('group', { name: 'Shared' });
    const output = demo.locator('[data-lab-output="layout"]');
    const drag = async (name: string) => {
      const handle = grid.getByRole('button', { name: `Move Shared ${name}` });
      await handle.hover();
      const box = requireDefined(await handle.boundingBox());
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60, { steps: 4 });
      await expect(grid.getByRole('group', { name: `Shared ${name}` })).toHaveAttribute(
        'data-moving',
        'true',
      );
    };
    await drag('a');
    await demo.getByRole('button', { name: 'Add a tile' }).press('Enter');
    await expect(grid.getByRole('group', { name: 'Shared n1' })).toBeVisible();
    await page.mouse.up();
    await expect(output).toHaveText('a 0,1 2×1; b 2,0 2×1; n1 4,0 2×1');
    await drag('b');
    await demo.getByRole('button', { name: 'Keep only the first tile' }).press('Enter');
    await expect(grid.locator('[data-moving]')).toHaveCount(0);
    await page.mouse.up();
    await expect(output).toHaveText('a 0,1 2×1');
  });

  test('UIC-DASHBOARD-GRID-2.3 UIC-DASHBOARD-GRID-2.5 UIC-DASHBOARD-GRID-2.6 resizes a tile by keyboard and announces it', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const grid = overview(page).getByRole('group', { name: 'Overview' });
    const resize = grid.getByRole('button', { name: 'Resize Visitors' });
    await resize.focus();
    await page.keyboard.press('ArrowRight');
    await expect(layout(page)).toHaveText(
      'visitors 0,0 4×1; orders 3,1 3×1; results 6,0 6×3; crates 0,2 6×3; notes 6,3 6×1',
    );
    const status = grid.getByRole('status');
    await expect(status).toHaveText('Visitors resized to 4 columns by 1 row');
    await expect(resize).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(status).toHaveText('Visitors resized to 2 columns by 1 row');
    const move = grid.getByRole('button', { name: 'Move Notes' });
    await move.focus();
    await page.keyboard.press('ArrowUp');
    await expect(status).toHaveText('Notes moved to column 7, row 3');
    await expect(move).toBeFocused();
  });

  test('UIC-DASHBOARD-GRID-2.2 UIC-DASHBOARD-GRID-2.3 leaves modified arrow keys alone', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const grid = overview(page).getByRole('group', { name: 'Overview' });
    const before = await layout(page).textContent();
    for (const name of ['Move Visitors', 'Resize Visitors']) {
      await grid.getByRole('button', { name }).focus();
      for (const chord of ['Control', 'Alt', 'Shift']) {
        await page.keyboard.press(`${chord}+ArrowRight`);
        await page.keyboard.press(`${chord}+ArrowDown`);
      }
    }
    await expect(layout(page)).toHaveText(requireDefined(before));
    await page.keyboard.press('ArrowRight');
    await expect(layout(page)).not.toHaveText(requireDefined(before));
  });

  test('UIC-DASHBOARD-GRID-3.1 reflows a narrow grid onto one column, read only', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const wide = matrixCell(page, 'mode=editing width=wide').locator('.ui-dashboard-grid');
    await expect(wide).not.toHaveAttribute('data-reflowed');
    await expect(wide.locator('.ui-dashboard-grid__move')).toHaveCount(3);
    const narrow = matrixCell(page, 'mode=editing width=narrow').locator('.ui-dashboard-grid');
    await expect(narrow).toHaveAttribute('data-reflowed', 'true');
    await expect(narrow).not.toHaveAttribute('data-editing');
    await expect(narrow.locator('.ui-dashboard-grid__move')).toHaveCount(0);
    const tops = await narrow
      .locator('.ui-dashboard-grid__tile')
      .evaluateAll((tiles) => tiles.map((tile) => Math.round(tile.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(3);
    await lab.expectAccessible();
  });

  test('UIC-DASHBOARD-GRID-1.2 remembers an uncontrolled layout across reloads and refuses a broken one', async ({
    page,
    lab,
  }) => {
    await lab.open('dashboard-grid');
    const stored = page.locator('[data-lab-demo="stored"]');
    await stored.getByRole('button', { name: 'Move Saved A' }).focus();
    await page.keyboard.press('ArrowDown');
    const tile = stored.getByRole('group', { name: 'Saved A' });
    await expect(tile).toHaveCSS('grid-row-start', '2');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
    await expect(stored.getByRole('group', { name: 'Saved A' })).toHaveCSS('grid-row-start', '2');
    await expect(stored.getByRole('group', { name: 'Saved C' })).toHaveCSS('grid-row-start', '3');
    await stored.getByRole('button', { name: 'Store a broken layout and remount' }).click();
    await expect(stored.getByRole('group', { name: 'Saved A' })).toHaveCSS('grid-row-start', '1');
    await expect(stored.getByRole('group', { name: 'Saved C' })).toHaveCSS('grid-row-start', '2');
  });
});
