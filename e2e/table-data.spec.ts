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
