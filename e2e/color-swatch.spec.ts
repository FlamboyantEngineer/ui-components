import { expect, test } from './fixtures.js';

test.describe('Color Swatch lab', () => {
  test('UIC-COLOR-SWATCH-1.1 UIC-COLOR-SWATCH-1.3 fills five sizes with the colour', async ({
    page,
    lab,
  }) => {
    await lab.open('color-swatch');
    for (const [size, pixels] of [
      ['xs', 12],
      ['sm', 16],
      ['md', 20],
      ['lg', 24],
      ['xl', 32],
    ] as const) {
      const swatch = page.locator(`[data-lab-cell="colour=#336699 size=${size}"] .ui-color-swatch`);
      const box = await swatch.boundingBox();
      expect(box?.width).toBe(pixels);
      expect(box?.height).toBe(pixels);
      await expect(swatch).toHaveCSS('background-color', 'rgb(51, 102, 153)');
    }
    await expect(page.locator('[data-lab-swatch="named"]')).toHaveAccessibleName(
      'dark grayish cyan blue',
    );
    await expect(page.locator('[data-lab-swatch="given"]')).toHaveAccessibleName('Signal red');
    await lab.expectAccessible();
  });

  test('UIC-COLOR-SWATCH-1.2 draws an empty swatch as a checkerboard named No color', async ({
    page,
    lab,
  }) => {
    await lab.open('color-swatch');
    const empty = page.locator('[data-lab-cell="colour=empty size=lg"] .ui-color-swatch');
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty).toHaveAccessibleName('No color');
    await expect(empty).toHaveCSS('background-image', /conic-gradient/);
  });

  test('UIC-COLOR-SWATCH-1.1 passes axe in the dark theme', async ({ lab }) => {
    await lab.open('color-swatch', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
