import { expect, matrixCell, test } from './fixtures.js';

test.describe('Snippet Field lab', () => {
  test('UIC-SNIPPET-FIELD-1.1 draws saved, empty and locked fields', async ({ page, lab }) => {
    await lab.open('snippet-field');
    await expect(matrixCell(page, 'state=empty').locator('.ui-snippet-field__empty')).toHaveText(
      'No snippet saved.',
    );
    await expect(matrixCell(page, 'state=saved').locator('.ui-snippet-field__saved')).toContainText(
      'return message;',
    );
    await expect(
      matrixCell(page, 'state=read-only').getByRole('button', { name: 'Preview' }),
    ).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Snippet, disabled' })).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-SNIPPET-FIELD-2.1 UIC-SNIPPET-FIELD-2.2 UIC-SNIPPET-FIELD-2.3 previews, refuses, applies and updates', async ({
    page,
    lab,
  }) => {
    await lab.open('snippet-field');
    const demo = page.locator('[data-lab-demo="linked"]');
    const source = demo.getByRole('textbox', { name: 'Example source' });
    const preview = demo.getByRole('button', { name: 'Preview' });
    const status = demo.locator('.ui-snippet-field__status');
    const saved = demo.locator('[data-lab-output="Saved code"]');
    await preview.click();
    await expect(status).toHaveText('The saved snippet is up to date.');
    await demo.getByRole('button', { name: 'Edit samples/greet.ts' }).click();
    await preview.click();
    await expect(status).toHaveText('Loading snippet…');
    await expect(status).toHaveText('The source changed since this snippet was saved.');
    await expect(demo.locator('.ui-snippet-field')).toHaveAttribute('data-stale', 'true');
    await lab.expectAccessible('[data-lab-demo="linked"]');
    await demo.getByRole('button', { name: 'Update snippet' }).click();
    await expect(saved).toContainText('Welcome');
    await expect(source).toBeFocused();
    await source.fill('private/keys.ts');
    await demo.getByRole('textbox', { name: 'First line' }).fill('');
    await demo.getByRole('textbox', { name: 'Last line' }).fill('');
    await preview.click();
    await expect(status).toHaveText('You cannot read this source.');
    await expect(saved).toContainText('Welcome');
    await source.fill('samples/total.py');
    await preview.click();
    await demo.getByRole('button', { name: 'Use snippet' }).click();
    await expect(saved).toHaveText('"def total(values):\\n    return sum(values)\\n"');
    await expect(demo.locator('[data-lab-output="Commits"]')).toHaveText('2');
  });
});
