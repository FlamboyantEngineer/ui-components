import { expect, test } from './fixtures.js';

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

  test('UIC-ACTION-ROW-2.2 sizes every action button', async ({ page, lab }) => {
    await lab.open('action-row');
    for (const [size, edge] of [
      ['xs', 22],
      ['sm', 26],
      ['md', 32],
      ['lg', 38],
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
    await expect(tooltip).toHaveClass(/ui-action-row__tooltip/);

    const reason = page.locator('[data-lab-case="disabled-reason"]').getByRole('button', {
      name: 'Delete',
    });
    // React Aria opens hover tooltips once the pointer has moved since the last keyboard input.
    await page.mouse.move(0, 0);
    await reason.hover();
    await expect(page.getByRole('tooltip')).toHaveText('Only the owner can delete this file');
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
      expect(Math.abs(list!.x + list!.width - (button!.x + button!.width))).toBeLessThanOrEqual(1);
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
});
