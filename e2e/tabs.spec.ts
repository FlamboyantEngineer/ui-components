import type { Locator } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

async function centerOffset(list: Locator, tab: Locator): Promise<number> {
  const listBox = await list.boundingBox();
  const tabBox = await tab.boundingBox();
  if (!listBox || !tabBox) return Number.NaN;
  return Math.abs(tabBox.x + tabBox.width / 2 - (listBox.x + listBox.width / 2));
}

test.describe('Tabs lab', () => {
  test('UIC-TABS-1.1 UIC-TABS-2.1 keeps typed and whitespace IDs separate', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="typed-tab-keys"]');
    const ids = await demo.getByRole('tab').evaluateAll((tabs) => tabs.map((tab) => tab.id));
    expect(new Set(ids).size).toBe(4);
    for (const [name, value] of [
      ['Text', 'string: "1"'],
      ['Numeric', 'number: 1'],
      ['Compact', 'string: "ab"'],
      ['Spaced', 'string: "a b"'],
    ]) {
      await demo.getByRole('tab', { name }).click();
      await expect(demo.locator('[data-lab-output="selected"]')).toHaveText(`Selected ${value}`);
      await expect(demo.getByRole('tabpanel', { name })).toHaveText(`${name} panel`);
    }
  });

  test('UIC-TABS-2.2 UIC-TABS-2.8 keeps disabled close marks inert as disabled states change', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="disabled-removal"]');
    const output = demo.locator('[data-lab-output="removed"]');
    await demo.getByRole('tab', { name: 'Summer' }).locator('.ui-tabs__remove').click();
    await demo.getByRole('tab', { name: 'Autumn' }).locator('.ui-tabs__remove').click();
    await expect(output).toHaveText('Remove requested: (none)');
    await demo.getByRole('button', { name: 'Toggle disabled tabs' }).click();
    await demo.getByRole('tab', { name: 'Spring' }).locator('.ui-tabs__remove').click();
    await expect(output).toHaveText('Remove requested: (none)');
    await demo.getByRole('button', { name: 'Toggle disabled tabs' }).click();
    await demo.getByRole('tab', { name: 'Spring' }).locator('.ui-tabs__remove').click();
    await expect(output).toHaveText('Remove requested: spring');
  });

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
      const cell = matrixCell(page, `orientation=horizontal size=${size}`);
      const apple = cell.getByRole('tab', { name: 'Apple' });
      expect((await apple.boundingBox())?.height).toBe(height);
      await expect(cell.getByRole('tabpanel')).toHaveText('Apples are crisp.');
    }
    const vertical = matrixCell(page, 'orientation=vertical size=md');
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
    const cell = matrixCell(page, 'orientation=horizontal size=md');
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

    const vertical = matrixCell(page, 'orientation=vertical size=md');
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
    const counts = matrixCell(page, 'content=counts state=default');
    const inbox = counts.getByRole('tab', { name: 'Inbox 9+' });
    await expect(inbox.locator('.ui-tabs__count')).toHaveText('9+');
    await expect(inbox).toHaveAccessibleDescription('15 unread');
    await expect(counts.getByRole('tab', { name: 'Search 3' })).toHaveAccessibleDescription(
      '3 saved',
    );

    const partly = matrixCell(page, 'content=text state=disabled tab');
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
    const cell = matrixCell(page, 'orientation=horizontal size=md');
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

  test('UIC-TABS-2.6 keeps the tabs that fit and lists the others in a menu', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const frame = page.locator('[data-lab-overflow="menu"]');
    const bar = frame.locator('.ui-tabs__bar');
    await expect(bar).toHaveAttribute('data-overflow', 'menu');
    const list = frame.getByRole('tablist', { name: 'Destinations with a menu' });
    await expect(list).toHaveAttribute('data-overflowing', 'true');
    const tabs = list.getByRole('tab');
    const shown = await tabs.count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(10);
    const more = frame.getByRole('button', { name: `${10 - shown} more items` });
    const barBox = await bar.boundingBox();
    const moreBox = await more.boundingBox();
    expect((moreBox?.x ?? 0) + (moreBox?.width ?? 0)).toBeLessThanOrEqual(
      (barBox?.x ?? 0) + (barBox?.width ?? 0) + 0.5,
    );
    await more.click();
    await page.getByRole('menuitem', { name: 'Lisbon trams' }).click();
    const lisbon = list.getByRole('tab', { name: 'Lisbon trams' });
    await expect(lisbon).toHaveAttribute('aria-selected', 'true');
    await expect(frame.getByRole('tabpanel')).toHaveText('Notes on lisbon trams.');
    await lisbon.focus();
    await page.keyboard.press('Home');
    await expect(list.getByRole('tab', { name: 'Amsterdam canals' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(lisbon).toBeFocused();
    await expect(lisbon).toHaveAttribute('aria-selected', 'true');
    await lab.expectAccessible();
  });

  test('UIC-TABS-2.4 scrolls a list without buttons by wheel and trackpad and holds the page', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const scrollY = () => page.evaluate(() => window.scrollY);
    const wheelOver = async (frame: string, x: number, y: number) => {
      const box = await page.locator(`[data-lab-wheel="${frame}"] [role="tablist"]`).boundingBox();
      if (!box) throw new Error(`no ${frame} list`);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(x, y);
    };
    const ltr = page.locator('[data-lab-wheel="ltr"]');
    const list = ltr.getByRole('tablist');
    await ltr.scrollIntoViewIfNeeded();
    await expect(list).toHaveAttribute('data-overflowing', 'true');
    await expect(ltr.locator('.ui-tabs__scroll-button')).toHaveCount(0);
    const left = () => list.evaluate((node) => node.scrollLeft);
    const range = await list.evaluate((node) => node.scrollWidth - node.clientWidth);
    const top = await scrollY();
    await wheelOver('ltr', 0, 120);
    await expect.poll(left).toBe(120);
    await wheelOver('ltr', 60, 0);
    await expect.poll(left).toBe(180);
    for (let step = 0; step < 4; step += 1) await wheelOver('ltr', 0, 1000);
    await expect.poll(left).toBe(range);
    for (let step = 0; step < 4; step += 1) await wheelOver('ltr', 0, -1000);
    await expect.poll(left).toBe(0);
    expect(await scrollY()).toBe(top);

    // Keyboard selection reveals the tab it selects.
    await list.getByRole('tab', { selected: true }).focus();
    await page.keyboard.press('End');
    await expect(list.getByRole('tab').last()).toHaveAttribute('aria-selected', 'true');
    await expect.poll(left).toBe(range);

    const rtl = page.locator('[data-lab-wheel="rtl"]').getByRole('tablist');
    await wheelOver('rtl', 0, 120);
    await expect.poll(() => rtl.evaluate((node) => node.scrollLeft)).toBe(-120);
    expect(await scrollY()).toBe(top);

    const fits = page.locator('[data-lab-wheel="fits"]').getByRole('tablist');
    await expect(fits).not.toHaveAttribute('data-overflowing');
    await wheelOver('fits', 0, 200);
    await expect.poll(scrollY).toBeGreaterThan(top);
  });

  test('UIC-TABS-1.2 renames a tab live from another field and keeps its key, selection and panel', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="live-rename"]');
    const list = demo.getByRole('tablist', { name: 'Pages' });
    const field = demo.getByRole('textbox', { name: 'Selected tab name' });
    await list.getByRole('tab', { name: 'Budget' }).click();
    const tab = list.getByRole('tab', { selected: true });
    const id = await tab.getAttribute('id');
    await demo.getByRole('textbox', { name: 'Draft for Budget' }).fill('Rent and travel');
    await field.fill('');
    await expect(tab).toHaveAccessibleName('Untitled');
    await field.pressSequentially('Costs');
    await expect(field).toBeFocused();
    await expect(tab).toHaveAccessibleName('Costs');
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(await tab.getAttribute('id')).toBe(id);
    await expect(demo.getByRole('textbox', { name: 'Draft for Costs' })).toHaveValue(
      'Rent and travel',
    );
    await expect(demo.locator('[data-lab-output="live-rename"]')).toHaveText('Key page-2: Costs');

    await demo.getByRole('button', { name: 'Use a long name' }).click();
    await expect(list).toHaveAttribute('data-overflowing', 'true');
    await demo.getByRole('button', { name: 'Use a short name' }).click();
    await expect(tab).toHaveAccessibleName('Q3');
    await expect(list).not.toHaveAttribute('data-overflowing');
    await lab.expectAccessible();
  });

  test('UIC-TABS-2.7 pages the list with scroll buttons that stay out of the tab order', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const frame = page.locator('[data-lab-overflow="buttons"]');
    const back = frame.getByRole('button', { name: 'Scroll backward', includeHidden: true });
    const forward = frame.getByRole('button', { name: 'Scroll forward' });
    await expect(back).toBeHidden();
    await expect(forward).toBeVisible();
    const list = frame.getByRole('tablist');
    await forward.click();
    await expect.poll(() => list.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    await expect(back).toBeVisible();
    await frame.getByRole('tab', { selected: true }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(back).not.toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-TABS-2.8 removes tabs by close mark or Delete and adds new ones', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="editable"]');
    const output = demo.locator('[data-lab-output="notes"]');
    const recipes = demo.getByRole('tab', { name: 'Recipes' });
    await expect(recipes).toHaveAttribute('aria-keyshortcuts', 'Delete');
    await recipes.locator('.ui-tabs__remove').click();
    await expect(output).toHaveText('Notes: Groceries, Travel');
    const groceries = demo.getByRole('tab', { name: 'Groceries' });
    await expect(groceries).toHaveAttribute('aria-selected', 'true');
    await groceries.focus();
    await page.keyboard.press('Delete');
    await expect(output).toHaveText('Notes: Travel');
    await expect(demo.getByRole('tab', { name: 'Travel' })).toBeFocused();
    await demo.getByRole('button', { name: 'Add tab' }).click();
    await expect(output).toHaveText('Notes: Travel, Note 2');
    await expect(demo.getByRole('tab', { name: 'Note 2' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await lab.expectAccessible();
  });

  test('UIC-TABS-3.1 UIC-TABS-3.2 renames a tab by double click and F2, refusing a duplicate name', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="meals"]');
    const output = demo.locator('[data-lab-output="meals"]');
    await demo.getByRole('tab', { name: 'Lunch' }).dblclick();
    const field = demo.getByRole('textbox', { name: 'Rename Lunch' });
    await expect(field).toBeFocused();
    await page.keyboard.type('Dinner');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription('There is already a Dinner tab.');
    await lab.expectAccessible();
    await page.keyboard.press('Enter');
    await expect(field).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(output).toHaveText('Tabs: Breakfast, Lunch, Dinner');
    const lunch = demo.getByRole('tab', { name: 'Lunch' });
    await expect(lunch).toBeFocused();
    await page.keyboard.press('F2');
    await page.keyboard.type('Brunch');
    await page.keyboard.press('Enter');
    await expect(output).toHaveText('Tabs: Breakfast, Brunch, Dinner');
    await expect(demo.getByRole('tab', { name: 'Brunch' })).toBeFocused();
  });

  test('UIC-TABS-3.3 UIC-TABS-3.4 UIC-TABS-3.6 reorders tabs by dragging and with Alt+Arrow keys', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="meals"]');
    const output = demo.locator('[data-lab-output="meals"]');
    const dinner = demo.getByRole('tab', { name: 'Dinner' });
    await demo
      .getByRole('tab', { name: 'Breakfast' })
      .dragTo(dinner, { targetPosition: { x: 50, y: 10 } });
    await expect(output).toHaveText('Tabs: Lunch, Dinner, Breakfast');
    await dinner.click();
    await expect(dinner).toHaveAttribute(
      'aria-keyshortcuts',
      'Delete F2 Alt+ArrowLeft Alt+ArrowRight Shift+F10',
    );
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(output).toHaveText('Tabs: Dinner, Lunch, Breakfast');
    await expect(dinner).toBeFocused();
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(output).toHaveText('Tabs: Dinner, Lunch, Breakfast');

    const seasons = page.locator('[data-lab-demo="seasons"]');
    await seasons.getByRole('tab', { name: 'Spring' }).click();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(seasons.locator('[data-lab-output="seasons"]')).toHaveText(
      'Order: Summer, Spring, Autumn, Winter',
    );
    await expect(seasons.getByRole('tab', { name: 'Spring' })).toBeFocused();
  });

  test('UIC-TABS-3.5 opens a tab menu that renames, duplicates, moves and deletes', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="meals"]');
    const output = demo.locator('[data-lab-output="meals"]');
    await demo.getByRole('tab', { name: 'Lunch' }).click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Rename',
      'Duplicate',
      'Move left',
      'Move right',
      'Delete',
    ]);
    await menu.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(output).toHaveText('Tabs: Breakfast, Lunch, Lunch copy, Dinner');
    const breakfast = demo.getByRole('tab', { name: 'Breakfast' });
    await breakfast.click();
    await page.keyboard.press('Shift+F10');
    await expect(menu.getByRole('menuitem', { name: 'Move left' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await menu.getByRole('menuitem', { name: 'Move right' }).click();
    await expect(output).toHaveText('Tabs: Lunch, Breakfast, Lunch copy, Dinner');
    await demo.getByRole('tab', { name: 'Lunch copy' }).click({ button: 'right' });
    await menu.getByRole('menuitem', { name: 'Rename' }).click();
    const field = demo.getByRole('textbox', { name: 'Rename Lunch copy' });
    await expect(field).toBeFocused();
    await page.keyboard.type('Supper');
    await page.keyboard.press('Enter');
    await expect(output).toHaveText('Tabs: Lunch, Breakfast, Supper, Dinner');
    await demo.getByRole('tab', { name: 'Supper' }).click({ button: 'right' });
    await menu.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(output).toHaveText('Tabs: Lunch, Breakfast, Dinner');
    await lab.expectAccessible();
  });

  test('UIC-TABS-3.7 restores the remembered tab when the tabs mount again', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="remembered"]');
    await expect(demo.getByRole('tab', { selected: true })).toHaveText('Summer');
    await demo.getByRole('tab', { name: 'Winter' }).click();
    await demo.getByRole('button', { name: 'Remount' }).click();
    await expect(demo.getByRole('tab', { selected: true })).toHaveText('Winter');
    await page.reload();
    await expect(
      page.locator('[data-lab-demo="remembered"]').getByRole('tab', { selected: true }),
    ).toHaveText('Winter');
  });

  test('UIC-TABS-3.8 ends a rename without renaming when the tabs lock', async ({ page, lab }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="locking"]');
    await demo.getByRole('button', { name: 'Lock in a second' }).click();
    await demo.getByRole('tab', { name: 'Soup' }).focus();
    await page.keyboard.press('F2');
    const field = demo.getByRole('textbox', { name: 'Rename Soup' });
    await expect(field).toBeFocused();
    await page.keyboard.type('Broth');
    await expect(field).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="locking"]')).toHaveText('Last change: none');
    await expect(demo.getByRole('tab', { name: 'Soup' })).toBeVisible();
  });

  test('UIC-TABS-3.9 closes an open tab menu when the tabs lock', async ({ page, lab }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="locking"]');
    await demo.getByRole('button', { name: 'Lock in a second' }).click();
    await demo.getByRole('tab', { name: 'Salad' }).click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(demo.locator('[data-lab-output="locking"]')).toHaveText('Last change: none');
    await expect(demo.getByRole('tab', { name: 'Salad' })).toBeVisible();
  });

  test('UIC-TABS-3.10 keeps a rename draft while the list gains scroll buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-demo="switching"]');
    await demo.getByRole('button', { name: 'Switch scroll buttons in a second' }).click();
    await demo.getByRole('tab', { name: 'Noon' }).focus();
    await page.keyboard.press('F2');
    await page.keyboard.type('Midday');
    const field = demo.getByRole('textbox', { name: 'Rename Noon' });
    await expect(demo.locator('.ui-tabs__bar')).toHaveCount(1);
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('Midday');
    const tabBox = await demo.getByRole('tab', { name: 'Noon' }).boundingBox();
    const fieldBox = await field.locator('..').boundingBox();
    expect(Math.abs((tabBox?.x ?? 0) - (fieldBox?.x ?? -100))).toBeLessThan(2);
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="switching"]')).toHaveText(
      'Times: Morning, Midday, Evening',
    );
  });
});
