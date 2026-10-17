import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const section = (page: Page, name: string) => page.locator(`[data-lab="${name}"]`);
const names = (table: Locator) =>
  table.getByRole('rowheader').evaluateAll((cells) => cells.map((cell) => cell.textContent));
const width = async (locator: Locator) => Math.round((await locator.boundingBox())?.width ?? 0);

test.describe('Table lab', () => {
  test('UIC-TABLE-1.1 UIC-TABLE-1.3 UIC-TABLE-7.1 draws grids at two row sizes', async ({
    page,
    lab,
  }) => {
    // A whole-lab axe scan of this large lab can outlast the default budget on a loaded machine.
    test.slow();
    await lab.open('table');
    const medium = page.getByRole('grid', { name: 'Fruit, rows, md' });
    const small = page.getByRole('grid', { name: 'Fruit, rows, sm' });
    await expect(medium.getByRole('columnheader')).toHaveCount(4);
    await expect(medium.getByRole('row')).toHaveCount(4);
    const height = async (grid: Locator) =>
      (await grid.getByRole('row', { name: 'Apple' }).boundingBox())?.height;
    expect(await height(medium)).toBe(40);
    expect(await height(small)).toBe(32);
    await lab.expectAccessible();
  });

  test('UIC-TABLE-2.1 UIC-TABLE-2.5 sorts by pointer and keyboard and filters rows', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const owned = page.getByRole('grid', { name: 'Fruit, sorted by the table' });
    const weight = owned.getByRole('columnheader', { name: /^Weight/ });
    await weight.click();
    await expect(weight).toHaveAttribute('aria-sort', 'ascending');
    expect((await names(owned)).slice(0, 2)).toEqual(['Grape', 'Cherry']);
    await page.keyboard.press('Enter');
    await expect(weight).toHaveAttribute('aria-sort', 'descending');
    expect((await names(owned))[0]).toBe('Apple');
    await page.keyboard.press('Enter');
    await expect(weight).toHaveAttribute('aria-sort', 'none');

    const search = section(page, 'sort').getByRole('searchbox', { name: 'Filter fruit' });
    await search.fill('yellow');
    await expect.poll(() => names(owned)).toEqual(['Banana', 'Lemon']);
    await search.press('Escape');
    await expect(owned.getByRole('rowheader')).toHaveCount(8);

    const caller = page.getByRole('grid', { name: 'Fruit, sorted by the caller' });
    await caller.getByRole('columnheader', { name: /^Name/ }).click();
    await page.keyboard.press('Enter');
    await expect(section(page, 'sort').locator('[data-lab-output]')).toHaveText('name descending');
    expect((await names(caller))[0]).toBe('Lemon');
  });

  test('UIC-TABLE-3.1 selects rows with checkboxes and the keyboard', async ({ page, lab }) => {
    await lab.open('table');
    const grid = page.getByRole('grid', { name: 'Fruit, selectable' });
    const output = section(page, 'selection').locator('[data-lab-output]');
    await grid.getByRole('row', { name: 'Apple' }).locator('.ui-table__checkbox').click();
    await expect(output).toHaveText('2 selected · Action: None');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(output).toHaveText('3 selected · Action: None');
    await grid.getByRole('button', { name: 'Edit Fig' }).click();
    await expect(output).toHaveText('3 selected · Action: Edit Fig');
    await grid.locator('th .ui-table__checkbox').click();
    await expect(output).toHaveText('8 selected · Action: Edit Fig');
    await expect(grid.getByRole('row', { name: 'Date' })).toHaveAttribute('aria-selected', 'false');
  });

  test('UIC-TABLE-4.1 UIC-TABLE-4.2 UIC-TABLE-4.3 resizes within bounds and keeps widths', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'resize');
    const header = root.getByRole('columnheader', { name: /^Name/ });
    expect(await width(header)).toBe(160);
    const resizer = header.locator('.ui-table__resizer');
    await resizer.scrollIntoViewIfNeeded();
    const box = await resizer.boundingBox();
    if (!box) throw new Error('no resizer');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + box.height / 2, { steps: 4 });
    expect(await width(header)).toBeGreaterThan(180);
    await expect(root.locator('[data-lab-output]')).toHaveText('Not resized');
    await page.mouse.move(box.x + 300, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    expect(await width(header)).toBe(240);
    await expect(root.locator('[data-lab-output]')).toContainText('"name":240');

    await header.focus();
    await page.keyboard.press('ArrowRight');
    await expect(root.getByRole('slider', { name: /^Resize Name/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    expect(await width(header)).toBe(220);

    await root.getByRole('button', { name: 'Unmount' }).click();
    await root.getByRole('button', { name: 'Mount' }).click();
    expect(await width(root.getByRole('columnheader', { name: /^Name/ }))).toBe(220);
  });

  test('UIC-TABLE-5.1 UIC-TABLE-5.3 reorders by pointer, keyboard drag and Alt+Arrow', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'reorder');
    const grid = root.getByRole('grid');
    const output = root.locator('[data-lab-output]');
    await grid
      .getByRole('row', { name: 'Apple' })
      .dragTo(grid.getByRole('row', { name: 'Cherry' }), { targetPosition: { x: 200, y: 30 } });
    await expect(output).toHaveText('Last move: apple after cherry');
    expect(await names(grid)).toEqual(['Banana', 'Cherry', 'Apple', 'Date', 'Fig']);

    await grid.getByRole('row', { name: 'Fig' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(grid.getByRole('button', { name: 'Drag Fig' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(root.locator('.ui-table__drop-indicator[data-drop-target]')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(output).toHaveText('Last move: fig before date');

    const banana = grid.getByRole('row', { name: 'Banana' });
    await banana.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(output).toHaveText('Last move: banana after cherry');
    await expect(banana).toBeFocused();
    expect(await names(grid)).toEqual(['Cherry', 'Banana', 'Apple', 'Fig', 'Date']);
    await expect(grid.getByRole('button', { name: 'Drag Date' })).toBeDisabled();
  });

  test('UIC-TABLE-6.1 UIC-TABLE-6.4 reaches and runs retry from the keyboard alone', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'notices');
    const grid = root.getByRole('grid');
    const cell = grid.locator('.ui-table__state-cell');
    expect(await width(cell)).toBe(await width(grid.locator('thead tr')));
    await root.getByRole('button', { name: 'Show rows' }).focus();
    await page.keyboard.press('Tab');
    await expect(grid.locator('.ui-table__state-row')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(grid.getByRole('button', { name: 'Retry' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(root.locator('[data-lab-output]')).toHaveText('Retries: 2 · Activated: none');
    await root.getByRole('button', { name: 'Load' }).click();
    await expect(grid.getByRole('status')).toHaveText('Loading fruit');
    await expect(root.locator('.ui-table')).toHaveAttribute('aria-busy', 'true');
  });

  test('UIC-TABLE-7.2 keeps a sticky header in view while its area scrolls', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'sticky');
    const scroll = root.locator('.ui-table__scroll');
    const header = root.getByRole('columnheader', { name: /^Name/ });
    const before = (await header.boundingBox())?.y;
    await scroll.evaluate((node) => node.scrollTo({ top: 200 }));
    await expect.poll(async () => (await header.boundingBox())?.y).toBe(before);
    await expect(root.getByRole('row', { name: 'Apple' }).first()).not.toBeInViewport({ ratio: 1 });
  });

  test('UIC-TABLE-7.3 renders a window of 10,000 rows and scrolls to the last one', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'virtualized');
    const grid = root.getByRole('grid', { name: 'Items, virtualized' });
    await expect(grid).toHaveAttribute('aria-rowcount', '10001');
    const rendered = await grid.getByRole('row').count();
    expect(rendered).toBeGreaterThan(5);
    expect(rendered).toBeLessThan(60);
    await root
      .locator('.ui-table__scroll')
      .evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await root.scrollIntoViewIfNeeded();
    await expect(grid.getByRole('rowheader', { name: 'Item 10000' })).toBeInViewport();
    await expect(grid.getByRole('rowheader', { name: 'Item 1', exact: true })).toHaveCount(0);
    expect(await grid.getByRole('row').count()).toBeLessThan(60);
  });

  test('UIC-TABLE-1.1 passes axe in the dark theme', async ({ lab }) => {
    test.slow();
    await lab.open('table', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-TABLE-2.6 adds a column to the sort with Shift and shows its priority', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'multiple-sort');
    const grid = root.getByRole('grid');
    const output = root.locator('[data-lab-output]');
    await grid.getByRole('columnheader', { name: /^Weight/ }).click({ modifiers: ['Shift'] });
    await expect(output).toHaveText('kind ascending, weight ascending');
    expect(await names(grid)).toEqual([
      'Date',
      'Fig',
      'Kiwi',
      'Banana',
      'Apple',
      'Garlic',
      'Carrot',
      'Eggplant',
    ]);
    await expect(grid.getByRole('columnheader', { name: /^Weight/ })).toHaveAttribute(
      'data-sort-priority',
      '2',
    );
    await grid.getByRole('columnheader', { name: /^Kind/ }).focus();
    await page.keyboard.press('Shift+Enter');
    await expect(output).toHaveText('kind descending, weight ascending');
    await grid.getByRole('columnheader', { name: /^Name/ }).click();
    await expect(output).toHaveText('name ascending');
  });

  test('UIC-TABLE-2.8 filters a column from its header by keyboard', async ({ page, lab }) => {
    await lab.open('table');
    const root = section(page, 'column-filters');
    const grid = root.getByRole('grid');
    const colour = grid.getByRole('columnheader', { name: /^Colour/ });
    await colour.focus();
    await page.keyboard.press('ArrowRight');
    const button = grid.getByRole('button', { name: 'Filter colour' });
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Filter colour' });
    await expect(dialog).toBeVisible();
    await dialog.getByText('Purple', { exact: true }).click();
    await expect.poll(() => names(grid)).toEqual(['Eggplant', 'Fig']);
    await expect(colour).toHaveAttribute('data-filtered', 'true');
    await lab.expectAccessible('[role="dialog"]');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    // React Aria returns focus to the grid's focused item: the header that owns the button.
    await expect(colour).toBeFocused();
    await root.getByRole('searchbox', { name: 'Search produce' }).fill('fig');
    await expect.poll(() => names(grid)).toEqual(['Fig']);
    await expect(root.locator('[data-lab-output]')).toHaveText(
      '{"columns":{"colour":["Purple"]},"query":"fig"}',
    );

    const weight = grid.getByRole('button', { name: 'Filter weight (g)' });
    await root.getByRole('searchbox', { name: 'Search produce' }).fill('');
    await weight.click();
    const range = page.getByRole('dialog', { name: 'Filter weight (g)' });
    await range.getByRole('textbox', { name: 'From' }).fill('100');
    await range.getByRole('textbox', { name: 'From' }).press('Tab');
    await expect.poll(() => names(grid)).toEqual(['Eggplant']);
    await range.getByRole('button', { name: 'Clear filter' }).click();
    await expect.poll(() => names(grid)).toEqual(['Eggplant', 'Fig']);
  });

  test('UIC-TABLE-2.7 shows a caller-owned filter on rows the caller filters', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'caller-filter');
    const grid = root.getByRole('grid');
    expect(await names(grid)).toEqual(['Eggplant', 'Fig']);
    await expect(grid.getByRole('columnheader', { name: /^Colour/ })).toHaveAttribute(
      'data-filtered',
      'true',
    );
    await root.getByRole('searchbox').fill('f');
    await expect.poll(() => names(grid)).toEqual(['Fig']);
  });

  test('UIC-TABLE-8.1 UIC-TABLE-8.3 hides columns from the menu and keeps the layout', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'layout');
    const grid = root.getByRole('grid');
    await root.getByRole('button', { name: 'Columns' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Origin' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(grid.getByRole('columnheader', { name: /^Origin/ })).toHaveCount(0);
    await expect(root.locator('[data-lab-output]')).toHaveText('{"hidden":["origin"]}');
    await root.getByRole('button', { name: 'Unmount' }).click();
    await root.getByRole('button', { name: 'Mount' }).click();
    await expect(root.getByRole('columnheader', { name: /^Kind/ })).toBeVisible();
    await expect(root.getByRole('columnheader', { name: /^Origin/ })).toHaveCount(0);
    await root.getByRole('button', { name: 'Columns' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Origin' }).click();
    await page.keyboard.press('Escape');
    await expect(root.getByRole('columnheader', { name: /^Origin/ })).toBeVisible();
  });

  test('UIC-TABLE-8.4 UIC-TABLE-8.5 moves columns by dragging and with Alt+Arrow keys', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'layout');
    const headers = () =>
      root
        .getByRole('columnheader')
        .evaluateAll((cells) =>
          cells.filter((cell) => cell.hasAttribute('data-key')).map((cell) => cell.textContent),
        );
    await root
      .locator('.ui-table__column[data-column="colour"] .ui-table__column-label')
      .dragTo(root.getByRole('columnheader', { name: /^Kind/ }), {
        targetPosition: { x: 4, y: 10 },
      });
    await expect
      .poll(headers)
      .toEqual(['', 'Name', 'Colour', 'Kind', 'Origin', 'Weight (g)', 'Price']);
    const kind = root.getByRole('columnheader', { name: /^Kind/ });
    await kind.focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect
      .poll(headers)
      .toEqual(['', 'Name', 'Colour', 'Origin', 'Kind', 'Weight (g)', 'Price']);
    await expect(kind).toBeFocused();
    await page.keyboard.press('Alt+ArrowRight');
    await page.keyboard.press('Alt+ArrowRight');
    await expect
      .poll(headers)
      .toEqual(['', 'Name', 'Colour', 'Origin', 'Weight (g)', 'Kind', 'Price']);
    await expect(root.locator('[data-lab-output]')).toContainText('"order":');
  });

  test('UIC-TABLE-8.6 UIC-TABLE-8.7 keeps pinned columns in view under group headers', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'layout');
    const scroll = root.locator('.ui-table__scroll');
    const name = root.getByRole('rowheader', { name: 'Apple' });
    const price = root.getByRole('gridcell', { name: '1.2' });
    const before = { name: await name.boundingBox(), price: await price.boundingBox() };
    await scroll.evaluate((node) => node.scrollTo({ left: 200 }));
    await expect.poll(async () => (await name.boundingBox())?.x).toBe(before.name?.x);
    expect((await price.boundingBox())?.x).toBe(before.price?.x);
    await expect(root.getByRole('gridcell', { name: 'Fruit' }).first()).not.toBeInViewport();
    const look = root.getByRole('columnheader', { name: 'Look' });
    await expect(look).toHaveAttribute('colspan', '2');
    const kind = await root.getByRole('columnheader', { name: /^Kind/ }).boundingBox();
    const colour = await root.getByRole('columnheader', { name: /^Colour/ }).boundingBox();
    expect(Math.round((await look.boundingBox())?.width ?? 0)).toBe(
      Math.round((kind?.width ?? 0) + (colour?.width ?? 0)),
    );
  });

  test('UIC-TABLE-9.1 UIC-TABLE-9.2 expands nested and detail rows', async ({ page, lab }) => {
    await lab.open('table');
    const nested = section(page, 'nested').getByRole('treegrid');
    const porto = nested.getByRole('row', { name: /Porto$/ });
    await porto.focus();
    await page.keyboard.press('ArrowRight');
    await expect(nested.getByRole('row', { name: /Ribeira$/ })).toHaveAttribute('aria-level', '3');
    await page.keyboard.press('ArrowLeft');
    await expect(nested.getByRole('row', { name: /Ribeira$/ })).toHaveCount(0);
    await section(page, 'nested').getByRole('searchbox').fill('oslo');
    await expect.poll(() => nested.getByRole('rowheader').allTextContents()).toEqual(['Norway']);

    const detail = section(page, 'detail');
    await detail.getByRole('button', { name: 'Expand Banana' }).click();
    const panel = detail.locator('.ui-table__detail-row');
    await expect(panel).toContainText('Banana comes from Quito');
    await panel.getByRole('button', { name: 'Open Banana' }).click();
    await expect(detail.locator('[data-lab-output]')).toHaveText('Opened: Banana');
    await lab.expectAccessible('[data-lab="detail"]');
    await lab.expectAccessible('[data-lab="nested"]');
  });

  test('UIC-TABLE-10.1 pages rows under a page navigation', async ({ page, lab }) => {
    await lab.open('table');
    const root = section(page, 'pages');
    const grid = root.getByRole('grid', { name: 'Produce, paged', exact: true });
    const pages = root.getByRole('navigation', { name: 'Produce, paged pagination' });
    await pages.getByRole('button', { name: 'Next page' }).click();
    expect(await names(grid)).toEqual(['Date', 'Eggplant', 'Fig']);
    await root.getByRole('searchbox', { name: 'Filter paged produce' }).fill('a');
    await expect(pages.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const caller = root.getByRole('navigation', {
      name: 'Produce, paged by the caller pagination',
    });
    await caller.getByRole('button', { name: 'Page 3' }).click();
    expect(await names(root.getByRole('grid', { name: 'Produce, paged by the caller' }))).toEqual([
      'Garlic',
      'Kiwi',
    ]);
  });

  test('UIC-TABLE-11.1 UIC-TABLE-11.2 edits a cell from the keyboard', async ({ page, lab }) => {
    await lab.open('table');
    const root = section(page, 'editing');
    const output = root.locator('[data-lab-output]');
    const weight = root.getByRole('gridcell', { name: '180' });
    await weight.focus();
    await page.keyboard.press('Enter');
    const input = root.getByRole('textbox', { name: 'Weight (g)' });
    await expect(input).toBeFocused();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('200');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    await expect(output).toHaveText('Last edit: Apple weight: 200');
    await expect(root.getByRole('gridcell', { name: '200' })).toBeFocused();
    await page.keyboard.press('F2');
    await page.keyboard.type('5');
    await page.keyboard.press('Escape');
    await expect(root.getByRole('gridcell', { name: '200' })).toBeFocused();
    await root.getByRole('gridcell', { name: 'Fruit' }).first().dblclick();
    await root.getByRole('combobox', { name: 'Kind' }).selectOption('Vegetable');
    await expect(output).toHaveText('Last edit: Apple kind: Vegetable');
  });

  test('UIC-TABLE-12.1 UIC-TABLE-12.2 sums the rows and loads more at the end', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const summary = section(page, 'summary');
    await summary.getByRole('searchbox').fill('fruit');
    await expect(summary.locator('.ui-table__footer-cell')).toHaveText([
      '',
      '5 items',
      '',
      '€5.20',
    ]);
    const root = section(page, 'load-more');
    const output = root.locator('[data-lab-output]');
    await expect(output).toHaveText('20 of 60 loaded');
    await root
      .locator('.ui-table__scroll')
      .evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await expect(output).toHaveText('40 of 60 loaded');
    await root
      .locator('.ui-table__scroll')
      .evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await expect(output).toHaveText('60 of 60 loaded');
    await expect(root.locator('.ui-table__loader')).toHaveCount(0);
  });

  test('UIC-TABLE-5.5 drags a row by its handle only', async ({ page, lab }) => {
    await lab.open('table');
    const root = section(page, 'handle-reorder');
    const grid = root.getByRole('grid');
    const output = root.locator('[data-lab-output]');
    await expect(grid.getByRole('row', { name: 'Apple' })).not.toHaveAttribute('draggable');
    await grid
      .getByRole('gridcell', { name: 'Red' })
      .first()
      .dragTo(grid.getByRole('row', { name: 'Cherry' }), { targetPosition: { x: 200, y: 30 } });
    await expect(output).toHaveText('Last move: None');
    const handle = grid.getByRole('button', { name: 'Drag Apple' });
    await grid.scrollIntoViewIfNeeded();
    const box = await handle.boundingBox();
    if (!box) throw new Error('no handle');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const target = await grid.getByRole('row', { name: 'Cherry' }).boundingBox();
    if (!target) throw new Error('no target');
    await page.mouse.move(target.x + 200, target.y + target.height - 4, { steps: 8 });
    await page.mouse.up();
    await expect(output).toHaveText('Last move: apple after cherry');
  });

  test('UIC-DRAG-HANDLE-2.2 drags a row from the cell that holds its handle', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'reorder');
    const grid = root.getByRole('grid');
    await grid.scrollIntoViewIfNeeded();
    const handle = await grid.getByRole('button', { name: 'Drag Banana' }).boundingBox();
    const target = await grid.getByRole('row', { name: 'Date' }).boundingBox();
    if (!handle || !target) throw new Error('no handle');
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + 200, target.y + target.height - 4, { steps: 8 });
    await page.mouse.up();
    await expect(root.locator('[data-lab-output]')).toHaveText('Last move: banana after date');
  });
});
