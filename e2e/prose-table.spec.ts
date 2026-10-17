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

  test('UIC-PROSE-TABLE-2.1 UIC-PROSE-TABLE-2.2 UIC-PROSE-TABLE-2.3 UIC-PROSE-TABLE-2.4 draws a caption, row headers, aligned columns and a footer', async ({
    page,
    lab,
  }) => {
    await lab.open('prose-table');
    const cell = page.locator('[data-lab-cell="caption=with caption footer=with footer"]');
    const table = cell.getByRole('table', { name: 'Crates picked this week' });
    await expect(table.getByRole('rowheader')).toHaveText(['Apple', 'Pear', 'Plum', 'Total']);
    await expect(table.locator('tfoot tr')).toHaveCount(1);
    await expect(table.locator('tbody td[data-align="end"]').first()).toHaveCSS(
      'text-align',
      'end',
    );
    await expect(table.locator('thead th[data-align="center"]')).toHaveCSS('text-align', 'center');
    await expect(
      page.locator('[data-lab-cell="caption=without footer=without"] :is(caption, tfoot)'),
    ).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-PROSE-TABLE-2.5 keeps a sticky header in view inside a scroll region', async ({
    page,
    lab,
  }) => {
    await lab.open('prose-table');
    for (const mode of ['sticky', 'static'] as const) {
      const region = page.locator(`[data-lab-cell="header=${mode}"] .ui-scroll-region__viewport`);
      const heading = region.locator('thead th').first();
      const top = (await region.boundingBox())?.y ?? 0;
      await region.evaluate((node) => {
        node.scrollTop = 120;
      });
      const headingTop = (await heading.boundingBox())?.y ?? 0;
      if (mode === 'sticky') expect(Math.round(headingTop)).toBe(Math.round(top));
      else expect(headingTop).toBeLessThan(top - 100);
    }
  });
});
