import { toCollectionKey } from '../src/utils/to-collection-key.js';
import type { Page } from '@playwright/test';
import { cellSelector, expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

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
      grid.locator(`[data-key="${toCollectionKey(`row-${row}`)}"] > [data-column="${column}"]`),
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
    const bar = requireDefined(await sheet.root.locator('.ui-formula-bar').boundingBox());
    const grid = requireDefined(await sheet.root.getByRole('grid').boundingBox());
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

  test('UIC-FORMULA-BAR-2.2 keeps reference Enter from submitting a form', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const form = page.locator('[data-lab-demo="form"]');
    const reference = form.getByRole('textbox', { name: 'Cell reference' });
    await reference.click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('b2');
    await page.keyboard.press('Enter');
    await expect(reference).toHaveValue('B2');
    await page.keyboard.type('Z9');
    await page.keyboard.press('Enter');
    await expect(reference).toHaveAttribute('aria-invalid', 'true');
    await expect(form.locator('[data-lab-output]')).toHaveText('Submitted 0 times');
    await form.getByRole('button', { name: 'Submit the form' }).click();
    await expect(form.locator('[data-lab-output]')).toHaveText('Submitted 1 times');
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

  test('UIC-FORMULA-BAR-3.2 keeps a draft uncommitted while the bar is locked', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+1');
    const confirm = sheet.root.getByRole('button', { name: 'Confirm' });
    const lock = sheet.root.getByRole('checkbox', { name: 'Lock the bar' });
    await lock.check();
    await expect(confirm).toBeDisabled();
    await expect(sheet.root.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect(sheet.output).toHaveText('Last commit: none');
    await lock.uncheck();
    await expect(sheet.content).toHaveValue('=B2*C2+1');
    await confirm.click();
    await expect(sheet.output).toHaveText('Last commit: D2 = =B2*C2+1');
  });

  test('UIC-FORMULA-BAR-3.1 discards a draft left behind when another cell is selected', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const sheet = spreadsheet(page);
    await sheet.content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+1');
    await sheet.cell(3, 'B').click();
    await expect(sheet.content).toHaveValue('6');
    await sheet.cell(2, 'D').click();
    await expect(sheet.content).toHaveValue('=B2*C2');
    await expect(sheet.root.locator('.ui-formula-bar')).not.toHaveAttribute('data-dirty');
  });

  test('UIC-FORMULA-BAR-4.1 passes axe', async ({ page, lab }) => {
    await lab.open('formula-bar');
    await expect(page.getByRole('grid', { name: 'Fruit order' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-FORMULA-BAR-3.4 drops the buttons and their room, and commits and cancels by key', async ({
    page,
    lab,
  }) => {
    await lab.open('formula-bar');
    const withButtons = page.locator(
      `${cellSelector('width=320px actions=buttons')} .ui-formula-bar`,
    );
    const keysOnly = page.locator(
      `${cellSelector('width=320px actions=keys only')} .ui-formula-bar`,
    );
    await expect(withButtons.locator('.ui-formula-bar__confirm')).toBeVisible();
    await expect(keysOnly.locator('button')).toHaveCount(0);
    const editorWidth = async (bar: typeof keysOnly) =>
      requireDefined(await bar.locator('.ui-formula-bar__editor').boundingBox()).width;
    // The editor takes the room the buttons left.
    expect(await editorWidth(keysOnly)).toBeGreaterThan((await editorWidth(withButtons)) + 40);
    const content = keysOnly.getByRole('textbox', { name: 'Cell content' });
    await expect(content).toHaveAccessibleDescription(/Enter confirms, Escape cancels\./);
    await content.click();
    await page.keyboard.press('End');
    await page.keyboard.type('+1');
    await expect(keysOnly).toHaveAttribute('data-dirty', 'true');
    await page.keyboard.press('Escape');
    await expect(keysOnly).not.toHaveAttribute('data-dirty');
  });
});
