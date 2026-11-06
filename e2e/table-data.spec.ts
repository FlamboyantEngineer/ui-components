import { readFile } from 'node:fs/promises';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const section = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const output = (scope: Locator, name: string) => scope.locator(`[data-lab-output="${name}"]`);

async function chooseExport(page: Page, scope: Locator, name: string) {
  await scope.getByRole('button', { name: 'Export CSV' }).click();
  await page.getByRole('menu').getByRole('menuitem', { name }).click();
}

test.describe('Table lab, data', () => {
  test('UIC-TABLE-16.3 UIC-TABLE-16.4 downloads the filtered rows as UTF-8 CSV', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'csv-download');
    await root.getByRole('searchbox', { name: 'Filter rows' }).fill('mint');
    const download = page.waitForEvent('download');
    await chooseExport(page, root, 'All rows');
    const file = await download;
    expect(file.suggestedFilename()).toBe('plants.csv');
    const bytes = await readFile(await file.path());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.subarray(3).toString('utf8')).toBe(
      [
        'Name,Family,Height (cm),Note',
        'Basil,Mint,45 cm,"Sweet, ""Genovese"""',
        'Mint,Mint,60 cm,"Spreads, fast"',
        "Sage,Mint,70 cm,'-Grey leaves",
      ].join('\r\n'),
    );
  });

  test('UIC-TABLE-16.3 disables the selected rows until rows are selected', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'csv-download');
    await root.getByRole('button', { name: 'Export CSV' }).click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Current page',
      'All rows',
      'Selected rows',
    ]);
    await expect(menu.getByRole('menuitem', { name: 'Selected rows' })).toBeDisabled();
    await lab.expectAccessible('[data-lab-demo="csv-download"]');
    await page.keyboard.press('Escape');
  });

  test('UIC-TABLE-16.4 names caller-paged rows as loaded until every row is given', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = section(page, 'csv-preview');
    await chooseExport(page, root, 'Loaded rows');
    await expect(output(root, 'csv-scope')).toHaveText('rows');
    await expect
      .poll(() => output(root, 'csv-text').textContent())
      .toBe('Note,Name\r\n"Sweet, ""Genovese""",Basil\r\nHollow leaves,Chive\r\n\'=Feathery,Dill');
    await root.getByText('Give every row').click();
    await chooseExport(page, root, 'All rows');
    await expect(output(root, 'csv-text')).toContainText("'-Grey leaves,Sage");
  });
});

test.describe('Table lab, edit history', () => {
  const heights = (grid: Locator) => grid.locator('.ui-table__cell[data-column="height"]');

  test('UIC-TABLE-17.1 UIC-TABLE-17.2 undoes a paste as one step from the keyboard and the buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const root = page.locator('[data-lab="edit-history"]');
    const grid = root.getByRole('grid');
    await expect(heights(grid)).toHaveText(['45', '30', '90', '150']);
    await heights(grid).first().click();
    await page.keyboard.press('Shift+ArrowDown');
    await page.evaluate(() => {
      const data = new DataTransfer();
      data.setData('text/plain', '12');
      document.activeElement?.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
      );
    });
    await expect(heights(grid)).toHaveText(['12', '12', '90', '150']);
    await page.keyboard.press('Control+z');
    await expect(heights(grid)).toHaveText(['45', '30', '90', '150']);
    await page.keyboard.press('Control+Shift+z');
    await expect(heights(grid)).toHaveText(['12', '12', '90', '150']);
    await root.getByRole('button', { name: 'Undo' }).click();
    await expect(heights(grid)).toHaveText(['45', '30', '90', '150']);
    await expect(root.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await root.getByRole('button', { name: 'Redo' }).click();
    await expect(output(root, 'history-last')).toHaveText('basil.height chive.height');
    await lab.expectAccessible('[data-lab="edit-history"]');
  });

  test('UIC-TABLE-17.2 leaves Control+Z to an open editor', async ({ page, lab }) => {
    await lab.open('table');
    const root = page.locator('[data-lab="edit-history"]');
    const grid = root.getByRole('grid');
    const name = grid.locator('.ui-table__cell[data-column="name"]').first();
    await name.dblclick();
    const input = grid.getByRole('textbox');
    await input.fill('Thyme');
    await input.press('Enter');
    await expect(name).toHaveText('Thyme');
    await name.dblclick();
    await input.pressSequentially('x');
    await input.press('Control+z');
    await expect(input).toBeVisible();
    await input.press('Escape');
    await expect(name).toHaveText('Thyme');
  });
});

test.describe('Table lab, pinned rows', () => {
  const rowNamed = (grid: Locator, name: string) => grid.getByRole('row', { name, exact: true });

  test('UIC-TABLE-18.1 UIC-TABLE-18.4 keeps pinned rows at their edges while the body scrolls', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    await page.getByRole('button', { name: 'Mount the pinned rows table' }).click();
    const root = page.locator('[data-lab="pinned-rows"]');
    const grid = root.getByRole('grid');
    const scroll = root.locator('.ui-table__scroll');
    const header = grid.locator('.ui-table__header');
    const footer = grid.locator('.ui-table__footer');
    await expect(rowNamed(grid, 'Bed 3')).toHaveAttribute('data-pinned', 'top');
    await scroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(async () => {
      const scrollBox = await scroll.boundingBox();
      const headerBox = await header.boundingBox();
      const top = await rowNamed(grid, 'Bed 3').boundingBox();
      const bottom = await rowNamed(grid, 'Bed 14').boundingBox();
      const footerBox = await footer.boundingBox();
      if (!scrollBox || !headerBox || !top || !bottom || !footerBox) throw new Error('Not drawn');
      expect(Math.abs(top.y - (headerBox.y + headerBox.height))).toBeLessThan(1.5);
      expect(Math.abs(bottom.y + bottom.height - footerBox.y)).toBeLessThan(1.5);
      expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(
        scrollBox.y + scrollBox.height + 1,
      );
    }).toPass();
    await lab.expectAccessible('[data-lab="pinned-rows"]');
  });

  test('UIC-TABLE-18.2 UIC-TABLE-18.3 pins from the row menu, outside the filter', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    await page.getByRole('button', { name: 'Mount the pinned rows table' }).click();
    const root = page.locator('[data-lab="pinned-rows"]');
    const grid = root.getByRole('grid');
    await root.getByRole('searchbox', { name: 'Filter rows' }).fill('Bed 1');
    await expect(rowNamed(grid, 'Bed 3')).toBeVisible();
    await rowNamed(grid, 'Bed 10').getByRole('button', { name: 'Pin Bed 10' }).click();
    await page.getByRole('menu').getByRole('menuitem', { name: 'Pin to top' }).click();
    await expect(output(root, 'pinned-rows')).toHaveText('top bed-3, bed-10; bottom bed-14');
    await expect(rowNamed(grid, 'Bed 10')).toHaveAttribute('data-pinned', 'top');
    await expect(grid.getByRole('rowheader').first()).toHaveText('Bed 3');
    await expect(grid.getByRole('rowheader').nth(1)).toHaveText('Bed 10');
    await rowNamed(grid, 'Bed 10').locator('.ui-table__checkbox').click();
    await expect(rowNamed(grid, 'Bed 10')).toHaveAttribute('aria-selected', 'true');
  });
});
