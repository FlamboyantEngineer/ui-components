import { expect, test } from './fixtures.js';

test.describe('Navigation Menu lab', () => {
  test('UIC-NAVIGATION-MENU-1.1 UIC-NAVIGATION-MENU-1.3 UIC-NAVIGATION-MENU-2.3 opens on hover, survives the gap and navigates', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-menu');
    const demo = page.locator('[data-lab-demo="site"]');
    const nav = demo.getByRole('navigation', { name: 'Site' });
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    const fruit = nav.getByRole('button', { name: 'Fruit' });
    await fruit.hover();
    await expect(fruit).toHaveAttribute('aria-expanded', 'true');
    // Down through the gap between the trigger and the panel, onto a link.
    const apples = nav.getByRole('link', { name: 'Apples' });
    const from = await fruit.boundingBox();
    const to = await apples.boundingBox();
    if (!from || !to) throw new Error('no boxes');
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    await expect(fruit).toHaveAttribute('aria-expanded', 'true');
    expect(to.y).toBeGreaterThan(from.y + from.height);
    await apples.click();
    await expect(demo.locator('[data-lab-output="route"]')).toHaveText('/fruit/apples');
    await expect(fruit).toHaveAttribute('aria-expanded', 'false');
    await expect(apples).toBeHidden();
    await fruit.hover();
    await expect(nav.getByRole('link', { name: 'Apples' })).toHaveAttribute('aria-current', 'page');
    await lab.expectAccessible();
  });

  test('UIC-NAVIGATION-MENU-2.2 UIC-NAVIGATION-MENU-2.4 opens by keyboard, tabs through and closes on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-menu');
    const nav = page.locator('[data-lab-demo="press"]').getByRole('navigation');
    const fruit = nav.getByRole('button', { name: 'Fruit' });
    await nav.getByRole('link', { name: 'Home' }).focus();
    await page.keyboard.press('Tab');
    await expect(fruit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(fruit).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(nav.getByRole('link', { name: 'Apples' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(fruit).toHaveAttribute('aria-expanded', 'false');
    await expect(fruit).toBeFocused();
    await page.keyboard.press('Space');
    await expect(fruit).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.click(5, 5);
    await expect(fruit).toHaveAttribute('aria-expanded', 'false');
  });

  test('UIC-NAVIGATION-MENU-3.1 sizes the shared box from the open panel', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-menu');
    const nav = page.locator('[data-lab-demo="press"]').getByRole('navigation');
    await nav.getByRole('button', { name: 'Fruit' }).click();
    const panel = nav.getByRole('group', { name: 'Fruit' });
    const box = await panel.boundingBox();
    const width = await nav.evaluate((node) =>
      getComputedStyle(node).getPropertyValue('--ui-navigation-menu-panel-width'),
    );
    expect(Number.parseFloat(width)).toBeCloseTo(box?.width ?? 0, 0);
    await nav.getByRole('button', { name: 'Guides' }).click();
    await expect
      .poll(() =>
        nav.evaluate((node) =>
          getComputedStyle(node).getPropertyValue('--ui-navigation-menu-panel-width'),
        ),
      )
      .not.toBe(width);
  });

  test('UIC-NAVIGATION-MENU-3.2 follows a right-to-left page and a narrow column', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-menu');
    const rtl = page.locator('[data-lab-demo="rtl"]').getByRole('navigation');
    const items = rtl.locator('.ui-navigation-menu__list > li');
    const first = await items.nth(0).boundingBox();
    const second = await items.nth(1).boundingBox();
    expect(first?.x ?? 0).toBeGreaterThan(second?.x ?? 0);
    const narrow = page.locator('[data-lab-demo="narrow"]').getByRole('navigation');
    const fruit = narrow.getByRole('button', { name: 'Fruit' });
    const guides = narrow.getByRole('button', { name: 'Guides' });
    const before = await guides.boundingBox();
    expect(before?.y ?? 0).toBeGreaterThan((await fruit.boundingBox())?.y ?? 0);
    await fruit.click();
    // The panel opens in the flow, so the next item moves down under it.
    await expect
      .poll(async () => (await guides.boundingBox())?.y ?? 0)
      .toBeGreaterThan((before?.y ?? 0) + 40);
  });
});
