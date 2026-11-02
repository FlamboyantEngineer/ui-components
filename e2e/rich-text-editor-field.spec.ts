import { expect, matrixCell, test } from './fixtures.js';

test.describe('Rich Text Editor field states, layouts and sizes', () => {
  test('UIC-RICH-TEXT-EDITOR-1.1 shows a warning, a pending field and an async check outcome', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    const warning = matrixCell(page, 'validation=warning').locator('.ui-field');
    await expect(warning).toHaveAttribute('data-validation', 'warning');
    await expect(warning.locator('.ui-field__message')).toHaveText(
      'Long notes may be cut on the label printer.',
    );
    const pending = matrixCell(page, 'validation=pending').locator('.ui-field');
    await expect(pending).toHaveAttribute('data-validation', 'pending');
    const checked = matrixCell(page, 'validation=async check');
    const field = checked.locator('.ui-field');
    const editor = checked.getByRole('textbox', { name: 'Note' });
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' soon');
    await expect(field).toHaveAttribute('data-validation', 'pending');
    await expect(field.locator('.ui-field__message')).toHaveText(
      'The orchard has no record of this note: name a pear.',
    );
    await page.keyboard.type(' and a pear');
    await expect(field).toHaveAttribute('data-validation', 'pending');
    await expect(field).toHaveAttribute('data-validation', 'valid');
  });

  test('UIC-RICH-TEXT-EDITOR-1.5 lays out the label, toolbar and document at each layout and size', async ({
    page,
    lab,
  }) => {
    await lab.open('rich-text-editor');
    for (const layout of [
      'label-control',
      'control-label',
      'label-colon-control',
      'control-only',
    ]) {
      for (const size of ['xs', 'sm', 'md', 'lg']) {
        const cell = matrixCell(page, `layout=${layout} size=${size}`);
        await expect(cell.getByRole('textbox', { name: 'Note' })).toBeVisible();
        await expect(cell.getByRole('toolbar')).toBeVisible();
      }
    }
    await expect(
      matrixCell(page, 'layout=control-only size=md').locator('.ui-field__label'),
    ).toHaveCount(0);
    await lab.expectAccessible();
  });
});
