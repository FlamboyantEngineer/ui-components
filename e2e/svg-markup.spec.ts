import { expect, test } from './fixtures.js';

test.describe('SVG Markup lab', () => {
  test('UIC-SVG-MARKUP-2.1 UIC-SVG-MARKUP-2.2 draws each source alone and fills every icon size', async ({
    page,
    lab,
  }) => {
    await lab.open('svg-markup');
    const cells = page.locator('table[data-lab-matrix="markup placement"] td[data-lab-cell]');
    expect(await cells.count()).toBe(16);
    for (const markup of ['outline', 'solid', 'multi-path', 'gradient']) {
      const alone = page.locator(`[data-lab-cell="markup=${markup} placement=standalone"] svg`);
      await expect(alone).toHaveClass('ui-svg-markup');
      await expect(alone).toHaveAttribute('viewBox', '0 0 24 24');
      const box = await alone.boundingBox();
      expect(box?.width).toBe(24);
      expect(box?.height).toBe(24);
      for (const [size, pixels] of [
        ['sm', 12],
        ['md', 16],
        ['lg', 20],
      ] as const) {
        const svg = page.locator(
          `[data-lab-cell="markup=${markup} placement=icon ${size}"] .ui-icon > .ui-svg-markup`,
        );
        expect((await svg.boundingBox())?.width).toBe(pixels);
      }
    }
    const stop = page.locator(
      '[data-lab-cell="markup=gradient placement=standalone"] linearGradient stop',
    );
    await expect(stop.first()).toHaveAttribute('stop-color', '#f59e0b');
    const circle = page.locator('[data-lab-cell="markup=gradient placement=standalone"] circle');
    await expect(circle).toHaveAttribute('fill', /^url\(#sunrise-/);
  });

  test('UIC-SVG-MARKUP-2.3 exposes only labelled drawings', async ({ page, lab }) => {
    await lab.open('svg-markup');
    const alone = page.locator('[data-lab-cell="naming=labelled placement=standalone"]');
    await expect(alone.getByRole('img', { name: 'Add city' })).toHaveClass('ui-svg-markup');
    const icon = page.locator('[data-lab-cell="naming=labelled placement=icon"]');
    await expect(icon.getByRole('img', { name: 'Add city' })).toHaveClass('ui-icon');
    await expect(icon.locator('.ui-svg-markup')).toHaveAttribute('aria-hidden', 'true');
    await expect(
      page.locator('[data-lab-cell="naming=decorative placement=standalone"] svg'),
    ).toHaveAttribute('aria-hidden', 'true');
    await lab.expectAccessible();
  });

  test('UIC-SVG-MARKUP-1.2 UIC-SVG-MARKUP-2.4 drops unsafe content and renders nothing without a drawing', async ({
    page,
    lab,
  }) => {
    await lab.open('svg-markup');
    const sanitised = page.getByRole('img', { name: 'Sanitised square' });
    await expect(sanitised.locator('rect')).toHaveCount(1);
    await expect(sanitised.locator('script')).toHaveCount(0);
    await expect(sanitised).not.toHaveAttribute('onload');
    await expect(sanitised.locator('a')).not.toHaveAttribute('href');
    expect(await page.evaluate(() => 'unsafe' in window)).toBe(false);
    await expect(page.locator('[data-lab-missing] svg')).toHaveCount(0);
  });
});
