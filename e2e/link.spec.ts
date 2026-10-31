import type { Locator } from '@playwright/test';
import { cellSelector, expect, matrixCell, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const style = (locator: Locator, property: string) =>
  locator.evaluate((node, name) => getComputedStyle(node).getPropertyValue(name), property);

test.describe('Link lab', () => {
  test('UIC-LINK-1.2 UIC-LINK-1.3 UIC-LINK-1.4 draws emphasis, placement and underline policy', async ({
    page,
    lab,
  }) => {
    await lab.open('link');
    const link = (placement: string, variant: string, underline: string) =>
      page.locator(
        `${cellSelector(`placement=${placement} variant=${variant} underline=${underline}`)} .ui-link`,
      );
    const inlineAlways = link('inline', 'primary', 'always');
    await expect(inlineAlways).toHaveAttribute('data-underline', 'always');
    await expect(inlineAlways).not.toHaveAttribute('data-standalone');
    expect(await style(inlineAlways, 'text-decoration-line')).toBe('underline');

    const standaloneHover = link('standalone', 'primary', 'hover');
    await expect(standaloneHover).toHaveAttribute('data-standalone', 'true');
    expect(await style(standaloneHover, 'text-decoration-line')).toBe('none');
    await standaloneHover.hover();
    await expect(standaloneHover).toHaveAttribute('data-hovered', 'true');
    await expect.poll(() => style(standaloneHover, 'text-decoration-line')).toBe('underline');

    const none = link('standalone', 'primary', 'none');
    await none.hover();
    await expect(none).toHaveAttribute('data-hovered', 'true');
    expect(await style(none, 'text-decoration-line')).toBe('none');

    const secondary = link('inline', 'secondary', 'always');
    const sentence = page.locator(
      `${cellSelector('placement=inline variant=secondary underline=always')} p`,
    );
    expect(await style(secondary, 'color')).toBe(await style(sentence, 'color'));
    expect(await style(link('inline', 'primary', 'always'), 'color')).not.toBe(
      await style(sentence, 'color'),
    );
    expect(await style(link('inline', 'secondary', 'none'), 'font-weight')).toBe('500');
  });

  test('UIC-LINK-1.1 UIC-LINK-2.1 navigates client-side through the provider', async ({
    page,
    lab,
  }) => {
    await lab.open('link');
    const demo = page.locator('[data-lab-demo="router"]');
    const route = demo.locator('[data-lab-output="route"]');
    const tart = demo.getByRole('link', { name: 'Lemon tart' });
    await expect(tart).toHaveAttribute('href', '#/recipes/lemon-tart');
    const url = page.url();
    await tart.click();
    await expect(route).toHaveText('/recipes/lemon-tart');
    expect(page.url()).toBe(url);
    await demo.getByRole('link', { name: 'Plum crumble' }).focus();
    await page.keyboard.press('Enter');
    await expect(route).toHaveText('/recipes/plum-crumble');
    expect(page.url()).toBe(url);
  });

  test('UIC-LINK-2.2 UIC-LINK-3.1 says a link opens a new tab and opens it safely', async ({
    page,
    lab,
  }) => {
    await lab.open('link');
    const cell = matrixCell(page, 'state=new tab variant=primary');
    const link = cell.getByRole('link', { name: 'Seasonal fruit (opens in a new tab)' });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const icon = link.locator('.ui-link__external-icon');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('data-glyph', 'external-link');
    const label = await link.locator('.ui-link__new-tab-label').boundingBox();
    expect(label?.width ?? 0).toBeLessThanOrEqual(1);
    const box = await link.boundingBox();
    const glyph = await icon.boundingBox();
    expect(requireDefined(glyph).x).toBeGreaterThan(
      requireDefined(box).x + requireDefined(box).width / 2,
    );
    expect(requireDefined(glyph).x + requireDefined(glyph).width).toBeLessThanOrEqual(
      requireDefined(box).x + requireDefined(box).width + 1,
    );
    const prose = page.locator('[data-lab-demo="prose"]').getByRole('link', {
      name: 'seasonal produce guide (opens in a new tab)',
    });
    await expect(prose).toHaveAttribute('target', '_blank');
    await expect(prose).toHaveAttribute('rel', 'nofollow noopener noreferrer');
  });

  test('UIC-LINK-2.3 UIC-LINK-3.2 runs a pressable link with Enter but not Space', async ({
    page,
    lab,
  }) => {
    await lab.open('link');
    const demo = page.locator('[data-lab-demo="press"]');
    const items = demo.getByRole('listitem');
    const more = demo.getByRole('link', { name: 'Show 3 more fruit' });
    expect(await more.evaluate((node) => node.tagName)).toBe('SPAN');
    await expect(more).not.toHaveAttribute('href');
    await page.getByRole('link', { name: 'Plum crumble' }).focus();
    await page.keyboard.press('Tab');
    await expect(more).toBeFocused();
    await expect(more).toHaveAttribute('data-focus-visible', 'true');
    expect(await style(more, 'box-shadow')).not.toBe('none');
    await page.keyboard.press('Space');
    await expect(items).toHaveCount(2);
    await page.keyboard.press('Enter');
    await expect(items).toHaveCount(5);
    await expect(demo.getByRole('link', { name: 'Show fewer fruit' })).toBeFocused();
    await demo.getByRole('link', { name: 'Show fewer fruit' }).click();
    await expect(items).toHaveCount(2);
  });

  test('UIC-LINK-2.4 UIC-LINK-3.3 publishes the current page and refuses disabled links', async ({
    page,
    lab,
  }) => {
    await lab.open('link');
    const current = matrixCell(page, 'state=current variant=primary').locator('.ui-link');
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveAttribute('data-current', 'true');
    await expect(
      page.getByRole('navigation', { name: 'Recipe categories' }).getByRole('link', {
        name: 'Desserts',
      }),
    ).toHaveAttribute('data-current', 'true');

    const disabled = matrixCell(page, 'state=disabled variant=primary').getByRole('link');
    expect(await disabled.evaluate((node) => node.tagName)).toBe('SPAN');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('data-disabled', 'true');
    await expect(disabled).not.toHaveAttribute('href');
    await expect(disabled).not.toHaveAttribute('tabindex');
    const url = page.url();
    await disabled.click({ force: true });
    expect(page.url()).toBe(url);

    const rest = matrixCell(page, 'state=rest variant=primary').getByRole('link');
    await matrixCell(page, 'state=current variant=secondary').getByRole('link').focus();
    await page.keyboard.press('Tab');
    await expect(matrixCell(page, 'state=no href variant=primary').getByRole('link')).toBeFocused();
    await rest.hover();
    await expect(rest).toHaveAttribute('data-hovered', 'true');
    await lab.expectAccessible();
  });
});
