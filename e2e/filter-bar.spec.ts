import { expect, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

test.describe('Filter Bar lab', () => {
  test('UIC-FILTER-BAR-2.1 UIC-FILTER-BAR-4.1 reads every field type as a chip', async ({
    page,
    lab,
  }) => {
    await lab.open('filter-bar');
    const cells = page.locator('table[data-lab-matrix="type state"] td[data-lab-cell]');
    expect(await cells.count()).toBe(6 * 2);
    const chip = (type: string, state: string) =>
      matrixCell(page, `type=${type} state=${state}`).locator(`.ui-filter-bar__chip`);
    const readings = {
      text: 'Title contains sea',
      number: 'Pages is between 150 and 300',
      date: 'Published is after Jan 1, 2020',
      choice: 'Genre is any of History, Travel',
      person: 'Reader is none of Jon Berg',
      boolean: 'Available is False',
    };
    for (const [type, text] of Object.entries(readings)) {
      await expect(chip(type, 'complete').getByRole('button').first()).toHaveAccessibleName(text);
      await expect(chip(type, 'incomplete')).toHaveAttribute('data-incomplete', 'true');
    }
    await expect(page.getByRole('group', { name: 'number filter, incomplete' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-FILTER-BAR-2.2 completes a choice filter saved without its list', async ({
    page,
    lab,
  }) => {
    await lab.open('filter-bar');
    const cell = matrixCell(page, 'type=choice state=incomplete');
    await cell.locator('.ui-filter-bar__chip').getByRole('button').first().click();
    const dialog = page.getByRole('dialog', { name: 'Genre' });
    await dialog.getByRole('button', { name: /Value/ }).click();
    await page.getByRole('option', { name: 'History' }).click();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(cell.locator('.ui-filter-bar__chip')).not.toHaveAttribute('data-incomplete');
  });

  test('UIC-FILTER-BAR-2.2 UIC-FILTER-BAR-2.3 UIC-FILTER-BAR-3.2 adds and edits a filter that narrows the list', async ({
    page,
    lab,
  }) => {
    await lab.open('filter-bar');
    const demo = page.locator('[data-lab-demo="catalogue"]');
    await expect(demo.locator('[data-lab-count]')).toHaveText('4 of 8 books');
    await demo.getByRole('button', { name: 'Add filter' }).click();
    await page.getByRole('menuitem', { name: 'Pages' }).click();
    const dialog = page.getByRole('dialog', { name: 'Pages' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('.ui-filter-bar__editor')).not.toHaveAttribute('data-entering');
    await lab.expectAccessible('.ui-filter-bar__editor');
    await dialog.getByRole('button', { name: /Condition/ }).click();
    await page.getByRole('option', { name: 'is at least' }).click();
    await dialog.getByRole('textbox', { name: 'Value' }).fill('300');
    await dialog.getByRole('textbox', { name: 'Value' }).press('Tab');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(
      demo.getByRole('button', { name: 'Pages is at least 300', exact: true }),
    ).toBeVisible();
    await expect(demo.locator('[data-lab-results] li')).toHaveText([
      'The Salt Road',
      'Tides of the Old Port',
    ]);
  });

  test('UIC-FILTER-BAR-2.4 UIC-FILTER-BAR-2.5 searches, removes and clears', async ({
    page,
    lab,
  }) => {
    await lab.open('filter-bar');
    const demo = page.locator('[data-lab-demo="catalogue"]');
    await demo.getByRole('searchbox', { name: 'Search books' }).fill('road');
    await expect(demo.locator('[data-lab-results] li')).toHaveText(['The Salt Road']);
    await demo.getByRole('searchbox', { name: 'Search books' }).fill('');
    await demo
      .getByRole('button', { name: 'Remove filter Genre is any of History, Travel' })
      .click();
    await expect(demo.getByRole('button', { name: 'Add filter' })).toBeFocused();
    await expect(demo.locator('[data-lab-count]')).toHaveText('8 of 8 books');
    await expect(demo.locator('[data-lab-value]')).toHaveText('[]');
    const several = matrixCell(page, 'filters=several');
    await several.getByRole('button', { name: 'Clear all' }).click();
    await expect(several.locator('.ui-filter-bar')).toHaveAttribute('data-empty', 'true');
    await expect(several.getByRole('button', { name: 'Add filter' })).toBeFocused();
  });

  test('UIC-FILTER-BAR-1.2 UIC-FILTER-BAR-3.1 matches padded text, early years and fresh ranges', async ({
    page,
    lab,
  }) => {
    await lab.open('filter-bar');
    const results = page.locator('[data-lab-helpers] [data-lab-call]');
    await expect(results).toHaveText(['true', 'false', 'true', 'false']);
  });
});

test('UIC-FILTER-BAR-1.2 UIC-FILTER-BAR-3.2 reports which conditions are complete and filters by those alone', async ({
  page,
  lab,
}) => {
  await lab.open('filter-bar');
  const demo = page.locator('[data-lab-demo="completeness"]');
  const state = (field: string) => demo.locator(`[data-lab-condition="${field}"]`);
  await expect(state('title')).toHaveText(/: incomplete$/);
  await expect(state('published')).toHaveText(/not-empty null: complete$/);
  await expect(state('pages')).toHaveText(/"max":null\}: incomplete$/);
  await expect(state('genre')).toHaveText(/: complete$/);
  const before = await demo.locator('[data-lab-output="books"]').textContent();

  await demo.getByRole('button', { name: /^Pages/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Pages' });
  await dialog.getByRole('textbox', { name: 'To' }).fill('300');
  await dialog.getByRole('textbox', { name: 'To' }).press('Tab');
  await page.keyboard.press('Escape');
  await expect(state('pages')).toHaveText(/"max":300\}: complete$/);
  await expect(demo.locator('[data-lab-output="books"]')).not.toHaveText(requireDefined(before));
  await lab.expectAccessible('[data-lab-demo="completeness"]');
});
