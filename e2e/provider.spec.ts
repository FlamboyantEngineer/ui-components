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

  test('UIC-PROVIDER-3.3 UIC-PROVIDER-5.2 keeps a draft while the locale and routing come and go', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const options = page.locator('[data-lab-case="options"]');
    const draft = options.getByRole('textbox', { name: 'Draft note' });
    const amount = options.getByRole('textbox', { name: 'Amount' });
    await expect(amount).toHaveValue('1,234.5');
    await draft.fill('unsaved draft');
    await options.getByText('French locale').click();
    await expect(amount).toHaveValue('1\u202f234,5');
    await options.getByText('Client routing').click();
    await options.getByRole('link', { name: 'Options' }).click();
    await expect(options.locator('[data-lab-output="route"]')).toHaveText('#options');
    await options.getByText('French locale').click();
    await options.getByText('Client routing').click();
    await expect(amount).toHaveValue('1,234.5');
    await expect(draft).toHaveValue('unsaved draft');
    await options.getByRole('link', { name: 'Options' }).click();
    await expect(page).toHaveURL(/#options$/);
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

  test('UIC-PROVIDER-8.1 reads today from the provider clock in its time zone', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const today = page.locator('[data-lab-output="today"]');
    const harvest = page.locator('[data-lab-field="harvest"]');
    const log = page.getByRole('list', { name: 'Garden log' });
    await expect(today).toHaveText('2026-10-31');
    await expect(harvest).toHaveAttribute('data-relation', 'future');
    await expect(harvest.getByRole('button', { name: /Tomorrow/ })).toBeVisible();
    await expect(log.getByRole('heading', { name: 'Today' })).toBeVisible();
    await page.getByRole('radio', { name: 'Asia/Tokyo' }).click();
    await expect(today).toHaveText('2026-11-01');
    await expect(harvest).toHaveAttribute('data-relation', 'present');
    await expect(harvest.getByRole('button', { name: /Today/ })).toBeVisible();
    await expect(log.getByRole('heading', { name: 'Yesterday' })).toBeVisible();
    await lab.expectAccessible();
  });
});
