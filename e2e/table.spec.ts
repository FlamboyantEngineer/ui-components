import { toCollectionKey } from '../src/utils/to-collection-key.js';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const section = (page: Page, name: string) => page.locator(`[data-lab="${name}"]`);
const names = (table: Locator) =>
  table.getByRole('rowheader').evaluateAll((cells) => cells.map((cell) => cell.textContent));
const width = async (locator: Locator) => Math.round((await locator.boundingBox())?.width ?? 0);

test.describe('Table lab', () => {
  test('UIC-TABLE-9.1 UIC-TABLE-13.4 keeps row expansion when a similarly named group collapses', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = page.locator('[data-lab-demo="group-keys"]');
    await demo.getByRole('button', { name: 'Expand Parent row' }).click();
    await expect(demo.getByRole('row', { name: 'Child row' })).toBeVisible();
    await demo.getByRole('button', { name: /^Collapse Kind: Fruit/ }).click();
    await expect(demo.getByRole('row', { name: 'Parent row' })).toHaveCount(0);
    await demo.getByRole('button', { name: /^Expand Kind: Fruit/ }).click();
    await expect(demo.getByRole('row', { name: 'Child row' })).toBeVisible();
  });

  test('UIC-TABLE-1.1 UIC-TABLE-3.1 UIC-TABLE-9.1 UIC-TABLE-11.1 UIC-TABLE-14.8 keeps similar row keys independent', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = page.locator('[data-lab-demo="typed-table"]');
    const numeric = demo.getByRole('row', { name: 'Expand Numeric key', exact: true });
    const text = demo.getByRole('row', { name: 'Expand Text key', exact: true });
    await expect(demo.getByRole('row', { name: 'Expand Spaced key', exact: true })).toBeVisible();
    await expect(demo.getByRole('row', { name: 'Expand Joined key', exact: true })).toBeVisible();
    await text.locator('.ui-table__checkbox').click();
    await expect(demo.locator('[data-lab-output="typed-selection"]')).toHaveText('Selected: ["1"]');
    const value = text.getByRole('gridcell', { name: '20', exact: true });
    await value.focus();
    await page.keyboard.press('F2');
    await text.getByRole('textbox', { name: 'Value' }).fill('25');
    await page.keyboard.press('Enter');
    await expect(text.getByRole('gridcell', { name: '25', exact: true })).toBeVisible();
    await expect(numeric.getByRole('gridcell', { name: '10', exact: true })).toBeVisible();
    await text.getByRole('button', { name: 'Expand Text key' }).click();
    await expect(demo.getByText('Details for Text key', { exact: true })).toBeVisible();
    await expect(demo.getByText('Details for Numeric key', { exact: true })).toHaveCount(0);
    await lab.expectAccessible('[data-lab-demo="typed-table"]');
  });

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

  test('UIC-TABLE-2.10 sorts text in the provider language and follows a change', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = section(page, 'locale-sort');
    const grid = demo.getByRole('grid', { name: 'Places, sorted in the chosen language' });
    await expect
      .poll(() => names(grid))
      .toEqual(['Aarhus', 'Malmö', 'Oslo', 'Zürich', 'Åre', 'Örebro']);
    await demo.getByRole('radio', { name: 'German' }).click();
    await expect
      .poll(() => names(grid))
      .toEqual(['Aarhus', 'Åre', 'Malmö', 'Örebro', 'Oslo', 'Zürich']);
  });

  test('UIC-TABLE-1.5 marks rows with caller attributes that the stylesheet draws', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = section(page, 'row-marks');
    const grid = demo.getByRole('grid', { name: 'Fruit, with row marks' });
    const banana = grid.getByRole('row', { name: /^Banana/ });
    await expect(banana).toHaveAttribute('data-status', 'empty');
    await expect(banana).toHaveCSS('text-decoration-line', 'line-through');
    await expect(grid.getByRole('row', { name: /^Date/ })).toHaveAttribute('data-status', 'low');
    await expect(grid.getByRole('row', { name: /^Apple/ })).not.toHaveAttribute('data-status');
    await demo.getByRole('button', { name: 'Add fig' }).click();
    const fig = grid.getByRole('row', { name: /^Fig/ });
    await expect(fig).toHaveAttribute('data-change', 'added');
    await expect(fig.getByRole('rowheader')).not.toHaveCSS('box-shadow', 'none');
    await lab.expectAccessible('[data-lab="row-marks"]');
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

  test('UIC-TABLE-1.6 wraps prose, breaks identifiers and keeps nowrap cells on one line', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'cell-wrap');
    const row = root.getByRole('row', { name: /^First sample/ });
    const name = row.getByRole('rowheader');
    const note = row.getByRole('gridcell', { name: /^Collected/ });
    const reference = row.getByRole('gridcell', { name: /^sample-0001/ });
    await expect(name).toHaveAttribute('data-wrap', 'nowrap');
    await expect(note).toHaveAttribute('data-wrap', 'wrap');
    await expect(reference).toHaveAttribute('data-wrap', 'anywhere');
    const overflows = (cell: Locator) =>
      cell.evaluate((element) => element.scrollWidth > element.clientWidth);
    const height = async (cell: Locator) => Math.round((await cell.boundingBox())?.height ?? 0);
    expect(await overflows(name)).toBe(true);
    expect(await overflows(note)).toBe(false);
    expect(await overflows(reference)).toBe(false);
    expect(await height(row)).toBeGreaterThan(40);
    const scroll = root.locator('.ui-table__scroll');
    expect(await overflows(scroll)).toBe(false);

    const header = root.getByRole('columnheader', { name: /^Reference/ });
    const before = await height(row);
    const resizer = header.locator('.ui-table__resizer');
    await resizer.scrollIntoViewIfNeeded();
    const box = await resizer.boundingBox();
    if (!box) throw new Error('no resizer');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 40, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    expect(await width(header)).toBeLessThan(130);
    await expect(reference).toHaveAttribute('data-wrap', 'anywhere');
    expect(await overflows(reference)).toBe(false);
    expect(await height(row)).toBeGreaterThan(before);
    await lab.expectAccessible('[data-lab="cell-wrap"]');
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
    // This full-grid flow combines choice, text and numeric filters with a popup accessibility scan.
    test.slow();
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

  test('UIC-TABLE-3.4 keeps focus on a nested row action by keyboard and pointer', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = section(page, 'nested-actions');
    const output = demo.locator('[data-lab-output]');
    const porto = demo.getByRole('button', { name: 'Add after Porto' });
    await porto.focus();
    await expect(porto).toBeFocused();

    // From the row, ArrowRight walks its cells to the action.
    await demo.getByRole('row', { name: /Lisbon$/ }).focus();
    for (const _cell of ['name', 'people', 'actions']) await page.keyboard.press('ArrowRight');
    const lisbon = demo.getByRole('button', { name: 'Add after Lisbon' });
    await expect(lisbon).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(lisbon).toHaveAttribute('aria-disabled', 'true');
    await expect(lisbon).toBeFocused();
    await expect(output).toHaveText('Added after Lisbon');
    await expect(demo.getByRole('row', { name: /Town 1$/ })).toBeVisible();
    await expect(lisbon).not.toHaveAttribute('aria-disabled');
    await expect(lisbon).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(porto).toBeFocused();

    await demo.getByRole('button', { name: 'Add after Town 1' }).click();
    await expect(demo.getByRole('button', { name: 'Add after Town 1' })).toBeFocused();
    await expect(output).toHaveText('Added after Town 1');
    await expect(demo.getByRole('row', { name: /Town 2$/ })).toBeVisible();
    await expect(demo.getByRole('button', { name: 'Add after Town 1' })).toBeFocused();
    await lab.expectAccessible('[data-lab="nested-actions"]');
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

  test('UIC-TABLE-11.2 leaves Enter and Escape to an input method while it composes', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'editing');
    await root.getByRole('gridcell', { name: '180' }).dblclick();
    const input = root.getByRole('textbox', { name: 'Weight (g)' });
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('210');
    await input.evaluate((element) => {
      const press = (init: KeyboardEventInit) =>
        element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
      element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      press({ key: 'Enter', isComposing: true });
      press({ key: 'Escape', isComposing: true });
      element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      press({ key: 'Enter', keyCode: 229 });
    });
    await expect(input).toBeFocused();
    await expect(root.locator('[data-lab-output]')).toHaveText('Last edit: None');
    await page.keyboard.press('Enter');
    await expect(root.locator('[data-lab-output]')).toHaveText('Last edit: Apple weight: 210');
  });

  test('UIC-TABLE-11.4 opens no editor on a disabled row and closes one when its row is disabled', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'editing');
    const output = root.locator('[data-lab-output]');
    await root.getByRole('button', { name: 'Disable the Apple row in a second' }).click();
    await root.getByRole('gridcell', { name: '180' }).dblclick();
    await page.keyboard.type('9');
    await expect(root.getByRole('button', { name: 'Enable the Apple row' })).toBeVisible();
    await expect(root.getByRole('textbox')).toHaveCount(0);
    await expect(root.getByRole('gridcell', { name: '180' })).toBeFocused();
    // The cell is marked disabled, so Playwright's actionability check must be skipped.
    await root.getByRole('gridcell', { name: '180' }).dblclick({ force: true });
    await expect(root.getByRole('textbox')).toHaveCount(0);
    await expect(output).toHaveText('Last edit: None');
    await root.getByRole('button', { name: 'Enable the Apple row' }).click();
    await root.getByRole('gridcell', { name: '180' }).dblclick();
    await expect(root.getByRole('textbox', { name: 'Weight (g)' })).toBeFocused();
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
    await expect(root.locator('.ui-table__loader [role="status"]')).toHaveText(
      'Loading more items…',
    );
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
  test('UIC-TABLE-13.1 UIC-TABLE-13.2 UIC-TABLE-13.3 UIC-TABLE-13.4 groups rows and collapses groups', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'grouping');
    const grid = page.getByRole('treegrid', { name: 'Stock, grouped' });
    const output = root.locator('[data-lab-output]');
    const labels = () =>
      grid
        .locator('.ui-table__group-label')
        .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    await expect.poll(labels).toEqual(['Kind: Fruit', 'Kind: Herb', 'Kind: Vegetable']);
    const fruit = grid.getByRole('row', { name: /Kind: Fruit 3 items$/ });
    await expect(fruit.locator('.ui-table__aggregate-cell')).toHaveText([
      '',
      '',
      '',
      '308',
      'max €4.50',
    ]);
    await fruit.getByRole('button', { name: /^Collapse/ }).click();
    await expect(output).toHaveText('Collapsed: ui-table-group:kind=Fruit');
    await expect(grid.getByRole('row', { name: 'Apple' })).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(output).toHaveText('Collapsed: none');
    await expect(grid.getByRole('row', { name: 'Apple' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(output).toHaveText('Collapsed: ui-table-group:kind=Fruit');
    await page.keyboard.press('ArrowRight');

    await root.getByRole('button', { name: 'Kind, then origin' }).click();
    await expect(grid.getByRole('row', { name: /Origin: Lisbon 2 items$/ })).toHaveAttribute(
      'aria-level',
      '2',
    );
    await expect(grid.getByRole('row', { name: 'Cherry' })).toHaveAttribute('aria-level', '3');
    await root.getByRole('button', { name: 'Weight class' }).click();
    await expect.poll(labels).toEqual(['Weight class: Heavy', 'Weight class: Light']);
    await grid.getByRole('columnheader', { name: /^Name/ }).click();
    await page.keyboard.press('Enter');
    await expect
      .poll(() =>
        grid
          .locator('.ui-table__row [role="rowheader"]')
          .evaluateAll((nodes) => nodes.map((node) => node.textContent)),
      )
      .toEqual(['Onion', 'Leek', 'Banana', 'Apple', 'Sage', 'Mint', 'Cherry', 'Carrot']);
    await lab.expectAccessible('[data-lab="grouping"]');
  });

  test('UIC-TABLE-13.4 collapses and expands groups in a virtualized table', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'grouping-virtualized');
    const grid = root.getByRole('treegrid', { name: 'Items, grouped by city' });
    await grid
      .getByRole('row', { name: /^Collapse Cairo/ })
      .getByRole('button')
      .click();
    await grid
      .getByRole('row', { name: /^Collapse Lisbon/ })
      .getByRole('button')
      .click();
    const oslo = grid.getByRole('row', { name: /^Expand Oslo/ });
    await expect(oslo).toHaveAttribute('aria-expanded', 'false');
    await oslo.getByRole('button').click();
    await expect(grid.getByRole('row', { name: /^Collapse Oslo/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(grid.getByRole('row', { name: 'Item 2', exact: true })).toBeVisible();
    await root
      .locator('.ui-table__scroll')
      .evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await expect(grid.getByRole('row', { name: 'Item 1998' })).toBeVisible();
    expect(await grid.getByRole('row').count()).toBeLessThan(60);
  });

  test.describe('spreadsheet mode', () => {
    test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

    test('UIC-TABLE-14.1 UIC-TABLE-14.2 UIC-TABLE-14.3 UIC-TABLE-14.4 selects ranges, copies, pastes and clears', async ({
      page,
      lab,
    }) => {
      await lab.open('table');
      const root = section(page, 'spreadsheet');
      const grid = root.getByRole('grid', { name: 'Stock, spreadsheet' });
      const output = root.locator('[data-lab-output]');
      const cell = (row: string, column: string) =>
        grid.locator(`[data-key="${toCollectionKey(row)}"] > [data-column="${column}"]`);
      await cell('apple', 'name').click();
      await expect(output).toHaveText('Range: apple.name:apple.name · Last change: none');
      await cell('banana', 'weight').click({ modifiers: ['Shift'] });
      await expect(output).toContainText('Range: apple.name:banana.weight');
      await expect(grid.locator('[data-in-range]')).toHaveCount(4);
      await page.keyboard.press('Shift+ArrowDown');
      await expect(output).toContainText('Range: apple.name:carrot.weight');
      await page.keyboard.press('ControlOrMeta+c');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        'Apple\t180\nBanana\t120\nCarrot\t70',
      );
      await cell('cherry', 'name').click();
      await page.keyboard.press('ControlOrMeta+v');
      await expect(output).toHaveText(
        'Range: cherry.name:mint.weight · Last change: cherry.name=Apple, cherry.weight=180, leek.name=Banana, leek.weight=120, mint.name=Carrot, mint.weight=70',
      );
      await page.keyboard.press('Delete');
      await expect(output).toContainText('Last change: cherry.name=, leek.name=, mint.name=');

      const start = await cell('apple', 'origin').boundingBox();
      const end = await cell('banana', 'price').boundingBox();
      if (!start || !end) throw new Error('no cells');
      await page.mouse.move(start.x + 10, start.y + 10);
      await page.mouse.down();
      await page.mouse.move(end.x + 10, end.y + 10, { steps: 6 });
      await page.mouse.up();
      await expect(output).toContainText('Range: apple.origin:banana.price');
      await expect(grid.locator('[aria-selected="true"]')).toHaveCount(4);
      await lab.expectAccessible('[data-lab="spreadsheet"]');
    });

    test('UIC-TABLE-14.5 UIC-TABLE-14.6 UIC-TABLE-14.7 fills, types to edit and checks values', async ({
      page,
      lab,
    }) => {
      await lab.open('table');
      const root = section(page, 'spreadsheet');
      const grid = root.getByRole('grid', { name: 'Stock, spreadsheet' });
      const output = root.locator('[data-lab-output]');
      const cell = (row: string, column: string) =>
        grid.locator(`[data-key="${toCollectionKey(row)}"] > [data-column="${column}"]`);
      await cell('apple', 'weight').click();
      await page.keyboard.press('Shift+ArrowDown');
      const handle = await grid.locator('.ui-table__fill-handle').boundingBox();
      const target = await cell('leek', 'weight').boundingBox();
      if (!handle || !target) throw new Error('no handle');
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x + 10, target.y + 10, { steps: 6 });
      await expect(grid.locator('[data-fill-target]')).toHaveCount(3);
      await page.mouse.up();
      await expect(output).toHaveText(
        'Range: apple.weight:leek.weight · Last change: carrot.weight=60, cherry.weight=0',
      );

      await cell('apple', 'origin').click();
      await page.keyboard.press('Shift+ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await page.keyboard.press('ControlOrMeta+d');
      await expect(output).toContainText('Last change: banana.origin=Lisbon, carrot.origin=Lisbon');

      await cell('mint', 'name').click();
      await page.keyboard.type('Sage');
      await page.keyboard.press('Tab');
      await expect(output).toContainText('Last change: mint.name=Sage');
      await expect(cell('mint', 'weight')).toBeFocused();
      await page.keyboard.type('-1');
      await page.keyboard.press('Enter');
      const message = grid.locator('.ui-table__editor-message');
      await expect(message).toHaveText('Enter a weight of 0 or more.');
      await expect(grid.getByRole('textbox', { name: 'Weight (g)' })).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type('45');
      await page.keyboard.press('Shift+Enter');
      await expect(output).toContainText('Last change: mint.weight=45');
      await expect(cell('leek', 'weight')).toBeFocused();
    });
  });

  test('UIC-TABLE-15.1 UIC-TABLE-15.2 edits a column across the selected rows from the selection bar', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'bulk-edit');
    const grid = root.getByRole('grid', { name: 'Stock, bulk edit' });
    const output = root.locator('[data-lab-output]');
    await grid.getByRole('row', { name: 'Apple' }).locator('.ui-table__checkbox').click();
    await grid.getByRole('row', { name: 'Carrot' }).locator('.ui-table__checkbox').click();
    const bar = root.locator('.ui-table__selection-bar');
    await expect(bar.getByRole('status')).toHaveText('2 selected');
    await bar.getByRole('button', { name: 'Edit selected' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit 2 rows' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-entering]')).toHaveCount(0);
    await lab.expectAccessible('.ui-table__bulk-edit');
    await dialog.getByRole('button').first().click();
    await page.getByRole('option', { name: 'Weight (g)' }).click();
    await dialog.getByRole('textbox', { name: 'Weight (g)' }).fill('99');
    await dialog.getByRole('button', { name: 'Apply' }).click();
    await expect(output).toHaveText('Last change: apple.weight=99, carrot.weight=99');
    await expect(dialog).toHaveCount(0);
    await expect(bar.getByRole('button', { name: 'Edit selected' })).toBeFocused();
    await bar.getByRole('button', { name: 'Edit selected' }).press('Enter');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Herb' }).click();
    await dialog.getByRole('button', { name: 'Apply' }).press('Enter');
    await expect(output).toHaveText('Last change: apple.kind=Herb, carrot.kind=Herb');
    await bar.getByRole('button', { name: 'Delete selected' }).click();
    await expect(grid.getByRole('row', { name: 'Apple' })).toHaveCount(0);
    await expect(bar).toHaveCount(0);
    await grid.getByRole('row', { name: 'Banana' }).locator('.ui-table__checkbox').click();
    await bar.getByRole('button', { name: 'Clear selection' }).click();
    await expect(bar).toHaveCount(0);
    await lab.expectAccessible('[data-lab="bulk-edit"]');
  });
  test('UIC-TABLE-14.5 continues small numeric steps through the fill handle', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const demo = section(page, 'small-steps');
    const grid = demo.getByRole('grid', { name: 'Small steps' });
    const cell = (row: string) =>
      grid.locator(`[data-key="${toCollectionKey(row)}"] > [data-column="value"]`);
    await cell('r1').click();
    await page.keyboard.press('Shift+ArrowDown');
    const handle = await grid.locator('.ui-table__fill-handle').boundingBox();
    const target = await cell('r4').boundingBox();
    if (!handle || !target) throw new Error('No fill geometry');
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + 10, target.y + 10, { steps: 6 });
    await page.mouse.up();
    await expect(cell('r3')).toHaveText('3e-7');
    await expect(cell('r4')).toHaveText('4e-7');
    await expect(demo.locator('[data-lab-output]')).toHaveText('1e-7, 2e-7, 3e-7, 4e-7');
    await lab.expectAccessible('[data-lab="small-steps"]');
  });
});
