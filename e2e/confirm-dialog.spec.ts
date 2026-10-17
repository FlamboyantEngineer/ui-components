import { expect, test } from './fixtures.js';

test.describe('Confirm Dialog lab', () => {
  test('UIC-CONFIRM-DIALOG-1.1 UIC-CONFIRM-DIALOG-1.3 UIC-CONFIRM-DIALOG-1.4 opens every cell with focus on the safe action', async ({
    page,
    lab,
  }) => {
    await lab.open('confirm-dialog');
    for (const tone of ['neutral', 'danger']) {
      for (const size of ['sm', 'md', 'lg']) {
        for (const focus of ['cancel', 'confirm']) {
          const cell = page.locator(`[data-lab-cell="tone=${tone} size=${size} focus=${focus}"]`);
          const button = cell.getByRole('button');
          await button.click();
          const dialog = page.getByRole('alertdialog');
          const verb = tone === 'danger' ? 'Delete' : 'Archive';
          await expect(dialog).toHaveAccessibleName(`${verb} Report.pdf?`);
          await expect(page.locator('.ui-modal.ui-confirm-dialog')).toHaveAttribute(
            'data-tone',
            tone,
          );
          const confirmButton = dialog.getByRole('button', { name: verb });
          await expect(confirmButton).toHaveAttribute(
            'data-variant',
            tone === 'danger' ? 'danger' : 'primary',
          );
          await expect(
            focus === 'cancel' ? dialog.getByRole('button', { name: 'Cancel' }) : confirmButton,
          ).toBeFocused();
          await page.keyboard.press('Escape');
          await expect(dialog).toHaveCount(0);
          await expect(button).toBeFocused();
          await expect(cell.locator('[data-lab-output="answer"]')).toHaveText('cancelled');
        }
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-CONFIRM-DIALOG-1.2 reports the answer of the declarative dialog', async ({
    page,
    lab,
  }) => {
    await lab.open('confirm-dialog');
    const cell = page.locator('[data-lab-cell="tone=danger size=md focus=cancel"]');
    await cell.getByRole('button').click();
    await expect(page.getByRole('alertdialog')).toHaveAccessibleDescription(
      'The file is removed for everyone. This cannot be undone.',
    );
    await lab.expectAccessible('.ui-modal');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(cell.locator('[data-lab-output="answer"]')).toHaveText('confirmed');
  });

  test('UIC-CONFIRM-DIALOG-2.1 resolves the awaited confirmation', async ({ page, lab }) => {
    await lab.open('confirm-dialog');
    const opener = page.locator('[data-lab-open="await"]');
    const output = page.locator('[data-lab-output="awaited"]');
    await opener.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(output).toHaveText('false');
    await expect(opener).toBeFocused();

    await opener.click();
    await page.keyboard.press('Escape');
    await expect(output).toHaveText('false');

    await page.getByRole('checkbox', { name: 'Hold the delete until I finish it' }).check();
    await opener.click();
    const dialog = page.getByRole('alertdialog');
    const remove = dialog.getByRole('button', { name: 'Delete', exact: true });
    await remove.click();
    await expect(remove).toHaveAttribute('data-pending', 'true');
    await expect(output).toHaveText('false');
    await dialog.locator('[data-lab-action="finish"]').click();
    await expect(dialog).toHaveCount(0);
    await expect(output).toHaveText('true');
    await expect(opener).toBeFocused();
  });

  test('UIC-CONFIRM-DIALOG-1.4 passes an accessibility check in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('confirm-dialog', { theme: 'dark' });
    await lab.expectAccessible();
    await page.locator('[data-lab-cell="tone=danger size=md focus=cancel"] button').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await lab.expectAccessible('.ui-modal');
  });
});
