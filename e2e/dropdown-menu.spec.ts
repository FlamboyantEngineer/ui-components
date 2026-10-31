import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell, controlHeight } from './fixtures.js';

function popovers(page: Page): Locator {
  return page.locator('.ui-menu-popover');
}

function section(page: Page, title: string): Locator {
  return page.locator(`[data-lab-section="${title}"]`);
}

test.describe('Dropdown Menu lab', () => {
  test('UIC-DROPDOWN-MENU-1.1 draws button triggers with a caret at every size', async ({
    page,
    lab,
  }) => {
    await lab.open('dropdown-menu');
    const cells = page.locator('table[data-lab-matrix="variant size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(5 * 4);
    for (const [size, height] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const trigger = page.locator(
        `[data-lab-cell="variant=secondary size=${size}"] .ui-dropdown-menu`,
      );
      expect((await trigger.boundingBox())?.height).toBe(height);
      await expect(trigger).toHaveClass(/ui-button/);
      await expect(trigger.locator('.ui-button__end-icon .ui-dropdown-menu__caret')).toBeVisible();
    }
    const noCaret = matrixCell(page, 'state=no caret size=md').locator('.ui-dropdown-menu');
    await expect(noCaret.locator('.ui-dropdown-menu__caret')).toHaveCount(0);
    const disabled = matrixCell(page, 'state=disabled size=md').locator('.ui-dropdown-menu');
    await expect(disabled).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-DROPDOWN-MENU-1.2 draws an icon-only trigger named by its label', async ({
    page,
    lab,
  }) => {
    await lab.open('dropdown-menu');
    const trigger = matrixCell(page, 'state=icon only size=md').locator('.ui-dropdown-menu');
    await expect(trigger).toHaveClass(/ui-button/);
    await expect(trigger).toHaveAccessibleName('More options');
    const box = await trigger.boundingBox();
    const height = await controlHeight(page, 'md');
    expect(box?.width).toBe(height);
    expect(box?.height).toBe(height);
    await expect(trigger.locator('.ui-dropdown-menu__caret')).toHaveCount(0);
  });

  test('UIC-DROPDOWN-MENU-1.3 UIC-DROPDOWN-MENU-1.5 opens from the keyboard and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('dropdown-menu');
    const area = section(page, 'Actions');
    const trigger = area.getByRole('button', { name: 'Edit' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-open', 'true');
    const menu = page.getByRole('menu', { name: 'Edit' });
    await expect(trigger).toHaveAttribute('aria-controls', (await menu.getAttribute('id')) ?? '');
    await expect(popovers(page).getByRole('menuitem', { name: /^Cut/ })).toBeFocused();
    const caret = trigger.locator('.ui-dropdown-menu__caret');
    await expect(caret).not.toHaveCSS('transform', 'none');
    await lab.expectAccessible('.ui-menu-popover');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).not.toHaveAttribute('data-open');
    await page.keyboard.press('ArrowUp');
    await expect(popovers(page).getByRole('menuitem', { name: /^Select all/ })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(popovers(page).getByRole('menuitem', { name: /^Copy/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(popovers(page)).toHaveCount(0);
    await expect(area.locator('[data-lab-output="action"]')).toHaveText('copy');
    await expect(trigger).toBeFocused();
  });

  test('UIC-DROPDOWN-MENU-1.4 aligns the menu to the trigger end and passes menu props', async ({
    page,
    lab,
  }) => {
    await lab.open('dropdown-menu');
    const more = section(page, 'Actions').getByRole('button', { name: 'More actions' });
    await more.click();
    const triggerBox = await more.boundingBox();
    const menuBox = await popovers(page).boundingBox();
    expect(
      Math.abs(
        (menuBox?.x ?? 0) +
          (menuBox?.width ?? 0) -
          ((triggerBox?.x ?? 0) + (triggerBox?.width ?? 0)),
      ),
    ).toBeLessThan(1);
    await page.keyboard.press('Escape');

    const choice = section(page, 'Choice');
    await choice.getByRole('button', { name: /^Layout/ }).click();
    await expect(popovers(page).locator('.ui-menu')).toHaveAttribute('data-size', 'lg');
    await popovers(page).getByRole('menuitemradio', { name: 'Grid' }).click();
    await expect(choice.locator('[data-lab-output="layout"]')).toHaveText('grid');
    await expect(choice.getByRole('button', { name: 'Layout: grid' })).toBeFocused();
  });

  test('UIC-DROPDOWN-MENU-1.3 follows a controlled open state', async ({ page, lab }) => {
    await lab.open('dropdown-menu');
    const area = section(page, 'Controlled');
    await area.getByRole('button', { name: 'Controlled' }).click();
    await expect(area.locator('[data-lab-output="open"]')).toHaveText('true');
    await page.keyboard.press('Escape');
    await expect(area.locator('[data-lab-output="open"]')).toHaveText('false');
  });

  test('UIC-DROPDOWN-MENU-1.1 stays accessible in the dark theme', async ({ page, lab }) => {
    await lab.open('dropdown-menu', { theme: 'dark' });
    await lab.expectAccessible();
    await section(page, 'Actions').getByRole('button', { name: 'Edit' }).click();
    await expect(popovers(page)).toHaveCount(1);
    await lab.expectAccessible('.ui-menu-popover');
  });

  test('UIC-DROPDOWN-MENU-1.7 draws joined split buttons that run an action or open the menu', async ({
    page,
    lab,
  }) => {
    await lab.open('dropdown-menu');
    for (const [size, height] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const root = matrixCell(page, `action=primary size=${size}`).locator(`.ui-dropdown-menu`);
      await expect(root).toHaveAttribute('data-split', 'true');
      await expect(root).toHaveAttribute('role', 'group');
      const action = await root.locator('.ui-dropdown-menu__action').boundingBox();
      const toggle = await root.locator('.ui-dropdown-menu__toggle').boundingBox();
      if (!action || !toggle) throw new Error('split button not rendered');
      expect(action.height).toBe(height);
      expect(toggle.height).toBe(height);
      expect(toggle.y).toBe(action.y);
      expect(toggle.x).toBeCloseTo(action.x + action.width - 1, 0);
    }

    const area = section(page, 'Split action');
    const output = area.locator('[data-lab-output="split"]');
    await area.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(output).toHaveText('save');
    await expect(popovers(page)).toHaveCount(0);
    const toggle = area.getByRole('button', { name: 'More options' });
    await toggle.focus();
    await page.keyboard.press('ArrowDown');
    await expect(popovers(page).getByRole('menuitem', { name: 'Save a copy' })).toBeFocused();
    await expect(area.locator('.ui-dropdown-menu')).toHaveAttribute('data-open', 'true');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Enter');
    await expect(output).toHaveText('save-copy');
    await expect(toggle).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-DROPDOWN-MENU-1.4 opens a filterable menu', async ({ page, lab }) => {
    await lab.open('dropdown-menu');
    const area = section(page, 'Filterable');
    await area.getByRole('button', { name: 'Move to' }).click();
    await expect(popovers(page).getByRole('searchbox', { name: 'Search' })).toBeFocused();
    await page.keyboard.type('os');
    await expect(popovers(page).getByRole('menuitem')).toHaveText(['Oslo']);
    await page.keyboard.press('Enter');
    await expect(area.locator('[data-lab-output="moved"]')).toHaveText('oslo');
  });
});
