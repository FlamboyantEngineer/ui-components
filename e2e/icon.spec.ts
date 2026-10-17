import { expect, test } from './fixtures.js';

test.describe('Icon lab', () => {
  test('UIC-ICON-1.1 UIC-ICON-1.2 draws every glyph in three box sizes', async ({ page, lab }) => {
    await lab.open('icon');
    const cells = page.locator('table[data-lab-matrix="glyph size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(30 * 3);
    for (const [size, pixels] of [
      ['sm', 12],
      ['md', 16],
      ['lg', 20],
    ] as const) {
      const box = await page
        .locator(`[data-lab-cell="glyph=close size=${size}"] .ui-icon`)
        .boundingBox();
      expect(box?.width).toBe(pixels);
      expect(box?.height).toBe(pixels);
      const glyph = await page
        .locator(`[data-lab-cell="glyph=close size=${size}"] .ui-icon__glyph`)
        .boundingBox();
      expect(glyph?.width).toBe(pixels);
    }
  });

  test('UIC-ICON-1.3 exposes only labelled icons to assistive technology', async ({
    page,
    lab,
  }) => {
    await lab.open('icon');
    const labelled = page.locator('[data-lab-cell="source=glyph naming=labelled size=md"]');
    await expect(labelled.getByRole('img', { name: 'Information' })).toBeVisible();
    const decorative = page.locator(
      '[data-lab-cell="source=glyph naming=decorative size=md"] .ui-icon',
    );
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await lab.expectAccessible();
  });

  test('UIC-ICON-1.2 renders unstyled without errors', async ({ page, lab }) => {
    await lab.open('icon', { stylesheet: 'none' });
    await expect(page.locator('.ui-icon').first()).toBeVisible();
  });
});
