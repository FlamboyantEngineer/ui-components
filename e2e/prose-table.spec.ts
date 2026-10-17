import { expect, test } from './fixtures.js';

test.describe('Prose Table lab', () => {
  test('UIC-PROSE-TABLE-1.1 fills its text column and takes the surrounding typography', async ({
    page,
    lab,
  }) => {
    await lab.open('prose-table');
    const body = page.locator('[data-lab-cell="content=text text=body"]');
    const table = body.locator('.ui-prose-table');
    const host = await body.locator('p').boundingBox();
    const box = await table.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(Math.round(host?.width ?? 1));
    await expect(table.locator('thead th')).toHaveText(['Fruit', 'Colour', 'Season']);
    await expect(table.locator('tbody td').first()).toHaveCSS('border-top-style', 'solid');
    await expect(
      page.locator('[data-lab-cell="content=text text=small"] .ui-prose-table td').first(),
    ).toHaveCSS('font-size', '12px');
    await expect(
      page.locator('[data-lab-cell="content=short rows text=body"] tbody tr').last().locator('td'),
    ).toHaveCount(3);
  });

  test('UIC-PROSE-TABLE-1.3 keeps native table roles and focusable cell content only', async ({
    page,
    lab,
  }) => {
    await lab.open('prose-table');
    const cell = page.locator('[data-lab-cell="content=inline markup text=body"]');
    const table = cell.getByRole('table');
    await expect(table.getByRole('columnheader')).toHaveText(['Fruit', 'Colour', 'Season']);
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table.getByRole('grid')).toHaveCount(0);
    await expect(table).not.toHaveAttribute('tabindex');
    await table.getByRole('link', { name: 'Pear' }).focus();
    await expect(table.getByRole('link', { name: 'Pear' })).toBeFocused();
    await lab.expectAccessible();
  });
});
