import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function spreadsheet(page: Page) {
  const root = page.locator('[data-lab-demo="spreadsheet"]');
  const grid = root.getByRole('grid', { name: 'Fruit order' });
  return {
    root,
    reference: root.getByRole('textbox', { name: 'Cell reference' }),
    content: root.getByRole('textbox', { name: 'Cell content' }),
    result: root.locator('.ui-formula-bar__result'),
    output: root.locator('[data-lab-output]'),
    cell: (row: number, column: string) =>
      grid.locator(`[data-key="row-${row}"] > [data-column="${column}"]`),
  };
}

test.describe('Formula Bar lab', () => {
  test('UIC-FORMULA-BAR-2.1 UIC-FORMULA-BAR-3.1 UIC-FORMULA-BAR-3.3 follows the selected cell', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await expect(sheet.reference).toHaveValue('D2');
    await expect(sheet.content).toHaveValue('=B2*C2');
    await expect(sheet.result).toHaveText('Result 2');
    await expect(sheet.root.locator('.ui-code-editor__token[data-token="key"]')).toHaveText([
      'B2',
      'C2',
    ]);
    await expect(sheet.cell(2, 'D')).toHaveText('2');
    await sheet.cell(3, 'B').click();
    await expect(sheet.reference).toHaveValue('B3');
    await expect(sheet.content).toHaveValue('6');
    await sheet.cell(6, 'D').click();
    await expect(sheet.content).toHaveValue('=SUM(D2:D5)');
    await expect(sheet.result).toHaveText('Result 13.4');
    const bar = (await sheet.root.locator('.ui-formula-bar').boundingBox())!;
    const grid = (await sheet.root.getByRole('grid').boundingBox())!;
    expect(bar.y + bar.height).toBeLessThanOrEqual(grid.y + 1);
  });

  test('UIC-FORMULA-BAR-2.2 moves to a typed reference and refuses others', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.reference.click();
    await page.keyboard.type('c4');
    await page.keyboard.press('Enter');
    await expect(sheet.reference).toHaveValue('C4');
    await expect(sheet.content).toHaveValue('0.2');
    await expect(sheet.cell(4, 'C')).toHaveAttribute('data-in-range', 'true');
    await expect(sheet.reference).toBeFocused();
    await page.keyboard.type('E9');
    await page.keyboard.press('Enter');
    await expect(sheet.reference).toHaveAttribute('aria-invalid', 'true');
    await expect(sheet.root.locator('.ui-formula-bar__status')).toHaveText('No cell named E9');
    await page.keyboard.press('Escape');
    await expect(sheet.reference).toHaveValue('C4');
    await expect(sheet.reference).not.toHaveAttribute('aria-invalid');
  });

  test('UIC-FORMULA-BAR-3.2 commits with Enter and restores with Escape', async ({ page, lab }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+1');
    await expect(sheet.root.locator('.ui-formula-bar')).toHaveAttribute('data-dirty', 'true');
    await expect(sheet.result).toHaveText('Result 3');
    await expect(sheet.cell(2, 'D')).toHaveText('2');
    await page.keyboard.press('Enter');
    await expect(sheet.output).toHaveText('Last commit: D2 = =B2*C2+1');
    await expect(sheet.cell(2, 'D')).toHaveText('3');
    await expect(sheet.cell(6, 'D')).toHaveText('14.4');
    await expect(sheet.root.locator('.ui-formula-bar')).not.toHaveAttribute('data-dirty');
    await page.keyboard.type('0');
    await page.keyboard.press('Escape');
    await expect(sheet.content).toHaveValue('=B2*C2+1');
    await page.keyboard.type('0');
    await sheet.root.getByRole('button', { name: 'Cancel' }).click();
    await expect(sheet.content).toHaveValue('=B2*C2+1');
  });

  test('UIC-FORMULA-BAR-4.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('formula-bar');
    await expect(page.getByRole('grid', { name: 'Fruit order' })).toBeVisible();
    await lab.expectAccessible();
    await lab.open('formula-bar', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
