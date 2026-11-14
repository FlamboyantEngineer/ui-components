import { expect, test } from './fixtures.js';

test.describe('Asset Picker lab', () => {
  test('UIC-ASSET-PICKER-1.1 UIC-ASSET-PICKER-1.2 searches, selects and confirms an image', async ({
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
    await demo.getByRole('button', { name: 'Insert' }).click();
    await expect(demo.locator('[data-lab-inserted]')).toHaveText('Round loaf');
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

  test('UIC-ASSET-PICKER-1.1 keeps the results the same size when an image is chosen', async ({
    page,
    lab,
  }) => {
    await lab.open('asset-picker');
    const demo = page.locator('[data-lab-demo="insert"]');
    const grid = demo.getByRole('grid', { name: 'Images' });
    const first = grid.getByRole('row', { name: 'Round loaf' });
    const before = await first.boundingBox();
    await first.click();
    await expect(demo.getByRole('button', { name: 'Insert' })).toBeEnabled();
    expect(await first.boundingBox()).toEqual(before);
  });
});
