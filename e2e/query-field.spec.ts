import { expect, test } from './fixtures.js';

test.describe('Query Field lab', () => {
  test('UIC-QUERY-FIELD-1.1 UIC-QUERY-FIELD-1.3 UIC-QUERY-FIELD-1.5 UIC-CODE-EDITOR-1.7 draws one-line queries in every state', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const cells = page.locator('table[data-lab-matrix="state"] td[data-lab-cell]');
    expect(await cells.count()).toBe(5);
    const valid = page.getByRole('textbox', { name: 'Query, valid' });
    await expect(valid).toHaveAttribute('aria-multiline', 'false');
    const box = await valid.boundingBox();
    expect(box?.height).toBeLessThan(40);
    const invalid = page.locator('[data-lab-cell="state=invalid"] .ui-query-field');
    await expect(invalid).toHaveAttribute('data-invalid', 'true');
    await expect(invalid.locator('.ui-code-editor__diagnostic')).toHaveCount(2);
    await expect(invalid.getByRole('button', { name: 'Run query' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Query, disabled' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Query, read-only' })).toHaveAttribute(
      'readonly',
    );
    await lab.expectAccessible();
  });

  test('UIC-QUERY-FIELD-1.2 UIC-QUERY-FIELD-1.4 UIC-CODE-EDITOR-1.7 completes values and submits on Enter', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const demo = page.locator('[data-lab-demo="submit"]');
    const input = demo.getByRole('textbox', { name: 'Search books' });
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-submitted] li')).toHaveCount(0);
    await page.keyboard.type('tr');
    const list = page.getByRole('listbox');
    await expect(list.getByRole('option', { name: /travel/ })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('genre:travel');
    await expect(list).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-submitted] li')).toHaveText(['genre:travel']);
    await expect(input).toHaveValue('genre:travel');
    await page.keyboard.type(' OR genre:cooking');
    await page.keyboard.press('Escape');
    await demo.getByRole('button', { name: 'Run query' }).click();
    await expect(demo.locator('[data-lab-submitted] li')).toHaveText([
      'genre:travel',
      'genre:travel OR genre:cooking',
    ]);
  });
});
