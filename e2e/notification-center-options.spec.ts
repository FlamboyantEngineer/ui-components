import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);

test.describe('Notification Center options lab', () => {
  test('UIC-NOTIFICATION-CENTER-1.4 UIC-NOTIFICATION-CENTER-1.5 UIC-NOTIFICATION-CENTER-1.6 UIC-NOTIFICATION-CENTER-1.8 opens on Unread with the host controls and a next page that fails once', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const options = demo(page, 'center-options');
    await options.getByRole('button', { name: /^Notifications/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Notifications' });
    await expect(dialog.getByRole('button', { name: 'Notification settings' })).toBeVisible();
    await expect(dialog.getByText('Weekly digest is ready')).toHaveCount(0);
    await expect(dialog.getByText('Build 412 passed')).toBeVisible();

    await dialog.getByRole('button', { name: 'Accept' }).click();
    await expect(options.locator('[data-lab-output="last"]')).toHaveText('accepted review');

    await expect(options.locator('[data-lab-output="load error"]')).toHaveText(
      'The server is busy',
    );
    await dialog.getByRole('button', { name: 'Dismiss' }).first().click();
    await expect(options.locator('[data-lab-output="last"]')).toHaveText(/^dismissed /);
  });

  test('UIC-NOTIFICATION-CENTER-1.5 UIC-NOTIFICATION-CENTER-1.8 lets the host hold the filter', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const options = demo(page, 'list-options');
    const output = options.locator('[data-lab-output="filter"]');
    await expect(output).toHaveText('all');
    await options.getByRole('button', { name: 'Host switches the filter' }).click();
    await expect(output).toHaveText('unread');
    await expect(options.getByText('Weekly digest is ready')).toHaveCount(0);
    await options.getByRole('radio', { name: /^All/ }).click();
    await expect(output).toHaveText('all');
    await options.scrollIntoViewIfNeeded();
    await expect(options.locator('[data-lab-output="load error"]')).toHaveText(
      'The server is busy',
    );
  });
});
