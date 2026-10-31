import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

test.describe('Action Row lab', () => {
  test('UIC-ACTION-ROW-1.1 UIC-ACTION-ROW-1.3 draws custom actions, then verbs in their fixed order', async ({
    page,
    lab,
  }) => {
    await lab.open('action-row');
    const names = await page
      .locator('[data-lab-case="order"] .ui-action-row__action')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
    expect(names).toEqual([
      'Help',
      'Search',
      'Add',
      'Refresh',
      'More',
      'Edit',
      'Delete',
      'Save',
      'Cancel',
      'Close',
    ]);
  });

  test('UIC-ACTION-ROW-1.2 shows the label of a custom action without an icon', async ({
    page,
    lab,
  }) => {
    await lab.open('action-row');
    const row = page.locator('[data-lab-case="no-icon"]');
    const schedule = row.getByRole('button', { name: 'Schedule' });
    await expect(schedule).toHaveText('Schedule');
    await expect(schedule).toBeVisible();
    expect(requireDefined(await schedule.boundingBox()).width).toBeGreaterThan(40);
    await expect(schedule).toHaveAttribute('aria-pressed', 'false');
  });

  test('UIC-ACTION-ROW-2.2 sizes every action button', async ({ page, lab }) => {
    await lab.open('action-row');
    for (const [size, edge] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const button = page
        .locator(`[data-lab-cell="state=default size=${size}"]`)
        .getByRole('button', { name: 'Refresh' });
      const box = await button.boundingBox();
      expect(box?.width).toBe(edge);
      expect(box?.height).toBe(edge);
    }
  });

  test('UIC-ACTION-ROW-1.4 shows tooltips on keyboard focus and hover', async ({ page, lab }) => {
    await lab.open('action-row');
    const row = page.locator('[data-lab-cell="state=default size=md"]');
    await row.getByRole('button', { name: 'Full screen' }).focus();
    await page.keyboard.press('Tab');
    await expect(row.getByRole('button', { name: 'Add note' })).toBeFocused();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveText('Add note');
    await expect(tooltip).toHaveClass(/ui-tooltip/);

    const reason = page.locator('[data-lab-case="disabled-reason"]').getByRole('button', {
      name: 'Delete',
    });
    // React Aria opens hover tooltips once the pointer has moved since the last keyboard input.
    await page.mouse.move(0, 0);
    await reason.hover();
    // The focus tooltip may still be fading out.
    await expect(page.locator('.ui-tooltip:not([data-exiting])')).toHaveText(
      'Only the owner can delete this file',
    );
    await expect(reason).toHaveAttribute('aria-disabled', 'true');
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-ACTION-ROW-1.6 opens menus of typed items from actions in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await lab.open('action-row', { theme });
      const row = page.locator('[data-lab-case="more-menu"]');
      const more = row.getByRole('button', { name: 'More actions' });
      await more.click();
      await expect(more).toHaveAttribute('aria-expanded', 'true');
      const menu = page.getByRole('menu', { name: 'More actions' });
      await expect(menu.getByRole('menuitem')).toHaveCount(5);
      const [button, list] = await Promise.all([more.boundingBox(), menu.boundingBox()]);
      // The menu aligns with the button's end, flipping above it when there is no room below.
      expect(
        Math.abs(
          requireDefined(list).x +
            requireDefined(list).width -
            (requireDefined(button).x + requireDefined(button).width),
        ),
      ).toBeLessThanOrEqual(1);
      await lab.expectAccessible('[role="menu"]');
      await menu.getByRole('menuitem', { name: /Export/ }).click();
      await expect(row.locator('[data-lab-output="last"]')).toHaveText('export');
      await expect(page.getByRole('menu')).toHaveCount(0);
      await expect(more).toHaveAttribute('aria-expanded', 'false');
      await expect(more).toBeFocused();

      const sort = row.getByRole('button', { name: 'Sort' });
      await sort.focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('menuitem', { name: 'Name' })).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(row.locator('[data-lab-output="last"]')).toHaveText('sort date');
      await expect(sort).toBeFocused();
      await lab.expectAccessible();
    });
  }

  test('UIC-ACTION-ROW-2.4 UIC-ACTION-ROW-2.5 is one toolbar that moves hidden actions into a menu', async ({
    page,
    lab,
  }) => {
    await lab.open('action-row');
    const wide = page.getByRole('toolbar', { name: 'File actions, wide' });
    await expect(wide.locator('.ui-action-row__action')).toHaveCount(5);
    await expect(wide.locator('.ui-action-row__overflow')).toHaveCount(0);
    const narrow = page.getByRole('toolbar', { name: 'File actions, narrow' });
    const kept = await narrow.locator('.ui-action-row__action').count();
    expect(kept).toBeLessThan(5);
    const more = narrow.getByRole('button', { name: `${5 - kept} more items` });
    await expect(more).toBeVisible();
    const box = await narrow.boundingBox();
    const moreBox = await more.boundingBox();
    expect((moreBox?.x ?? 0) + (moreBox?.width ?? 0)).toBeLessThanOrEqual(
      (box?.x ?? 0) + (box?.width ?? 0) + 0.5,
    );

    await wide.locator('.ui-action-row__action').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(wide.getByRole('button', { name: 'Add note' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(wide.getByRole('button', { name: 'Add note' })).not.toBeFocused();

    await narrow.locator('.ui-action-row__action').first().focus();
    for (let step = 0; step < kept; step += 1) await page.keyboard.press('ArrowRight');
    await expect(more).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.locator('[data-lab-row="narrow"] [data-lab-output="last"]')).toHaveText(
      'delete',
    );
    await lab.expectAccessible();
  });

  test('UIC-ACTION-ROW-2.5 reports an overflow submenu choice to its own action', async ({
    page,
    lab,
  }) => {
    await lab.open('action-row');
    const demo = page.locator('[data-lab-case="shared-ids"]');
    await demo.getByRole('button', { name: '2 more items' }).click();
    await page.getByRole('menuitem', { name: 'Chart' }).click();
    await page.getByRole('menuitem', { name: 'Open chart' }).click();
    await expect(demo.locator('[data-lab-output="last"]')).toHaveText('chart open');
    await demo.getByRole('button', { name: '2 more items' }).click();
    await page.getByRole('menuitem', { name: 'Sheet' }).click();
    await page.getByRole('menuitem', { name: 'Open sheet' }).click();
    await expect(demo.locator('[data-lab-output="last"]')).toHaveText('sheet open');
    await lab.expectAccessible();
  });

  test('UIC-ACTION-ROW-3.1 shows the selection count and clears it', async ({ page, lab }) => {
    await lab.open('action-row');
    const demo = page.locator('[data-lab-case="selection"]');
    const status = demo.getByRole('status');
    await expect(status).toHaveText('2 selected');
    await demo.getByLabel('Banana').check();
    await expect(status).toHaveText('3 selected');
    await demo.getByRole('button', { name: 'Edit selected' }).focus();
    // The first Escape may close the focused action's tooltip; the next reaches the row.
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(demo.locator('.ui-action-row')).toHaveCount(0);
    await demo.getByLabel('Apple').check();
    await expect(status).toHaveText('1 selected');
    await demo.getByRole('button', { name: 'Clear selection' }).click();
    await expect(demo.locator('.ui-action-row')).toHaveCount(0);
    await demo.getByLabel('Cherry').check();
    await lab.expectAccessible();
  });
});
