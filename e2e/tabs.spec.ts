import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function centerOffset(list: Locator, tab: Locator): Promise<number> {
  const listBox = await list.boundingBox();
  const tabBox = await tab.boundingBox();
  if (!listBox || !tabBox) return Number.NaN;
  return Math.abs(tabBox.x + tabBox.width / 2 - (listBox.x + listBox.width / 2));
}

test.describe('Tabs lab', () => {
  test('UIC-TABS-1.1 UIC-TABS-1.4 draws three tab heights in rows and columns', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    for (const [size, height] of [
      ['sm', 30],
      ['md', 36],
      ['lg', 42],
    ] as const) {
      const cell = page.locator(`[data-lab-cell="orientation=horizontal size=${size}"]`);
      const apple = cell.getByRole('tab', { name: 'Apple' });
      expect((await apple.boundingBox())?.height).toBe(height);
      await expect(cell.getByRole('tabpanel')).toHaveText('Apples are crisp.');
    }
    const vertical = page.locator('[data-lab-cell="orientation=vertical size=md"]');
    const tops = await vertical
      .getByRole('tab')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
    expect(tops[1]).toBeGreaterThan(tops[0] ?? 0);
    await expect(vertical.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  });

  test('UIC-TABS-2.1 UIC-TABS-2.5 selects with arrows, Home and End and shows keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const cell = page.locator('[data-lab-cell="orientation=horizontal size=md"]');
    const tab = (name: string) => cell.getByRole('tab', { name });
    await tab('Apple').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tab('Banana')).toBeFocused();
    await expect(tab('Banana')).toHaveAttribute('aria-selected', 'true');
    await expect(tab('Banana')).toHaveAttribute('data-focus-visible', 'true');
    await expect(cell.getByRole('tabpanel')).toHaveText('Bananas are soft.');
    await page.keyboard.press('End');
    await expect(tab('Cherry')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tab('Apple')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(tab('Apple')).toBeFocused();

    const vertical = page.locator('[data-lab-cell="orientation=vertical size=md"]');
    await vertical.getByRole('tab', { name: 'Apple' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(vertical.getByRole('tab', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const manual = page.getByRole('tablist', { name: 'Fruit, manual' });
    await manual.getByRole('tab', { name: 'Apple' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(manual.getByRole('tab', { name: 'Banana' })).toBeFocused();
    await expect(manual.getByRole('tab', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await page.keyboard.press('Enter');
    await expect(manual.getByRole('tab', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('UIC-TABS-1.2 UIC-TABS-2.2 describes counted tabs and skips disabled tabs', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const counts = page.locator('[data-lab-cell="content=counts state=default"]');
    const inbox = counts.getByRole('tab', { name: 'Inbox 9+' });
    await expect(inbox.locator('.ui-tabs__count')).toHaveText('9+');
    await expect(inbox).toHaveAccessibleDescription('15 unread');
    await expect(counts.getByRole('tab', { name: 'Search 3' })).toHaveAccessibleDescription(
      '3 saved',
    );

    const partly = page.locator('[data-lab-cell="content=text state=disabled tab"]');
    await expect(partly.getByRole('tab', { name: 'Search' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await partly.getByRole('tab', { name: 'Inbox' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(partly.getByRole('tab', { name: 'Help' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await partly.getByRole('tab', { name: 'Search' }).click({ force: true });
    await expect(partly.getByRole('tab', { name: 'Help' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('UIC-TABS-1.3 moves the selection indicator to the selected tab', async ({ page, lab }) => {
    await lab.open('tabs');
    const cell = page.locator('[data-lab-cell="orientation=horizontal size=md"]');
    const apple = cell.getByRole('tab', { name: 'Apple' });
    const indicator = apple.locator('.ui-tabs__indicator');
    const tabBox = await apple.boundingBox();
    const barBox = await indicator.boundingBox();
    expect(barBox?.width).toBe(tabBox?.width);
    expect(barBox?.height).toBe(2);
    expect(Math.round((barBox?.y ?? 0) + (barBox?.height ?? 0))).toBe(
      Math.round((tabBox?.y ?? 0) + (tabBox?.height ?? 0) + 1),
    );
    const cherry = cell.getByRole('tab', { name: 'Cherry' });
    await cherry.click();
    await expect(cherry.locator('.ui-tabs__indicator')).toHaveCount(1);
    await expect(cell.locator('.ui-tabs__indicator')).toHaveCount(1);
    await expect
      .poll(async () => (await cherry.locator('.ui-tabs__indicator').boundingBox())?.x)
      .toBe((await cherry.boundingBox())?.x);
  });

  test('UIC-TABS-2.4 centers the selected tab of an overflowing strip and clamps at its end', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const list = page.getByRole('tablist', { name: 'Cities' });
    await expect(list).toHaveAttribute('data-overflowing', 'true');
    await expect(page.getByRole('tablist', { name: 'Fruit, horizontal, md' })).not.toHaveAttribute(
      'data-overflowing',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );

    const middle = list.getByRole('tab', { name: 'Edinburgh castle' });
    await middle.evaluate((node) => node.scrollIntoView({ inline: 'nearest' }));
    await middle.click();
    await expect.poll(() => centerOffset(list, middle)).toBeLessThanOrEqual(1);

    await page.keyboard.press('End');
    const last = list.getByRole('tab', { name: 'Lisbon trams' });
    await expect(last).toHaveAttribute('aria-selected', 'true');
    await expect
      .poll(() => list.evaluate((node) => node.scrollWidth - node.clientWidth - node.scrollLeft))
      .toBeLessThanOrEqual(1);
    const listBox = await list.boundingBox();
    const lastBox = await last.boundingBox();
    expect(
      Math.abs(
        (lastBox?.x ?? 0) + (lastBox?.width ?? 0) - ((listBox?.x ?? 0) + (listBox?.width ?? 0)),
      ),
    ).toBeLessThanOrEqual(1);
  });

  test('UIC-TABS-2.3 navigates link tabs through the provider router', async ({ page, lab }) => {
    await lab.open('tabs');
    const sections = page.getByRole('tablist', { name: 'Sections' });
    const schedule = sections.getByRole('tab', { name: 'Schedule' });
    await expect(schedule).toHaveAttribute('href', '#schedule');
    expect(await schedule.evaluate((node) => node.tagName)).toBe('A');
    const url = page.url();
    await schedule.click();
    await expect(page.getByText('Navigated to #schedule')).toBeVisible();
    await expect(schedule).toHaveAttribute('aria-selected', 'true');
    expect(page.url()).toBe(url);
    await lab.expectAccessible();
  });
});
