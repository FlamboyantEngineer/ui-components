import { expect, test, matrixCell } from './fixtures.js';

test.describe('Modal confirmation helpers', () => {
  test('UIC-MODAL-21.1 UIC-MODAL-21.3 UIC-MODAL-21.4 opens every cell with focus on the safe action', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    for (const tone of ['neutral', 'danger']) {
      for (const size of ['sm', 'md', 'lg']) {
        for (const focus of ['cancel', 'confirm']) {
          const cell = matrixCell(page, `tone=${tone} size=${size} focus=${focus}`, {
            family: 'modal-confirmation-cases',
          });
          const button = cell.getByRole('button');
          await button.click();
          const dialog = page.getByRole('alertdialog');
          const verb = tone === 'danger' ? 'Delete' : 'Archive';
          await expect(dialog).toHaveAccessibleName(`${verb} Report.pdf?`);
          await expect(page.locator('.ui-modal.ui-modal')).toHaveAttribute('data-tone', tone);
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

  test('UIC-MODAL-21.2 reports the answer of the declarative dialog', async ({ page, lab }) => {
    await lab.open('modal');
    const cell = matrixCell(page, 'tone=danger size=md focus=cancel', {
      family: 'modal-confirmation-cases',
    });
    await cell.getByRole('button').click();
    await expect(page.getByRole('alertdialog')).toHaveAccessibleDescription(
      'The file is removed for everyone. This cannot be undone.',
    );
    await lab.expectAccessible('.ui-modal');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(cell.locator('[data-lab-output="answer"]')).toHaveText('confirmed');
  });

  test('UIC-MODAL-22.1 resolves the awaited confirmation', async ({ page, lab }) => {
    await lab.open('modal');
    const opener = page
      .locator('[data-lab-family="modal-confirmation-cases"]')
      .locator('[data-lab-open="await"]');
    const output = page
      .locator('[data-lab-family="modal-confirmation-cases"]')
      .locator('[data-lab-output="awaited"]');
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

  test('UIC-MODAL-21.4 passes an accessibility check in the dark theme', async ({ page, lab }) => {
    await lab.open('modal', { theme: 'dark' });
    await lab.expectAccessible();
    await matrixCell(page, 'tone=danger size=md focus=cancel', {
      family: 'modal-confirmation-cases',
    })
      .locator('button')
      .click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await lab.expectAccessible('.ui-modal');
  });

  test('UIC-MODAL-21.7 UIC-MODAL-21.8 draws news tones with their glyph and one action', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    for (const [tone, icon, glyph] of [
      ['info', 'default', 'info'],
      ['success', 'default', 'success'],
      ['warning', 'default', 'warning'],
      ['danger', 'error', 'error'],
    ] as const) {
      await matrixCell(page, `tone=${tone} icon=${icon}`, { family: 'modal-confirmation-cases' })
        .locator(`button`)
        .click();
      const overlay = page.locator(`.ui-modal[data-lab-modal="news-${tone}-${icon}"]`);
      await expect(overlay).toHaveAttribute('data-tone', tone);
      const mark = overlay.locator('.ui-modal__title .ui-modal__confirmation-icon');
      await expect(mark).toHaveAttribute('data-glyph', glyph);
      await expect(mark).toBeVisible();
      const dialog = page.getByRole('alertdialog', { name: `A ${tone} dialog` });
      await expect(dialog.getByRole('button')).toHaveText(['OK']);
      await expect(dialog.getByRole('button', { name: 'OK' })).toBeFocused();
      if (tone === 'warning') await lab.expectAccessible('.ui-modal');
      await page.keyboard.press('Enter');
      await expect(overlay).toHaveCount(0);
    }
    await matrixCell(page, 'tone=info icon=none', { family: 'modal-confirmation-cases' })
      .locator('button')
      .click();
    await expect(page.locator('.ui-modal__confirmation-icon')).toHaveCount(0);
  });

  test('UIC-MODAL-21.6 takes the third action without cancelling', async ({ page, lab }) => {
    await lab.open('modal');
    await page
      .locator('[data-lab-family="modal-confirmation-cases"]')
      .locator('[data-lab-open="third"]')
      .click();
    const dialog = page.getByRole('alertdialog', { name: 'Save changes to Report.pdf?' });
    await expect(dialog.locator('.ui-modal__actions button')).toHaveText([
      'Cancel',
      "Don't save",
      'Save',
    ]);
    await lab.expectAccessible('.ui-modal');
    await dialog.getByRole('button', { name: "Don't save" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page
        .locator('[data-lab-family="modal-confirmation-cases"]')
        .locator('[data-lab-output="third"]'),
    ).toHaveText('discarded');
  });

  test('UIC-MODAL-21.9 confirms in a popover against its button', async ({ page, lab }) => {
    await lab.open('modal');
    const opener = page
      .locator('[data-lab-family="modal-confirmation-cases"]')
      .locator('[data-lab-open="anchored"]');
    await opener.click();
    const popover = page.locator('.ui-modal[data-lab-modal="anchored"]');
    await expect(popover).toHaveAttribute('data-layer', 'dropdown');
    const dialog = page.getByRole('dialog', { name: 'Remove Lima?' });
    await expect(dialog).toHaveAccessibleDescription('It leaves the itinerary.');
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    const button = await opener.boundingBox();
    const box = await popover.boundingBox();
    if (!button || !box) throw new Error('not rendered');
    expect(box.width).toBeLessThan(400);
    expect(box.x).toBeCloseTo(button.x, 0);
    await lab.expectAccessible('.ui-modal');
    await dialog.getByRole('button', { name: 'Remove' }).click();
    await expect(popover).toHaveCount(0);
    await expect(
      page
        .locator('[data-lab-family="modal-confirmation-cases"]')
        .locator('[data-lab-output="anchored"]'),
    ).toHaveText('removed');
    await expect(opener).toBeFocused();
  });

  test('UIC-MODAL-22.2 UIC-MODAL-22.3 awaits an alert and a prompt', async ({ page, lab }) => {
    await lab.open('modal');
    const result = page
      .locator('[data-lab-family="modal-confirmation-cases"]')
      .locator('[data-lab-output="helpers"]');
    await page
      .locator('[data-lab-family="modal-confirmation-cases"]')
      .locator('[data-lab-open="alert"]')
      .click();
    const alertDialog = page.getByRole('alertdialog', { name: 'Export finished' });
    await expect(alertDialog.getByRole('button', { name: 'OK' })).toBeFocused();
    await expect(page.locator('.ui-modal[data-lab-modal="alert"]')).toHaveAttribute(
      'data-tone',
      'info',
    );
    await page.keyboard.press('Enter');
    await expect(result).toHaveText('acknowledged');

    await page
      .locator('[data-lab-family="modal-confirmation-cases"]')
      .locator('[data-lab-open="prompt"]')
      .click();
    const promptDialog = page.getByRole('dialog', { name: 'Add a city' });
    const field = promptDialog.getByRole('textbox', { name: 'City' });
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('Lima');
    await lab.expectAccessible('.ui-modal');
    await field.fill('Oslo');
    await page.keyboard.press('Enter');
    await expect(promptDialog).toHaveCount(0);
    await expect(result).toHaveText('added Oslo');

    await page
      .locator('[data-lab-family="modal-confirmation-cases"]')
      .locator('[data-lab-open="prompt"]')
      .click();
    await page
      .getByRole('dialog', { name: 'Add a city' })
      .getByRole('button', { name: 'Cancel' })
      .click();
    await expect(result).toHaveText('cancelled');
  });
});
