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
    await lab.open('table', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
