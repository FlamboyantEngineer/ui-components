import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function settled(page: Page) {
  const overlay = page.locator('.ui-modal.ui-signature-dialog');
  await expect(overlay).toBeVisible();
  await expect(overlay).not.toHaveAttribute('data-entering');
}

test.describe('Signature Dialog lab', () => {
  test('UIC-SIGNATURE-DIALOG-1.1 UIC-SIGNATURE-DIALOG-1.2 UIC-SIGNATURE-DIALOG-1.4 opens every configuration', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog');
    for (const meanings of ['one', 'several']) {
      for (const credentials of ['password', 'username-password']) {
        const cell = page.locator(
          `[data-lab-cell="meanings=${meanings} credentials=${credentials}"]`,
        );
        const opener = cell.getByRole('button', { name: 'Sign', exact: true });
        await opener.click();
        const dialog = page.getByRole('dialog', { name: 'Sign Requirement 12' });
        await settled(page);
        await expect(dialog.getByText('Signing as Ada Lovelace')).toBeVisible();
        await expect(dialog.getByRole('radiogroup', { name: 'Meaning of signature' })).toHaveCount(
          meanings === 'several' ? 1 : 0,
        );
        await expect(dialog.getByRole('textbox', { name: 'User name' })).toHaveCount(
          credentials === 'username-password' ? 1 : 0,
        );
        await expect(dialog.locator('input[type="password"]')).toHaveCount(1);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-SIGNATURE-DIALOG-2.1 UIC-SIGNATURE-DIALOG-2.2 validates, shows a refused password, then signs', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog');
    await page.locator('[data-lab-open="change"]').click();
    const dialog = page.getByRole('dialog', { name: 'Sign the release of version 2.4' });
    await settled(page);
    await expect(dialog.locator('.ui-signature-dialog__summary')).toContainText('3 requirements');
    await lab.expectAccessible('.ui-modal');
    const sign = dialog.getByRole('button', { name: 'Sign', exact: true });
    await sign.click();
    await expect(dialog.getByRole('radio', { name: 'Approved' })).toBeFocused();
    await expect(dialog.locator('.ui-field[data-validation="invalid"]')).toHaveCount(2);

    await dialog.getByText('Reviewed', { exact: true }).click();
    await expect(dialog.getByRole('radio', { name: 'Reviewed' })).toBeChecked();
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Checked against the plan');
    const password = dialog.locator('input[type="password"]');
    await password.fill('apple');
    await sign.click();
    await expect(dialog.getByRole('alert')).toHaveText('The password is not right.');
    await expect(password).toHaveValue('');
    await expect(dialog.getByRole('textbox', { name: 'Reason' })).toHaveValue(
      'Checked against the plan',
    );
    await password.fill('orchard');
    await page.keyboard.press('Control+Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-lab-output="signed"]')).toHaveText(
      'Ada Lovelace, review, Checked against the plan',
    );
  });

  test('UIC-SIGNATURE-DIALOG-1.3 asks for a required reason and drawing', async ({ page, lab }) => {
    await lab.open('signature-dialog');
    const cell = page.locator('[data-lab-cell="reason=required drawing=required"]');
    await cell.getByRole('button', { name: 'Sign', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Sign the inspection report' });
    await settled(page);
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Annual check');
    await dialog.locator('input[type="password"]').fill('secret');
    await dialog.getByRole('button', { name: 'Sign', exact: true }).click();
    const area = dialog.getByRole('img', { name: 'Signature' });
    await expect(area).toBeFocused();
    await dialog.getByRole('radio', { name: 'Type' }).click();
    await expect(dialog.locator('.ui-signature-pad')).toHaveAttribute('data-mode', 'type');
    await dialog.getByRole('textbox', { name: 'Signature' }).fill('Grace Hopper');
    await dialog.getByRole('button', { name: 'Sign', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-lab-output="entries-required-required"]')).toHaveText(
      'Grace Hopper, approve, Annual check, typed',
    );
  });

  test('UIC-SIGNATURE-DIALOG-1.1 keeps the dialog readable in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog', { theme: 'dark' });
    await page.locator('[data-lab-open="change"]').click();
    await settled(page);
    await lab.expectAccessible('.ui-modal');
  });
});
