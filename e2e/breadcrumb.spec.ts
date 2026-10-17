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
});
