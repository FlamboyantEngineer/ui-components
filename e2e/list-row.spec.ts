import { expect, test } from './fixtures.js';

test.describe('List Row lab', () => {
  test('UIC-LIST-ROW-1.1 UIC-LIST-ROW-2.1 UIC-LIST-ROW-2.2 keeps native roles and one link per link row', async ({
    page,
    lab,
  }) => {
    await lab.open('list-row');
    const link = page.locator('[data-lab-cell="kind=link state=default"]');
    await expect(link.getByRole('list')).toHaveCount(1);
    await expect(link.getByRole('listitem')).toHaveCount(1);
    await expect(link.locator('a')).toHaveCount(1);
    await expect(link.getByRole('link')).toHaveAccessibleName(/Report\.pdf/);
    await expect(
      page.locator('[data-lab-cell="kind=action state=default"]').getByRole('button'),
    ).toHaveAccessibleName(/Report\.pdf/);
    const trailing = page.locator('[data-lab-cell="content=trailing kind=link"]');
    await expect(trailing.locator('a button, a a')).toHaveCount(0);
    await expect(trailing.locator('.ui-list-row__trailing').getByRole('button')).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-LIST-ROW-1.2 UIC-LIST-ROW-1.3 moves between rows by keyboard and keeps one tab stop', async ({
    page,
    lab,
  }) => {
    await lab.open('list-row');
    const search = page.getByRole('searchbox', { name: 'Filter cities' });
    const primary = (city: string) => page.locator(`[data-city="${city}"] .ui-list-row__primary`);
    await search.focus();
    await page.keyboard.press('ArrowDown');
    await expect(primary('lisbon')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(primary('oslo')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(primary('kyoto')).toBeFocused();
    await page.keyboard.press('End');
    await expect(primary('accra')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(primary('accra')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(primary('lisbon')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(search).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(primary('lisbon')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'More about Lisbon' })).toBeFocused();
    await expect(page.locator('[data-lab-search] .ui-list-row__primary[tabindex="0"]')).toHaveCount(
      1,
    );

    await primary('kyoto').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-search] [data-lab-output]')).toHaveText('Opened: Kyoto');
  });

  test('UIC-LIST-ROW-1.5 moves focus to the next row when the focused row is removed', async ({
    page,
    lab,
  }) => {
    await lab.open('list-row');
    await page.getByRole('button', { name: 'Remove Banana' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-fruit="Cherry"] .ui-list-row__primary')).toBeFocused();
    await page.getByRole('button', { name: 'Remove Elderberry' }).click();
    await expect(page.locator('[data-fruit="Damson"] .ui-list-row__primary')).toBeFocused();
  });

  test('UIC-LIST-ROW-1.6 UIC-LIST-ROW-2.9 draws dividers, ellipsizes text and wraps trailing content in narrow rows', async ({
    page,
    lab,
  }) => {
    await lab.open('list-row');
    const narrow = page.locator('[data-lab-narrow]');
    const rows = narrow.locator('.ui-list-row');
    expect(await rows.nth(1).evaluate((row) => getComputedStyle(row).borderTopStyle)).toBe('solid');
    expect(await rows.nth(0).evaluate((row) => getComputedStyle(row).borderTopStyle)).toBe('none');

    const title = rows.nth(0).locator('.ui-list-row-content__title');
    const meta = rows.nth(0).locator('.ui-list-row-content__meta');
    await expect(title).toHaveText('Quarterly planning notes for the garden committee');
    for (const line of [title, meta]) {
      expect(await line.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
      expect((await line.boundingBox())?.height).toBeLessThan(24);
    }
    const primaryBox = await rows.nth(0).locator('.ui-list-row__primary').boundingBox();
    const trailingBox = await rows.nth(0).locator('.ui-list-row__trailing').boundingBox();
    expect(trailingBox?.y ?? 0).toBeGreaterThanOrEqual(
      (primaryBox?.y ?? 0) + (primaryBox?.height ?? 0) - 1,
    );

    const wide = page.locator('[data-lab-cell="content=trailing kind=link"]');
    const widePrimary = await wide.locator('.ui-list-row__primary').boundingBox();
    const wideTrailing = await wide.locator('.ui-list-row__trailing').boundingBox();
    expect(wideTrailing?.x ?? 0).toBeGreaterThan(
      (widePrimary?.x ?? 0) + (widePrimary?.width ?? 0) - 1,
    );
  });

  test('UIC-LIST-ROW-3.1 UIC-LIST-ROW-3.2 UIC-LIST-ROW-3.3 selects list view rows by keyboard, checkbox and typing', async ({
    page,
    lab,
  }) => {
    await lab.open('list-row');
    const list = page.getByRole('grid', { name: 'Fruit multiple' });
    const row = (name: string) => list.getByRole('row', { name: new RegExp(`^${name}`) });
    expect(await row('Apple').getAttribute('id')).not.toBe(await row('Banana').getAttribute('id'));
    await expect(row('Banana')).toHaveAttribute('aria-selected', 'true');
    await row('Apple').focus();
    await page.keyboard.press('ArrowDown');
    await expect(row('Banana')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(row('Banana')).toHaveAttribute('aria-selected', 'false');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(row('Elderberry')).toBeFocused();
    await page.keyboard.press('c');
    await expect(row('Cherry')).toBeFocused();
    await row('Apple').locator('.ui-list-view-item__checkbox').click();
    await expect(row('Apple')).toHaveAttribute('aria-selected', 'true');
    await expect(row('Damson')).toHaveAttribute('aria-disabled', 'true');

    const replace = page.getByRole('grid', { name: 'Fruit replace' });
    await expect(replace.getByRole('checkbox')).toHaveCount(0);
    await replace.getByRole('row', { name: /^Cherry/ }).click();
    await expect(replace.locator('[aria-selected="true"]')).toHaveCount(1);
    await lab.expectAccessible();
  });

  test('UIC-LIST-ROW-3.4 keeps a section header in view while its rows scroll', async ({
    page,
    lab,
  }) => {
    await lab.open('list-row');
    const list = page.getByRole('grid', { name: 'Produce' });
    await expect(list.getByRole('rowgroup')).toHaveCount(3);
    await list.evaluate((element) => {
      element.scrollTop = 120;
    });
    const header = list.locator('.ui-list-view-section__header').first();
    const listBox = await list.boundingBox();
    const headerBox = await header.boundingBox();
    expect(Math.abs((headerBox?.y ?? 0) - (listBox?.y ?? 0))).toBeLessThan(2);
    await list.getByRole('row', { name: /^Elderberry/ }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(list.getByRole('row', { name: /^Leek/ })).toBeFocused();
  });

  test('UIC-LIST-ROW-3.5 reorders list view rows by keyboard drag and drop', async ({
    page,
    lab,
  }) => {
    await lab.open('list-row');
    const reorder = page.locator('[data-lab-reorder]');
    await reorder.getByRole('row', { name: /^Apple/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(reorder.locator('.ui-list-view-item__drag-handle').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(reorder.locator('.ui-list-view__drop-indicator[data-drop-target]')).toHaveCount(1);
    // Spots beside the dragged row would move nothing, so the first spot offered is after Banana.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(reorder.locator('[data-lab-output]')).toHaveText(
      'Order: Banana, Cherry, Apple, Damson, Elderberry',
    );
  });

  test('UIC-LIST-ROW-3.6 renders only the rows in view and loads pages as the end scrolls in', async ({
    page,
    lab,
  }) => {
    await lab.open('list-row');
    const long = page.locator('[data-lab-long]');
    await long.getByRole('button', { name: 'Show recipes' }).click();
    const list = long.getByRole('grid', { name: 'Recipes' });
    expect(await list.getByRole('row').count()).toBeLessThan(20);
    await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(long.locator('[data-lab-output]')).toHaveText('Loaded 100 of 200');
    await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(long.locator('[data-lab-output]')).toHaveText('Loaded 150 of 200');
    expect(await list.getByRole('row').count()).toBeLessThan(20);
  });

  test('UIC-LIST-ROW-3.1 passes axe in the dark theme', async ({ lab }) => {
    await lab.open('list-row', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
