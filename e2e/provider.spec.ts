import { expect, test } from './fixtures.js';

test.describe('Provider lab', () => {
  test('UIC-PROVIDER-6.1 keeps values with their storage adapter and key', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const storage = page.locator('[data-lab-case="storage"]');
    await storage.getByRole('button', { name: 'Stored count 2', exact: true }).click();
    await storage.getByRole('button', { name: 'Switch storage', exact: true }).click();
    await storage.getByRole('button', { name: 'Stored count 10', exact: true }).click();
    await storage.getByRole('button', { name: 'Switch storage key' }).click();
    await expect(
      storage.getByRole('button', { name: 'Stored count 20', exact: true }),
    ).toBeVisible();
    await storage.getByRole('button', { name: 'Switch storage key' }).click();
    await expect(
      storage.getByRole('button', { name: 'Stored count 11', exact: true }),
    ).toBeVisible();
    await storage.getByRole('button', { name: 'Switch storage', exact: true }).click();
    await expect(
      storage.getByRole('button', { name: 'Stored count 3', exact: true }),
    ).toBeVisible();
  });

  test('UIC-PROVIDER-7.1 pauses a page shortcut while a menu or a field popup is open', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const shortcut = page.locator('[data-lab-case="shortcut"]');
    const overlay = shortcut.locator('[data-lab-output="overlay"]');
    const notes = shortcut.locator('[data-lab-output="notes"]');
    const skipped = shortcut.locator('[data-lab-output="skipped"]');

    await shortcut.getByRole('button', { name: 'Help' }).focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.keyboard.press('n');
    await expect(notes).toHaveText('1');
    await expect(overlay).toHaveText('no');

    await shortcut.getByRole('button', { name: 'Insert' }).click();
    await expect(overlay).toHaveText('yes');
    await page.getByRole('menuitem', { name: 'Shape' }).hover();
    await expect(page.getByRole('menu', { name: 'Shape' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('menu', { name: 'Shape' })).toHaveCount(0);
    await expect(overlay).toHaveText('yes');
    await page.keyboard.press('n');
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveText('no');

    await shortcut.getByRole('button', { name: /Size/ }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('n');
    await page.keyboard.press('Escape');

    await shortcut.getByRole('button', { name: /Calendar/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('n');
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveText('no');

    await expect(skipped).toHaveText('3');
    await page.locator('body').press('n');
    await expect(notes).toHaveText('2');
    await lab.expectAccessible();
  });
});
