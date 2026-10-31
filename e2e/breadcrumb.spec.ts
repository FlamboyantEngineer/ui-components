import { expect, test } from './fixtures.js';

test.describe('Breadcrumb lab', () => {
  test('UIC-BREADCRUMB-1.5 draws four type scales', async ({ page, lab }) => {
    await lab.open('breadcrumb');
    for (const [size, line, font] of [
      ['xs', 16, '11px'],
      ['sm', 20, '12px'],
      ['md', 24, '13px'],
      ['lg', 28, '14px'],
    ] as const) {
      const nav = page.getByRole('navigation', { name: `Trail, four crumbs, ${size}` });
      expect((await nav.boundingBox())?.height).toBe(line);
      await expect(nav).toHaveCSS('font-size', font);
    }
  });

  test('UIC-BREADCRUMB-1.1 UIC-BREADCRUMB-1.2 UIC-BREADCRUMB-1.4 renders links, separators and the current crumb', async ({
    page,
    lab,
  }) => {
    await lab.open('breadcrumb');
    const nav = page.getByRole('navigation', { name: 'Trail, four crumbs, md' });
    await expect(nav.getByRole('listitem')).toHaveCount(4);
    await expect(nav.locator('a')).toHaveText(['Home', 'Recipes', 'Desserts']);
    const current = nav.locator('[aria-current="page"]');
    await expect(current).toHaveText('Lemon tart');
    expect(await current.evaluate((node) => node.tagName)).toBe('SPAN');
    const separators = nav.locator('.ui-breadcrumb__separator');
    await expect(separators).toHaveCount(3);
    await expect(separators.first()).toHaveAttribute('aria-hidden', 'true');
    await expect(
      page
        .getByRole('navigation', { name: 'Trail, one crumb, md' })
        .locator('.ui-breadcrumb__separator'),
    ).toHaveCount(0);
  });

  test('UIC-BREADCRUMB-2.2 UIC-BREADCRUMB-2.4 moves focus with arrows, Home and End, skipping the current crumb', async ({
    page,
    lab,
  }) => {
    await lab.open('breadcrumb');
    const nav = page.getByRole('navigation', { name: 'Trail, four crumbs, md' });
    const link = (name: string) => nav.getByRole('link', { name, exact: true });
    await link('Home').focus();
    await page.keyboard.press('ArrowRight');
    await expect(link('Recipes')).toBeFocused();
    await expect(link('Recipes')).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(link('Desserts')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(link('Home')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(link('Home')).toBeFocused();
    await page.keyboard.press('End');
    await expect(link('Desserts')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await nav.evaluate((node) => node.contains(document.activeElement))).toBe(false);

    const withText = page.getByRole('navigation', { name: 'Trail, crumb without link, md' });
    await withText.getByRole('link', { name: 'Home' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(withText.getByRole('link', { name: 'Archive' })).toBeFocused();
    await link('Recipes').hover();
    await expect(link('Recipes')).toHaveAttribute('data-hovered', 'true');
  });

  test('UIC-BREADCRUMB-1.5 ellipsizes labels only when the row lacks width', async ({
    page,
    lab,
  }) => {
    await lab.open('breadcrumb');
    const clipped = (name: string) =>
      page
        .getByRole('navigation', { name })
        .locator('[aria-current="page"] .ui-breadcrumb__label')
        .evaluate((node) => node.scrollWidth > node.clientWidth);
    expect(await clipped('Long trail, default, auto')).toBe(false);
    expect(await clipped('Long trail, default, 240px')).toBe(true);
    const narrow = page.getByRole('navigation', { name: 'Long trail, default, 240px' });
    expect((await narrow.boundingBox())?.width).toBeLessThanOrEqual(240);
    await expect(narrow.locator('[aria-current="page"]')).toHaveText(
      'Tables, figures and captions for the printed edition',
    );
  });

  test('UIC-BREADCRUMB-1.3 UIC-BREADCRUMB-2.1 routes links through the provider and reports actions', async ({
    page,
    lab,
  }) => {
    await lab.open('breadcrumb');
    const routed = page.getByRole('navigation', { name: 'Routed trail' });
    const recipes = routed.getByRole('link', { name: 'Recipes' });
    await expect(recipes).toHaveAttribute('data-lab-routed', '');
    const url = page.url();
    await recipes.click();
    await expect(page.getByText('Navigated to /recipes')).toBeVisible();
    expect(page.url()).toBe(url);

    const actions = page.getByRole('navigation', { name: 'Trail with actions' });
    await actions.getByRole('link', { name: 'Recipes' }).click();
    await expect(page.getByText('Activated recipes')).toBeVisible();
    await actions.getByRole('link', { name: 'Home' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Activated home')).toBeVisible();
    await lab.expectAccessible();
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-BREADCRUMB-2.5 shows a cut label whole in a tooltip on hover and keyboard focus in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      const current = 'Tables, figures and captions for the printed edition';
      const seasonal = 'Seasonal recipes from the coast';
      await lab.open('breadcrumb', { theme });
      const label = (name: string, text: string) =>
        page
          .getByRole('navigation', { name })
          .locator('.ui-breadcrumb__label')
          .filter({ hasText: text });

      await label('Long trail, default, auto', current).hover();
      await page.waitForTimeout(800);
      await expect(page.getByRole('tooltip')).toHaveCount(0);

      await label('Long trail, default, 240px', current).hover();
      const panel = page.getByRole('tooltip');
      await expect(panel).toHaveText(current);
      await expect(panel).toHaveClass(/ui-truncation-tooltip__panel/);
      await lab.expectAccessible();
      await page.mouse.move(0, 0);
      await expect(panel).toHaveCount(0);

      const narrow = page.getByRole('navigation', { name: 'Long trail, default, 240px' });
      await narrow.getByRole('link', { name: 'Home' }).focus();
      await expect(page.getByRole('tooltip')).toHaveText('Home');
      await page.keyboard.press('ArrowRight');
      const link = narrow.getByRole('link', { name: seasonal });
      await expect(link).toBeFocused();
      // The previous crumb's panel may still be fading out.
      await expect(page.getByRole('tooltip', { name: seasonal })).toBeVisible();
      await expect(link).not.toHaveAttribute('aria-describedby');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('tooltip')).toHaveCount(0);
    });
  }

  test('UIC-BREADCRUMB-1.7 keeps the first and current crumbs and collapses the middle ones', async ({
    page,
    lab,
  }) => {
    await lab.open('breadcrumb');
    const trail = (width: string) => page.getByRole('navigation', { name: `Deep trail, ${width}` });
    const crumbs = (width: string) =>
      trail(width).locator('.ui-breadcrumb__item:not(.ui-breadcrumb__overflow)');
    await expect(crumbs('wide')).toHaveCount(6);
    await expect(trail('wide').locator('.ui-breadcrumb__overflow')).toHaveCount(0);
    for (const width of ['medium', 'narrow']) {
      const shown = await crumbs(width).allTextContents();
      expect(shown.length).toBeLessThan(6);
      expect(shown[0]).toBe('Home');
      expect(shown.at(-1)).toBe('Lemon tart');
      const items = trail(width).locator('.ui-breadcrumb__item');
      await expect(items.nth(1)).toHaveClass(/ui-breadcrumb__overflow/);
      const list = await trail(width).locator('.ui-breadcrumb__list').boundingBox();
      const last = await items.last().boundingBox();
      expect((last?.x ?? 0) + (last?.width ?? 0)).toBeLessThanOrEqual(
        (list?.x ?? 0) + (list?.width ?? 0) + 0.5,
      );
    }
    const medium = trail('medium');
    const hidden = 6 - (await crumbs('medium').count());
    await medium.getByRole('button', { name: `${hidden} more items` }).click();
    await expect(page.getByRole('menuitem', { name: 'Recipes' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Recipes' }).click();
    await expect(page).toHaveURL(/#recipes$/);
    await lab.expectAccessible();
  });

  test('UIC-BREADCRUMB-1.7 keeps the first and current crumbs, shrunk, in a trail narrower than them', async ({
    page,
    lab,
  }) => {
    await lab.open('breadcrumb');
    for (const state of ['default', 'disabled', 'right to left']) {
      const trail = page.getByRole('navigation', { name: `Tiny trail, ${state}` });
      const crumbs = trail.locator('.ui-breadcrumb__item:not(.ui-breadcrumb__overflow)');
      await expect(crumbs).toHaveText(['Home', 'Lemon tart']);
      await expect(trail).toHaveAttribute('data-collapsed', 'true');
      await expect(trail.locator('[aria-current="page"]')).toHaveText('Lemon tart');
      const list = await trail.locator('.ui-breadcrumb__list').boundingBox();
      for (const label of await crumbs.locator('.ui-breadcrumb__label').all()) {
        const box = await label.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThan(0);
        expect(box?.x ?? 0).toBeGreaterThanOrEqual((list?.x ?? 0) - 0.5);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
          (list?.x ?? 0) + (list?.width ?? 0) + 0.5,
        );
      }
    }
    const trail = page.getByRole('navigation', { name: 'Tiny trail, default' });
    await trail.getByRole('button', { name: '4 more items' }).click();
    await expect(page.getByRole('menuitem')).toHaveText([
      'Recipes',
      'Desserts',
      'Tarts and pies',
      'Citrus',
    ]);
    await page.getByRole('menuitem', { name: 'Citrus' }).click();
    await expect(page).toHaveURL(/#citrus$/);

    // Widening shows the middle crumbs again at their natural width; narrowing collapses them.
    const frame = trail.locator('xpath=..');
    await frame.evaluate((element: HTMLElement) => (element.style.width = '560px'));
    await expect(trail.locator('.ui-breadcrumb__overflow')).toHaveCount(0);
    await expect(trail).not.toHaveAttribute('data-collapsed');
    await frame.evaluate((element: HTMLElement) => (element.style.width = '120px'));
    await expect(trail).toHaveAttribute('data-collapsed', 'true');
    await expect(trail.locator('.ui-breadcrumb__item:not(.ui-breadcrumb__overflow)')).toHaveText([
      'Home',
      'Lemon tart',
    ]);
    await lab.expectAccessible();
  });

  test('UIC-BREADCRUMB-1.8 opens the places beside a crumb from the button after it', async ({
    page,
    lab,
  }) => {
    await lab.open('breadcrumb');
    const demo = page.locator('[data-lab-demo="siblings"]');
    const button = demo.getByRole('button', { name: 'Places beside Recipes' });
    await demo.getByRole('link', { name: 'Home' }).focus();
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('link', { name: 'Recipes' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Menus' }).click();
    await expect(demo.locator('[data-lab-output="sibling"]')).toHaveText('Picked Menus');
    await expect(button).toBeFocused();
    await lab.expectAccessible();
  });
  test('UIC-BREADCRUMB-1.7 UIC-OVERFLOW-LIST-1.7 keeps a focused crumb as the trail starts and stops collapsing', async ({
    page,
    lab,
  }) => {
    await lab.open('breadcrumb');
    const demo = page.locator('[data-lab-trail="growing"]');
    const home = demo.getByRole('link', { name: 'Home' });
    await home.focus();
    const element = await home.elementHandle();
    const deeper = demo.getByRole('checkbox', { name: 'One level deeper' });
    // Click without moving focus, as a route change would.
    for (const checked of [true, false]) {
      await deeper.evaluate((node) => (node as HTMLInputElement).click());
      await expect(deeper).toBeChecked({ checked });
      await expect(demo.getByRole('listitem')).toHaveCount(checked ? 3 : 2);
      expect(
        await element?.evaluate((node) => node.isConnected && node === document.activeElement),
      ).toBe(true);
    }
  });
});
