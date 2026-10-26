import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, id: string): Locator {
  return page.locator(`[data-lab-cell="${id}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Tag Group lab', () => {
  test('UIC-TAG-GROUP-1.1 UIC-TAG-GROUP-1.3 UIC-TAG-GROUP-1.4 draws every tone and size', async ({
    page,
    lab,
  }) => {
    await lab.open('tag-group');
    await expect(page.locator('table[data-lab-matrix="tone size"] td[data-lab-cell]')).toHaveCount(
      15,
    );
    const heights = { sm: '18px', md: '22px', lg: '26px' };
    for (const [size, height] of Object.entries(heights)) {
      const tag = cell(page, `tone=info size=${size}`).getByRole('row', { name: 'Apple' });
      await expect(tag).toHaveCSS('height', height);
      await expect(tag).toHaveAttribute('data-tone', 'info');
    }
    await expect(
      cell(page, 'tone=danger size=md').getByRole('grid', { name: 'Fruit, danger' }),
    ).toBeVisible();
    await expect(
      cell(page, 'state=disabled size=md').getByRole('row', { name: 'Pear' }),
    ).toHaveAttribute('data-disabled', 'true');
    await expect(
      cell(page, 'state=selected size=md').getByRole('row', { name: 'Apple' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(cell(page, 'state=empty size=md').locator('.ui-tag-group__empty')).toHaveText(
      'No fruit',
    );
    await lab.expectAccessible();
  });

  test('UIC-TAG-GROUP-2.1 UIC-TAG-GROUP-2.2 moves and removes with the keyboard and the button', async ({
    page,
    lab,
  }) => {
    await lab.open('tag-group');
    const basket = field(page, 'basket');
    await basket.getByRole('row', { name: 'Apple' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(basket.getByRole('row', { name: 'Pear' })).toBeFocused();
    await page.keyboard.press('Delete');
    await expect(output(page, 'Basket')).toHaveText('Apple, Plum');
    await expect(basket.getByRole('row', { name: 'Plum' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(basket.getByRole('row', { name: 'Plum' })).toBeFocused();
    await page.keyboard.press('Backspace');
    await expect(output(page, 'Basket')).toHaveText('Apple');
    await expect(basket.getByRole('row', { name: 'Apple' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(basket.getByRole('button', { name: 'Remove Apple' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Refill' })).toBeFocused();
    await basket.getByRole('button', { name: 'Remove Apple' }).click();
    await expect(output(page, 'Basket')).toHaveText('empty');
    await expect(basket.locator('.ui-tag-group__list')).toHaveAttribute('data-empty', 'true');
    await expect(basket.locator('.ui-tag-group__empty')).toHaveText('The basket is empty.');
    await page.getByRole('button', { name: 'Refill' }).click();
    await expect(basket.getByRole('row')).toHaveCount(3);
  });

  test('UIC-TAG-GROUP-2.4 UIC-TAG-GROUP-1.6 selects tags and keeps caller marks', async ({
    page,
    lab,
  }) => {
    await lab.open('tag-group');
    const picker = field(page, 'picker');
    await picker.getByRole('row', { name: 'Plum' }).click();
    await expect(output(page, 'Selected')).toHaveText('pear, plum');
    await expect(picker.getByRole('row', { name: 'Plum' })).toHaveAttribute(
      'data-selected',
      'true',
    );
    const marked = field(page, 'marked');
    await expect(marked.getByRole('row', { name: 'Oslo' })).toHaveAttribute('data-change', 'added');
    await expect(marked.getByRole('row', { name: 'Oslo' })).toHaveAttribute('data-tone', 'success');
    await expect(marked.getByRole('row', { name: 'Lima, capital' })).toBeVisible();
  });

  test('UIC-TAG-GROUP-1.4 UIC-TAG-GROUP-1.5 passes axe in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('tag-group', { theme: 'dark' });
    await expect(cell(page, 'tone=neutral size=md').getByRole('row', { name: 'Apple' })).toHaveCSS(
      'background-color',
      'rgb(21, 27, 35)',
    );
    await lab.expectAccessible();
  });
});
