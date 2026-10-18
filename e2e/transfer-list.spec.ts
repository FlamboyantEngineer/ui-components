import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Transfer List lab', () => {
  test('UIC-TRANSFER-LIST-1.1 UIC-TRANSFER-LIST-1.3 draws every state', async ({ page, lab }) => {
    await lab.open('transfer-list');
    const cell = (state: string) => page.locator(`[data-lab-cell="state=${state}"]`);
    await expect(
      cell('chosen').locator('[data-side="chosen"] .ui-transfer-list__count'),
    ).toHaveText('2 items');
    await expect(
      cell('chosen').getByRole('grid', { name: 'Available' }).getByRole('row'),
    ).toHaveCount(3);
    await expect(cell('reorderable').getByRole('button', { name: 'Move up' })).toBeDisabled();
    await expect(cell('disabled items').getByRole('row', { name: 'Quito' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(
      cell('disabled').getByRole('searchbox', { name: 'Filter available' }),
    ).toBeDisabled();
    await expect(cell('empty').locator('.ui-transfer-list__empty')).toHaveText([
      'No items',
      'No items',
    ]);
    const list = cell('resting').getByRole('grid', { name: 'Available' });
    await expect(list).toHaveCSS('height', '220px');
    await lab.expectAccessible();
  });

  test('UIC-TRANSFER-LIST-2.1 UIC-TRANSFER-LIST-2.2 UIC-TRANSFER-LIST-2.3 moves by button, double click and Enter', async ({
    page,
    lab,
  }) => {
    await lab.open('transfer-list');
    const columns = field(page, 'columns');
    const hidden = columns.getByRole('grid', { name: 'Hidden columns' });
    const shown = columns.getByRole('grid', { name: 'Shown columns' });
    await hidden.getByRole('row', { name: 'Owner' }).dblclick();
    await expect(output(page, 'columns')).toHaveText('name, status, owner');
    await hidden.getByRole('row', { name: 'Due date' }).click();
    await page.keyboard.press('Shift+ArrowDown');
    await expect(columns.locator('[data-side="available"] .ui-transfer-list__count')).toHaveText(
      '5 items, 2 selected',
    );
    await columns.getByRole('button', { name: 'Move selected to shown columns' }).click();
    await expect(output(page, 'columns')).toHaveText('name, status, owner, due, created');
    await expect(shown.getByRole('row', { name: 'Created' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await shown.getByRole('row', { name: 'Status' }).click();
    await page.keyboard.press('Enter');
    await expect(output(page, 'columns')).toHaveText('name, owner, due, created');
    await expect(hidden.getByRole('row', { name: 'Size' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('UIC-TRANSFER-LIST-2.4 reorders the chosen side by buttons and keyboard drag and drop', async ({
    page,
    lab,
  }) => {
    await lab.open('transfer-list');
    const columns = field(page, 'columns');
    const shown = columns.getByRole('grid', { name: 'Shown columns' });
    await shown.getByRole('row', { name: 'Status' }).click();
    await columns.getByRole('button', { name: 'Move up' }).click();
    await expect(output(page, 'columns')).toHaveText('status, name');
    await expect(columns.getByRole('button', { name: 'Move up' })).toBeDisabled();
    await shown.getByRole('row', { name: 'Status' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(shown.locator('.ui-list-view-item__drag-handle').first()).toBeFocused();
    await page.keyboard.press('Enter');
    // Spots beside the dragged row would move nothing, so the first spot offered is after Name.
    await expect(shown.locator('.ui-list-view__drop-indicator[data-drop-target]')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(output(page, 'columns')).toHaveText('name, status');
  });

  test('UIC-TRANSFER-LIST-1.4 UIC-TRANSFER-LIST-2.2 filters a side and moves all it shows', async ({
    page,
    lab,
  }) => {
    await lab.open('transfer-list');
    const itinerary = field(page, 'itinerary');
    await itinerary.getByRole('searchbox', { name: 'Filter available' }).fill('LI');
    await expect(itinerary.getByRole('grid', { name: 'Available' }).getByRole('row')).toHaveCount(
      2,
    );
    await itinerary.getByRole('button', { name: 'Move all to chosen' }).click();
    await expect(output(page, 'itinerary')).toHaveText('lisbon, lima');
    await itinerary.getByRole('searchbox', { name: 'Filter available' }).fill('zz');
    await expect(itinerary.locator('[data-side="available"] .ui-transfer-list__empty')).toHaveText(
      'No results',
    );
    await lab.expectAccessible();
  });

  test('UIC-TRANSFER-LIST-2.6 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('transfer-list', { theme: 'dark' });
    await field(page, 'columns').getByRole('row', { name: 'Owner' }).click();
    await lab.expectAccessible();
  });
});
