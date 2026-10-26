import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Character Grid lab', () => {
  test('UIC-CHARACTER-GRID-1.1 UIC-CHARACTER-GRID-2.2 draws the sets with and without recent characters', async ({
    page,
    lab,
  }) => {
    await lab.open('character-grid');
    const stored = page.locator('[data-lab-cell="recent=stored set=all"]');
    await expect(stored.locator('.ui-character-grid__heading')).toHaveText([
      'Recently used',
      'Arrows',
      'Currency',
      'Mathematics',
      'Marks',
    ]);
    await expect(stored.locator('.ui-character-grid__section').first().getByRole('row')).toHaveText(
      ['Recently used', '©', '€', '→'],
    );
    const single = page.locator('[data-lab-cell="recent=none set=one"]');
    await expect(single.locator('.ui-character-grid__heading')).toHaveText(['Currency']);
    await expect(stored.locator('.ui-character-grid')).toHaveCSS('width', '300px');
    await lab.expectAccessible();
  });

  test('UIC-CHARACTER-GRID-1.3 UIC-CHARACTER-GRID-1.2 UIC-CHARACTER-GRID-1.4 moves in two dimensions across sections and chooses', async ({
    page,
    lab,
  }) => {
    await lab.open('character-grid');
    const grid = field(page, 'inline');
    await grid.getByRole('row', { name: 'Leftwards arrow' }).click();
    await expect(output(page, 'inline')).toHaveText('← Leftwards arrow');
    await expect(grid.locator('.ui-character-grid__heading').first()).toHaveText('Recently used');
    await grid.getByRole('row', { name: 'Upwards arrow' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(grid.getByRole('row', { name: 'Pound sign' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(grid.getByRole('row', { name: 'Yen sign' })).toBeFocused();
    await expect(grid.locator('.ui-character-grid__preview-code')).toHaveText('U+00A5');
    await page.keyboard.press('ArrowUp');
    await expect(grid.getByRole('row', { name: 'Rightwards arrow' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(grid.getByRole('row', { name: 'Em dash' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(output(page, 'inline')).toHaveText('— Em dash');
  });

  test('UIC-CHARACTER-GRID-2.1 searches names and code points', async ({ page, lab }) => {
    await lab.open('character-grid');
    const grid = field(page, 'inline');
    const search = grid.getByRole('searchbox', { name: 'Search characters' });
    await search.fill('u+00b0');
    await expect(grid.getByRole('row', { name: 'Degree sign' })).toBeVisible();
    await expect(grid.locator('.ui-character-grid__cell')).toHaveCount(1);
    await search.press('Enter');
    await expect(output(page, 'inline')).toHaveText('° Degree sign');
    await search.fill('double arrow');
    await search.press('ArrowDown');
    await expect(grid.getByRole('row', { name: 'Rightwards double arrow' })).toBeFocused();
    await search.fill('snowman');
    await expect(grid.getByRole('status')).toHaveText('No results');
  });

  test('UIC-CHARACTER-GRID-2.3 UIC-CHARACTER-GRID-2.1 inserts from a popover and closes with Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('character-grid');
    const trigger = page.locator('[data-lab-trigger]');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Insert symbol' });
    const search = dialog.getByRole('searchbox', { name: 'Search characters' });
    await expect(search).toBeFocused();
    await page.keyboard.type('copyright');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(output(page, 'text')).toHaveText('Total: 42©');
    await trigger.click();
    await expect(dialog.getByRole('row', { name: 'Copyright sign' }).first()).toBeVisible();
    await expect(search).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('UIC-CHARACTER-GRID-1.4 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('character-grid', { theme: 'dark' });
    await field(page, 'inline').getByRole('row', { name: 'Euro sign' }).hover();
    await expect(field(page, 'inline').locator('.ui-character-grid__preview-name')).toHaveText(
      'Euro sign',
    );
    await lab.expectAccessible();
  });
});
