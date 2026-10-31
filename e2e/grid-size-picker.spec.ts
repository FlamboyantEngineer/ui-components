import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

/** A cell's English name, with its numbers written in the provider locale. */
function cellName(rows: number, columns: number, locale = 'en-US'): string {
  const digits = new Intl.NumberFormat(locale);
  const count = (value: number, unit: string) =>
    `${digits.format(value)} ${unit}${value === 1 ? '' : 's'}`;
  return `${count(rows, 'row')} by ${count(columns, 'column')}`;
}

test.describe('Grid Size Picker lab', () => {
  test('UIC-GRID-SIZE-PICKER-1.1 UIC-GRID-SIZE-PICKER-1.3 draws every state and bound', async ({
    page,
    lab,
  }) => {
    await lab.open('grid-size-picker');
    const cell = (id: string) => matrixCell(page, id);
    await expect(cell('state=enabled bounds=default').getByRole('gridcell')).toHaveCount(25);
    await expect(cell('state=enabled bounds=small').getByRole('gridcell')).toHaveCount(9);
    await expect(cell('state=enabled bounds=fixed').getByRole('gridcell')).toHaveCount(16);
    await expect(
      cell('state=disabled bounds=default').locator('.ui-grid-size-picker'),
    ).toHaveAttribute('data-disabled', 'true');
    const first = cell('state=enabled bounds=default').getByRole('gridcell', {
      name: cellName(1, 1),
    });
    await expect(first).toHaveCSS('width', '18px');
    await expect(
      cell('state=enabled bounds=default').locator('.ui-grid-size-picker__readout'),
    ).toHaveText('1 × 1');
    await lab.expectAccessible();
  });

  test('UIC-GRID-SIZE-PICKER-1.2 UIC-GRID-SIZE-PICKER-1.3 UIC-GRID-SIZE-PICKER-1.4 previews, grows and chooses by pointer', async ({
    page,
    lab,
  }) => {
    await lab.open('grid-size-picker');
    const picker = field(page, 'inline');
    await picker.getByRole('gridcell', { name: cellName(5, 5) }).hover();
    await expect(picker.locator('.ui-grid-size-picker__readout')).toHaveText('5 × 5');
    await expect(picker.getByRole('row')).toHaveCount(6);
    await expect(picker.getByRole('gridcell', { name: cellName(3, 3) })).toHaveAttribute(
      'data-in-range',
      'true',
    );
    await picker.getByRole('gridcell', { name: cellName(6, 6) }).hover();
    await expect(picker.getByRole('row')).toHaveCount(7);
    await picker.getByRole('gridcell', { name: cellName(3, 4) }).click();
    await expect(output(page, 'inline')).toHaveText('3 × 4');
  });

  test('UIC-GRID-SIZE-PICKER-2.1 moves from the focused cell while the pointer previews another', async ({
    page,
    lab,
  }) => {
    await lab.open('grid-size-picker');
    const picker = field(page, 'inline');
    await picker.getByRole('gridcell', { name: cellName(1, 1) }).focus();
    await picker.getByRole('gridcell', { name: cellName(3, 3) }).hover();
    await expect(picker.locator('.ui-grid-size-picker__readout')).toHaveText('3 × 3');
    await page.keyboard.press('ArrowRight');
    await expect(picker.getByRole('gridcell', { name: cellName(1, 2) })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(output(page, 'inline')).toHaveText('1 × 2');
  });

  test('UIC-GRID-SIZE-PICKER-2.1 UIC-GRID-SIZE-PICKER-2.3 chooses from the keyboard in a popover', async ({
    page,
    lab,
  }) => {
    await lab.open('grid-size-picker');
    await page.locator('[data-lab-trigger]').click();
    const dialog = page.getByRole('dialog', { name: 'Insert table' });
    await expect(dialog.getByRole('gridcell', { name: cellName(1, 1) })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(dialog.getByRole('gridcell', { name: cellName(2, 3) })).toBeFocused();
    await page.keyboard.press('End');
    await expect(dialog.getByRole('gridcell', { name: cellName(2, 8) })).toBeFocused();
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(output(page, 'table')).toHaveText('2 × 1');
    await expect(page.locator('[data-lab-trigger]')).toBeFocused();
  });

  test('UIC-GRID-SIZE-PICKER-2.1 mirrors left and right in a right-to-left locale', async ({
    page,
    lab,
  }) => {
    await lab.open('grid-size-picker');
    const picker = field(page, 'rtl');
    await picker.getByRole('gridcell', { name: cellName(1, 1, 'ar-EG') }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(picker.getByRole('gridcell', { name: cellName(1, 2, 'ar-EG') })).toBeFocused();
    const first = await picker
      .getByRole('gridcell', { name: cellName(1, 1, 'ar-EG') })
      .boundingBox();
    const second = await picker
      .getByRole('gridcell', { name: cellName(1, 2, 'ar-EG') })
      .boundingBox();
    expect((second?.x ?? 0) < (first?.x ?? 0)).toBe(true);
  });

  test('UIC-GRID-SIZE-PICKER-1.2 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('grid-size-picker', { theme: 'dark' });
    await field(page, 'inline')
      .getByRole('gridcell', { name: cellName(2, 2) })
      .hover();
    await lab.expectAccessible();
  });

  test('UIC-GRID-SIZE-PICKER-2.5 keeps focus on the clamped cell when the bounds shrink', async ({
    page,
    lab,
  }) => {
    await lab.open('grid-size-picker');
    const picker = field(page, 'limited');
    await picker.getByRole('gridcell', { name: cellName(1, 1) }).focus();
    await page.keyboard.press('Control+End');
    await expect(picker.getByRole('gridcell', { name: cellName(8, 8) })).toBeFocused();
    // A script click leaves focus in the grid, as a bounds change from the host would.
    await page.locator('[data-lab-control="limit"]').evaluate((button: HTMLElement) => {
      button.click();
    });
    await expect(picker.getByRole('gridcell', { name: cellName(3, 3) })).toBeFocused();
    await expect(picker.locator('.ui-grid-size-picker__readout')).toHaveText('3 × 3');
    await page.locator('[data-lab-control="limit"]').evaluate((button: HTMLElement) => {
      button.click();
    });
    await expect(picker.getByRole('gridcell', { name: cellName(3, 3) })).toBeFocused();
    await expect(picker.getByRole('gridcell')).toHaveCount(25);
  });
});
