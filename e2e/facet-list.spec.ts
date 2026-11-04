import { expect, matrixCell, test } from './fixtures.js';

test.describe('Facet List lab', () => {
  test('UIC-FACET-LIST-1.1 UIC-FACET-LIST-2.1 UIC-FACET-LIST-1.4 shows counted values and folds long facets', async ({
    page,
    lab,
  }) => {
    await lab.open('facet-list');
    const cells = page.locator('table[data-lab-matrix="mode"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4);
    const plain = page.getByRole('group', { name: 'Fruit (plain)' });
    await expect(plain.getByRole('checkbox', { name: 'Apple, 1,204' })).not.toBeChecked();
    await expect(plain.getByRole('checkbox', { name: 'Pear, 87' })).toBeChecked();
    await expect(plain.getByRole('checkbox', { name: 'Plum' })).toBeVisible();
    const folded = matrixCell(page, 'mode=folded');
    await expect(folded.getByRole('checkbox')).toHaveCount(5);
    await folded.getByRole('button', { name: 'Show 7 more' }).click();
    await expect(folded.getByRole('checkbox')).toHaveCount(12);
    await expect(folded.getByRole('checkbox', { name: 'Nuuk, 0' })).toBeDisabled();
    await expect(folded.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await lab.expectAccessible();
  });

  test('UIC-FACET-LIST-1.2 UIC-FACET-LIST-1.3 UIC-FACET-LIST-1.5 searches, ticks and lists ticked values first', async ({
    page,
    lab,
  }) => {
    await lab.open('facet-list');
    const demo = page.locator('[data-lab-demo="facets"]');
    const boxes = demo.getByRole('checkbox');
    await expect(boxes.first()).toHaveAccessibleName('Oslo, 96');
    await demo.getByRole('searchbox', { name: 'Filter city' }).fill('or');
    await expect(boxes).toHaveCount(1);
    await demo.locator('.ui-facet-list__option', { hasText: 'Cork' }).click();
    await expect(demo.getByRole('checkbox', { name: 'Cork, 12' })).toBeChecked();
    await expect(demo.locator('[data-lab-value]')).toHaveText('oslo, cork');
    // Québec is written with a combining accent; a composed, upper-case search finds it.
    await demo.getByRole('searchbox', { name: 'Filter city' }).fill('QUÉBEC');
    await expect(boxes).toHaveCount(1);
    await demo.getByRole('searchbox', { name: 'Filter city' }).fill('');
    await expect(boxes.first()).toHaveAccessibleName('Oslo, 96');
    await page.getByRole('heading', { name: 'Narrowing a list' }).click();
    await expect(boxes.nth(1)).toHaveAccessibleName('Cork, 12');
    await expect(demo.getByRole('button', { name: 'Show 8 more' })).toBeVisible();
  });
});
