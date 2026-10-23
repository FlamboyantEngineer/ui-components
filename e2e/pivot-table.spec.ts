import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

function rowHeaders(scope: Locator): Locator {
  return scope.locator('tbody .ui-pivot-table__key');
}

test.describe('Pivot Table lab', () => {
  test('UIC-PIVOT-TABLE-3.2 UIC-PIVOT-TABLE-3.3 moves repeated fields independently', async ({
    page,
    lab,
  }) => {
    await lab.open('pivot-table');
    const repeated = field(page, 'repeated');
    const chooser = repeated.getByRole('group', { name: 'Pivot fields' });
    const zone = (name: string) => chooser.getByRole('grid', { name });
    await expect(zone('Fields').locator('.ui-board__card')).toHaveText(['Other', 'Third']);
    await zone('Values').getByRole('row', { name: 'Sum of Amount' }).focus();
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(output(page, 'repeated-layout')).toHaveText('rows a; columns a; values -');
    await expect(zone('Rows').getByRole('row', { name: 'Amount' })).toHaveCount(1);
    await expect(zone('Columns').getByRole('row', { name: 'Amount' })).toHaveCount(1);
    await expect(zone('Fields').locator('.ui-board__card')).toHaveText(['Other', 'Third']);
  });

  test('UIC-PIVOT-TABLE-1.2 summarizes a large dataset into finite min, max and average cells', async ({
    page,
    lab,
  }) => {
    await lab.open('pivot-table');
    const table = page.getByRole('grid', { name: 'Large dataset', exact: true });
    await expect(table.locator('tbody .ui-pivot-table__value')).toHaveText([
      '0',
      '199,999',
      '99,999.5',
    ]);
  });

  test('UIC-PIVOT-TABLE-2.1 UIC-PIVOT-TABLE-2.2 UIC-PIVOT-TABLE-2.3 UIC-PIVOT-TABLE-2.4 draws every state', async ({
    page,
    lab,
  }) => {
    await lab.open('pivot-table');
    const cell = (layout: string) => page.locator(`[data-lab-cell="layout=${layout}"]`);
    const basic = cell('rows and columns');
    await expect(basic.getByRole('columnheader', { name: 'Sum of Boxes' })).toBeVisible();
    await expect(rowHeaders(basic)).toHaveText(['East', 'North', 'South']);
    await expect(basic.locator('tfoot .ui-pivot-table__key')).toHaveText('Total');
    await expect(
      cell('several values').getByRole('columnheader', { name: 'Average of Price' }),
    ).toHaveCount(3);
    await expect(cell('several values').locator('tbody tr').first()).toContainText('€');
    await expect(cell('nested rows').getByRole('treegrid')).toBeVisible();
    await expect(cell('nested rows').getByRole('columnheader', { name: 'Stores' })).toBeVisible();
    await expect(rowHeaders(cell('no row fields'))).toHaveText(['Total']);
    await expect(cell('no row fields').getByRole('columnheader', { name: 'Q1' })).toBeVisible();
    await expect(cell('empty').getByText('No results')).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-PIVOT-TABLE-2.5 UIC-PIVOT-TABLE-2.6 expands groups and sorts by a column', async ({
    page,
    lab,
  }) => {
    await lab.open('pivot-table');
    const quarters = field(page, 'quarters');
    await expect(rowHeaders(quarters)).toHaveText(['2025', '2026']);
    await quarters.getByRole('button', { name: 'Expand 2026' }).click();
    await expect(rowHeaders(quarters)).toHaveText(['2025', '2026', 'Q1', 'Q2', 'Q3', 'Q4']);
    await expect(output(page, 'expanded')).toHaveText('[2026]');
    const total = quarters.getByRole('columnheader', { name: 'Total' });
    await total.click();
    await total.click();
    await expect(total).toHaveAttribute('aria-sort', 'descending');
    const totals = quarters.locator('tbody tr[aria-level="2"] .ui-pivot-table__value[data-total]');
    await expect(totals).toHaveCount(4);
    const numbers = (await totals.allTextContents()).map((text) => Number(text.replace(/,/g, '')));
    expect(numbers).toEqual([...numbers].sort((left, right) => right - left));
    await lab.expectAccessible('[data-lab-field="quarters"]');
  });

  test('UIC-PIVOT-TABLE-3.2 UIC-PIVOT-TABLE-3.3 UIC-PIVOT-TABLE-3.4 moves fields and picks aggregations', async ({
    page,
    lab,
  }) => {
    await lab.open('pivot-table');
    const sales = field(page, 'sales');
    const chooser = sales.getByRole('group', { name: 'Pivot fields' });
    const zone = (name: string) => chooser.getByRole('grid', { name });
    await expect(zone('Rows').locator('.ui-board__card')).toHaveText(['Region', 'Fruit']);
    await expect(sales.getByRole('row', { name: /Apple$/ }).first()).toBeVisible();
    await zone('Fields').getByRole('row', { name: 'Quarter' }).focus();
    await page.keyboard.press('Alt+ArrowRight');
    await page.keyboard.press('Alt+ArrowRight');
    await expect(output(page, 'layout')).toHaveText(
      'rows region, fruit; columns year, quarter; values sum boxes',
    );
    await expect(sales.getByRole('columnheader', { name: '2025 / Q1' })).toBeVisible();
    await sales.getByRole('button', { name: /Aggregation of Boxes/ }).click();
    await page.getByRole('option', { name: 'Average' }).click();
    await expect(output(page, 'layout')).toHaveText(
      'rows region, fruit; columns year, quarter; values average boxes',
    );
    await expect(sales.getByRole('columnheader', { name: 'Average of Boxes' })).toBeVisible();
    await zone('Columns').getByRole('row', { name: 'Year' }).focus();
    await page.keyboard.press('Alt+ArrowLeft');
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(output(page, 'layout')).toHaveText(
      'rows region, fruit; columns quarter; values average boxes',
    );
    await expect(zone('Fields').locator('.ui-board__card')).toContainText(['Year']);
    await lab.expectAccessible('[data-lab-field="sales"]');
  });
});
