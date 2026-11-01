import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const column = (scope: Locator, name: string) => scope.getByRole('grid', { name, exact: true });

test.describe('Relation Columns lab', () => {
  test('UIC-RELATION-COLUMNS-1.1 UIC-RELATION-COLUMNS-1.2 UIC-RELATION-COLUMNS-1.4 UIC-RELATION-COLUMNS-3.1 shows the columns of each path', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-columns');
    const cell = (path: string) => matrixCell(page, `path=${path} locale=en-US`);
    const titles = (scope: Locator) =>
      scope.locator('.ui-relation-columns__column-title').allTextContents();
    expect(await titles(cell('start'))).toEqual([
      'Upstream of Requirement 13: One-page payment',
      'Item',
      'Downstream of Requirement 13: One-page payment',
    ]);
    const downstream = cell('downstream');
    expect(await titles(downstream)).toEqual([
      'Upstream of Requirement 13: One-page payment',
      'Item',
      'Downstream of Requirement 13: One-page payment',
      'Downstream of Design 5: Payment form',
      'Downstream of Test 8: Pay with a saved card',
    ]);
    await expect(
      downstream
        .locator('.ui-relation-columns__column')
        .last()
        .locator('.ui-relation-columns__empty'),
    ).toHaveText('No downstream items');
    await expect(downstream.locator('.ui-relation-columns__path li')).toHaveText([
      'Requirement 13: One-page payment',
      'Design 5: Payment form',
      'Test 8: Pay with a saved card',
    ]);
    const both = cell('both sides');
    await expect(
      both.locator(
        '.ui-relation-columns__column[data-direction="upstream"][data-depth="1"] .ui-relation-columns__column-count',
      ),
    ).toContainText('2 items');
    await expect(
      column(both, 'Downstream of Requirement 13: One-page payment')
        .getByRole('row')
        .first()
        .locator('.ui-relation-columns__item-count'),
    ).toContainText('1 downstream');
    await lab.expectAccessible();
  });

  test('UIC-RELATION-COLUMNS-1.3 UIC-RELATION-COLUMNS-1.6 UIC-RELATION-COLUMNS-2.1 walks relations by keyboard and starts again from an item', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-columns');
    const walk = demo(page, 'walk');
    const output = walk.locator('[data-lab-output]');
    await column(walk, 'Item').getByRole('row').focus();
    await page.keyboard.press('ArrowRight');
    const designs = column(walk, 'Downstream of Requirement 13: One-page payment');
    await expect(designs.getByRole('row').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(designs.getByRole('row').nth(1)).toBeFocused();
    await expect(output).toHaveText('Upstream: none; downstream: Design 6: Address lookup');
    await expect(column(walk, 'Downstream of Design 6: Address lookup')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(
      column(walk, 'Downstream of Design 6: Address lookup').getByRole('row'),
    ).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    const goals = column(walk, 'Upstream of Requirement 13: One-page payment');
    await expect(goals.getByRole('row').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(output).toHaveText('Started from Checkout in under a minute');
    await expect(column(walk, 'Item')).toContainText('Checkout in under a minute');
    await expect(walk.locator('.ui-relation-columns__column')).toHaveCount(3);
    await walk.getByRole('button', { name: 'Back to the first item' }).click();
    await expect(column(walk, 'Item')).toContainText('Requirement 13: One-page payment');
    await expect(walk.locator('.ui-relation-columns__column')).toHaveCount(3);
    await expect(designs.getByRole('row', { selected: true })).toHaveCount(0);
  });

  test('UIC-RELATION-COLUMNS-1.3 UIC-RELATION-COLUMNS-1.4 chooses items by pointer and trims the walk from the trail', async ({
    page,
    lab,
  }) => {
    await lab.open('relation-columns');
    const walk = demo(page, 'walk');
    await column(walk, 'Downstream of Requirement 13: One-page payment')
      .getByRole('row', { name: /Design 5/ })
      .click();
    await column(walk, 'Downstream of Design 5: Payment form').getByRole('row').click();
    await column(walk, 'Upstream of Requirement 13: One-page payment')
      .getByRole('row', { name: /Fewer abandoned/ })
      .click();
    await expect(walk.locator('.ui-relation-columns__path li')).toHaveText([
      'Fewer abandoned baskets',
      'Requirement 13: One-page payment',
      'Design 5: Payment form',
      'Test 8: Pay with a saved card',
    ]);
    await walk.getByRole('link', { name: 'Design 5: Payment form' }).click();
    await expect(walk.locator('[data-lab-output]')).toHaveText(
      'Upstream: Fewer abandoned baskets; downstream: Design 5: Payment form',
    );
    await expect(column(walk, 'Downstream of Test 8: Pay with a saved card')).toHaveCount(0);
  });
});
