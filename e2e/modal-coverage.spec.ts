import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const section = (page: Page, title: string) => page.locator(`[data-lab-section="${title}"]`);
const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Modal lab coverage', () => {
  test('UIC-MODAL-1.1 UIC-MODAL-1.6 a dialog and a trigger with defaultOpen open when they mount', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const area = section(page, 'Open on mount');
    await area.getByRole('button', { name: 'Mount the welcome dialog' }).click();
    const welcome = page.getByRole('dialog', { name: 'Welcome' });
    await expect(welcome).toBeVisible();
    await welcome.getByRole('button', { name: 'Close' }).click();
    await expect(welcome).toHaveCount(0);

    await area.getByRole('button', { name: 'Mount the tips trigger' }).click();
    const tips = page.getByRole('dialog', { name: 'Tips' });
    await expect(tips).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tips).toHaveCount(0);
    await expect(output(page, 'Mount events')).toHaveText('dialog closed, trigger closed');
  });

  test('UIC-MODAL-2.1 isKeyboardDismissDisabled refuses Escape while Cancel and outside presses close', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const area = section(page, 'Escape refused on its own');
    const trigger = area.getByRole('button', { name: 'Edit the label' });
    const dialog = page.getByRole('dialog', { name: 'Label' });
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-lab-modal="keyboard-dismiss"][data-entering]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);

    await trigger.click();
    await expect(page.locator('[data-lab-modal="keyboard-dismiss"][data-entering]')).toHaveCount(0);
    await page.mouse.click(4, 400);
    await expect(dialog).toHaveCount(0);
    await expect(output(page, 'Keyboard dismiss closes')).toHaveText('closed 1, closed 2');

    await area.getByText('Refuse Escape').click();
    await trigger.click();
    await expect(page.locator('[data-lab-modal="keyboard-dismiss"][data-entering]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('UIC-MODAL-22.1 UIC-MODAL-22.3 UIC-MODAL-21.6 helpers take a third action, custom Cancel text and retry a failed confirm', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const area = section(page, 'Confirmation helpers: choices and failures');
    const log = output(page, 'Helper log');

    await area.getByRole('button', { name: 'Leave the plum list' }).click();
    let dialog = page.getByRole('alertdialog', { name: 'Save the changes to the plum list?' });
    await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeVisible();
    await dialog.getByRole('button', { name: "Don't save" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(log).toHaveText('dropped the changes; confirm resolved false');

    await area.getByRole('button', { name: 'Rename the crate' }).click();
    dialog = page.getByRole('dialog', { name: 'Rename the crate' });
    await dialog.getByRole('button', { name: 'Keep the name' }).click();
    await expect(log).toContainText('prompt kept the name');

    await area.getByRole('button', { name: 'Ship crate 12' }).click();
    dialog = page.getByRole('alertdialog', { name: 'Ship crate 12?' });
    await dialog.getByRole('button', { name: 'Ship' }).click();
    await expect(dialog.getByRole('progressbar', { name: 'Shipping' })).toBeVisible();
    await expect(dialog.getByRole('alert')).toHaveText('The van is full. Try again.');
    await dialog.getByRole('button', { name: 'Ship' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(log).toContainText('ship attempt 1; ship attempt 2; ship resolved true');
  });
});
