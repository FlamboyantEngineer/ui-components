import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const section = (page: Page, name: string) => page.locator(`[data-lab="${name}"]`);
const names = (grid: Locator) => grid.getByRole('rowheader');
const output = (scope: Locator, name: string) => scope.locator(`[data-lab-output="${name}"]`);
const headers = (grid: Locator) => grid.locator('.ui-table__column-label');

test.describe('Table lab, host-owned state', () => {
  test('UIC-TABLE-2.3 UIC-TABLE-2.6 follows a sort by several columns owned by the host', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'controlled-sort');
    const grid = root.getByRole('grid');
    await expect(output(root, 'controlled-sort')).toHaveText('colour ascending');
    await expect(names(grid)).toHaveText(['Pear', 'Leek', 'Lime', 'Plum', 'Beet']);
    await root.getByRole('button', { name: 'Kind, then name descending' }).click();
    await expect(output(root, 'controlled-sort')).toHaveText('kind ascending, name descending');
    await expect(names(grid)).toHaveText(['Plum', 'Pear', 'Lime', 'Leek', 'Beet']);
    await expect(grid.getByRole('columnheader', { name: /^Name/ })).toHaveAttribute(
      'data-sort-priority',
      '2',
    );
    await grid.getByRole('columnheader', { name: /^Weight/ }).click();
    await expect(output(root, 'controlled-sort')).toHaveText('weight ascending');
    await expect(names(grid)).toHaveText(['Plum', 'Lime', 'Beet', 'Pear', 'Leek']);
    await root.getByRole('button', { name: 'Clear the sort' }).click();
    await expect(output(root, 'controlled-sort')).toHaveText('Unsorted');
    await expect(names(grid)).toHaveText(['Pear', 'Leek', 'Plum', 'Beet', 'Lime']);
  });

  test('UIC-TABLE-8.2 follows a column layout owned by the host', async ({ page, lab }) => {
    await lab.open('table');
    const root = section(page, 'controlled-layout');
    const grid = root.getByRole('grid');
    await expect(headers(grid)).toHaveText(['Name', 'Kind', 'Colour', 'Weight (g)']);
    await root.getByRole('button', { name: 'Weight before Colour and Kind' }).click();
    await expect(headers(grid)).toHaveText(['Name', 'Weight (g)', 'Colour', 'Kind']);
    await root.getByRole('button', { name: 'Hide Colour' }).click();
    await expect(headers(grid)).toHaveText(['Name', 'Weight (g)', 'Kind']);
    await expect(output(root, 'controlled-layout')).toHaveText(
      'order name, weight, colour, kind; hidden colour',
    );
    await grid.getByRole('columnheader', { name: /^Kind/ }).focus();
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(headers(grid)).toHaveText(['Name', 'Kind', 'Weight (g)']);
    await expect(output(root, 'controlled-layout')).toContainText('order name, kind, weight');
    await root.getByRole('button', { name: 'Reset the layout' }).click();
    await expect(headers(grid)).toHaveText(['Name', 'Kind', 'Colour', 'Weight (g)']);
    await expect(output(root, 'controlled-layout')).toHaveText('order declared; hidden none');
  });

  test('UIC-TABLE-2.5 UIC-TABLE-2.8 UIC-TABLE-8.2 starts arranged and filtered, then owns both', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'seeded');
    const grid = root.getByRole('grid');
    await expect(headers(grid)).toHaveText(['Colour', 'Name', 'Kind']);
    await expect(root.getByRole('searchbox')).toHaveValue('p');
    await expect(grid.getByRole('columnheader', { name: /^Kind/ })).toHaveAttribute(
      'data-filtered',
      'true',
    );
    await expect(grid.getByRole('row').filter({ has: page.getByRole('rowheader') })).toHaveCount(2);
    await root.getByRole('searchbox').fill('');
    await expect(output(root, 'seeded-filter')).toHaveText(
      '{"query":"","columns":{"kind":["Fruit"]}}',
    );
    await expect(grid.getByRole('row').filter({ has: page.getByRole('rowheader') })).toHaveCount(3);
  });

  test('UIC-TABLE-3.1 selects single, required, toggled and replaced rows', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'selection-modes');
    const row = (name: string) => root.getByRole('row', { name: new RegExp(`^${name}`) });
    const selected = output(root, 'selected');
    await expect(selected).toHaveText('pear');
    await row('Leek').click();
    await expect(selected).toHaveText('leek');
    await row('Leek').click();
    await expect(selected).toHaveText('none');

    await root.getByRole('radio', { name: 'Single, required' }).click();
    await expect(selected).toHaveText('pear');
    await row('Pear').click();
    await expect(selected).toHaveText('pear');
    await row('Lime').click();
    await expect(selected).toHaveText('lime');

    await root.getByRole('radio', { name: 'Multiple, toggle' }).click();
    await row('Leek').click();
    await expect(selected).toHaveText('pear, leek');

    await root.getByRole('radio', { name: 'Multiple, replace' }).click();
    await row('Leek').click();
    await expect(selected).toHaveText('leek');
    await row('Plum').click({ modifiers: ['ControlOrMeta'] });
    await expect(selected).toHaveText('leek, plum');
    await lab.expectAccessible('[data-lab="selection-modes"]');
  });

  test('UIC-TABLE-9.1 draws the expand buttons in the tree column given', async ({ page, lab }) => {
    await lab.open('table');
    const root = section(page, 'tree-column');
    const grid = root.getByRole('treegrid');
    const sow = grid.getByRole('row', { name: /Sow/ }).first();
    const collapse = sow.getByRole('button', { name: 'Collapse Sow' });
    await expect(collapse).toBeVisible();
    expect(
      await collapse.evaluate((el) => el.closest<HTMLTableCellElement>('td, th')?.cellIndex),
    ).toBe(1);
    await grid.getByRole('button', { name: 'Expand Harvest' }).click();
    await expect(grid.getByRole('rowheader', { name: 'Pick the ripe ones' })).toBeVisible();
  });
});
