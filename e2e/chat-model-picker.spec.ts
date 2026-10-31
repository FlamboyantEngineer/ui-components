import type { Locator, Page } from '@playwright/test';
import { expect, test, waitForLab, matrixCell } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const cell = (page: Page, state: string) => matrixCell(page, `state=${state}`);
const picker = (scope: Locator) => scope.getByRole('button', { name: /^Model:/ });

test.describe('Chat Model Picker lab', () => {
  test('UIC-CHAT-MODEL-PICKER-2.4 UIC-CHAT-MODEL-PICKER-3.2 chooses a model and an effort by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-model-picker');
    const controlled = demo(page, 'controlled');
    const trigger = picker(controlled);
    await expect(trigger).toHaveAccessibleName('Model: Swift, Low effort');
    await expect(trigger).toHaveText('Swift · Low');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'Model: Swift, Low effort' });
    await expect(menu.getByRole('menuitemradio', { name: /^Swift/ })).toBeFocused();
    await page.keyboard.type('d');
    await expect(menu.getByRole('menuitemradio', { name: /^Deep/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAccessibleName('Model: Deep, High effort');
    await expect(controlled.locator('[data-lab-output="reported"]')).toHaveText(
      'model deep, effort high',
    );
    await page.keyboard.press('ArrowUp');
    const reopened = page.getByRole('menu', { name: 'Model: Deep, High effort' });
    await expect(reopened.getByRole('menuitemradio', { name: /^High/ })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(reopened.getByRole('menuitemradio', { name: /^Medium/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(controlled.locator('[data-lab-output="effort"]')).toHaveText('medium');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAccessibleName('Model: Deep, Medium effort');
  });

  test('UIC-CHAT-MODEL-PICKER-2.1 UIC-CHAT-MODEL-PICKER-2.2 UIC-CHAT-MODEL-PICKER-2.3 shows the efforts only while the model takes one', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-model-picker');
    const trigger = picker(cell(page, 'with efforts'));
    await expect(trigger).toHaveAttribute('data-has-effort', 'true');
    await trigger.click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('group')).toHaveText([/^Model/, /^Effort/]);
    await expect(menu.getByRole('menuitemradio', { name: /^Deep New/ })).toBeVisible();
    const max = menu.getByRole('menuitemradio', { name: /^Max/ });
    await expect(max).toHaveAttribute('aria-disabled', 'true');
    await expect(max).toContainText('Not available in this workspace');
    await expect(
      menu.getByRole('group', { name: 'Effort' }).locator('.ui-menu-item__label'),
    ).toHaveText(['Low', 'Medium', 'High']);
    await menu.getByRole('menuitemradio', { name: /^Classic/ }).click();
    await expect(menu).toHaveCount(0);
    await expect(trigger).toHaveAccessibleName('Model: Classic');
    await expect(trigger).not.toHaveAttribute('data-has-effort');
    await trigger.click();
    await expect(page.getByRole('menu').getByRole('group')).toHaveText([/^Model/]);
    await page.keyboard.press('Escape');
    await picker(cell(page, 'without efforts')).click();
    await expect(page.getByRole('menu').getByRole('group')).toHaveText([/^Model/]);
    await page.keyboard.press('Escape');
    await expect(picker(cell(page, 'disabled'))).toBeDisabled();
  });

  test('UIC-CHAT-MODEL-PICKER-3.3 keeps the chosen model and effort across a reload', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-model-picker');
    const trigger = picker(demo(page, 'persisted'));
    await expect(trigger).toHaveAccessibleName('Model: Swift, Low effort');
    await trigger.click();
    await page.getByRole('menuitemradio', { name: /^Deep/ }).click();
    await trigger.click();
    await page.getByRole('menuitemradio', { name: /^Medium/ }).click();
    await expect(trigger).toHaveAccessibleName('Model: Deep, Medium effort');
    await page.reload();
    await waitForLab(page);
    await expect(picker(demo(page, 'persisted'))).toHaveAccessibleName(
      'Model: Deep, Medium effort',
    );
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-CHAT-MODEL-PICKER-1.2 UIC-CHAT-MODEL-PICKER-2.1 passes axe with the menu open in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await lab.open('chat-model-picker', theme === 'dark' ? { theme } : {});
      await lab.expectAccessible();
      await picker(cell(page, 'with efforts')).click();
      const popover = page.locator('.ui-menu-popover');
      await expect(popover).toBeVisible();
      await expect(popover).not.toHaveAttribute('data-entering');
      await lab.expectAccessible('.ui-menu-popover');
    });
  }
});
