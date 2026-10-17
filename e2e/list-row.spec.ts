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
});
