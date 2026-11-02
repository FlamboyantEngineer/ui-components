import type { Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);

test.describe('Dropdown Menu lab coverage', () => {
  test('UIC-DROPDOWN-MENU-1.4 chooses several entries from defaults and closes on choice only when asked', async ({
    page,
    lab,
  }) => {
    await lab.open('dropdown-menu');
    const area = demo(page, 'multiple');
    const output = area.locator('[data-lab-output="multiple"]');
    await area.getByRole('button', { name: 'Fruit' }).click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Apples' })).toBeChecked();
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Pears' })).toBeChecked();
    await expect(menu.getByRole('menuitemcheckbox', { name: /Quinces/ })).toBeDisabled();
    await menu.getByRole('menuitemcheckbox', { name: 'Plums' }).click();
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitemcheckbox', { name: 'Apples' }).click();
    await expect(output).toHaveText('Selected: pears, plums; shouldCloseOnSelect: false');
    await page.keyboard.press('Escape');
    await area.getByText('Close on each choice').click();
    await area.getByRole('button', { name: 'Fruit' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Apples' }).click();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(output).toHaveText('Selected: apples, pears, plums; shouldCloseOnSelect: true');
  });

  test('UIC-DROPDOWN-MENU-1.1 UIC-DROPDOWN-MENU-1.2 opens on mount and draws icon-only triggers in every variant', async ({
    page,
    lab,
  }) => {
    await lab.open('dropdown-menu');
    const mount = demo(page, 'default-open');
    await mount.getByRole('button', { name: 'Add the share menu' }).click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Send by mail' }).click();
    await expect(mount.locator('[data-lab-output="default-open"]')).toHaveText('Last action: mail');
    for (const variant of ['link', 'accent', 'chip', 'bare']) {
      const trigger = matrixCell(page, `variant=${variant}`).getByRole('button', {
        name: 'More options',
      });
      await expect(trigger).toHaveAttribute('data-variant', variant);
      await expect(
        matrixCell(page, `variant=${variant} size=md`).getByRole('button'),
      ).toHaveAttribute('data-variant', variant);
    }
    await lab.expectAccessible();
  });
});
