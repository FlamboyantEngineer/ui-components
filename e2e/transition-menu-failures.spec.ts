import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Transition Menu lab failures', () => {
  test('UIC-TRANSITION-MENU-1.4 UIC-TRANSITION-MENU-1.5 a refused transition keeps the state, and a dialog keeps its comment', async ({
    page,
    lab,
  }) => {
    await lab.open('transition-menu');
    const area = demo(page, 'refused');
    const trigger = area.getByRole('button', { name: /^Status: Draft/ });

    await trigger.click();
    await page.getByRole('menuitem', { name: /Submit for review/ }).click();
    await expect(area.locator('[data-lab-menu="refused"]')).toHaveAttribute('data-pending');
    await expect(output(page, 'Refused log')).toHaveText('submit refused');
    await expect(area.locator('[data-lab-menu="refused"]')).not.toHaveAttribute('data-pending');
    await expect(trigger).toBeVisible();

    await trigger.click();
    await page.getByRole('menuitem', { name: /Withdraw/ }).click();
    const dialog = page.getByRole('dialog', { name: /Withdrawn/ });
    await dialog.getByRole('textbox').fill('Sent to the wrong team.');
    await dialog.getByRole('button', { name: 'Withdraw' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('The server is offline. Try again later.');
    await expect(dialog.getByRole('textbox')).toHaveValue('Sent to the wrong team.');
    await expect(output(page, 'Refused log')).toHaveText('submit refused, withdraw refused');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeVisible();
  });

  for (const change of [
    'Remove the transition',
    'Make it unavailable',
    'Lead it elsewhere',
    'Move the record',
    'Disable the menu',
  ]) {
    test(`UIC-TRANSITION-MENU-1.8 closes the dialog without running when the change "${change}" lands`, async ({
      page,
      lab,
    }) => {
      await lab.open('transition-menu');
      const area = demo(page, 'revoked');
      await area.getByRole('button', { name: change }).click();
      await area.getByRole('button', { name: 'Arm the change' }).click();
      await area.getByRole('button', { name: /^Status: In review/ }).click();
      await page.getByRole('menuitem', { name: /Approve/ }).click();
      const dialog = page.getByRole('dialog', { name: /Approved/ });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCount(0, { timeout: 5000 });
      await expect(output(page, 'Applied change')).toHaveText(change);
      await expect(output(page, 'Revoked runs')).toHaveText('none');
    });
  }
});
