import { expect, test } from './fixtures.js';

test.describe('Asset Picker lab', () => {
  test('UIC-ASSET-PICKER-1.1 UIC-ASSET-PICKER-1.2 searches, places and inserts an image', async ({
    page,
    lab,
  }) => {
    await lab.open('asset-picker');
    const demo = page.locator('[data-lab-demo="insert"]');
    const grid = demo.getByRole('grid', { name: 'Images' });
    await expect(grid.getByRole('row')).toHaveCount(6);
    await demo.getByRole('searchbox', { name: 'Search images' }).fill('loaf');
    await expect(grid.getByRole('row')).toHaveCount(1);
    await grid.getByRole('row', { name: 'Round loaf' }).click();
    const width = demo.getByRole('textbox', { name: 'Width' });
    await width.fill('400');
    await width.press('Tab');
    await expect(demo.getByRole('textbox', { name: 'Height' })).toHaveValue('300');
    await demo.getByRole('radio', { name: 'Center' }).click();
    await demo.getByRole('button', { name: 'Insert' }).click();
    await expect(demo.locator('[data-lab-inserted]')).toHaveText(
      'Round loaf, 400 × 300, center, alt "A round loaf on a board"',
    );
    await lab.expectAccessible('[data-lab-demo="insert"]');
  });

  test('UIC-ASSET-PICKER-1.1 moves through the results with the arrow keys', async ({
    page,
    lab,
  }) => {
    await lab.open('asset-picker');
    const grid = page.locator('[data-lab-demo="insert"]').getByRole('grid', { name: 'Images' });
    await grid.getByRole('row', { name: 'Round loaf' }).click();
    await page.keyboard.press('ArrowRight');
    await expect(grid.getByRole('row', { name: 'Bread rolls' })).toBeFocused();
  });

  test('UIC-ASSET-PICKER-1.1 says a failed search failed', async ({ page, lab }) => {
    await lab.open('asset-picker');
    const demo = page.locator('[data-lab-demo="failed"]');
    await expect(demo.getByText('Search is unavailable.')).toBeVisible();
    await expect(demo.getByRole('button', { name: 'Insert' })).toBeDisabled();
  });
});
