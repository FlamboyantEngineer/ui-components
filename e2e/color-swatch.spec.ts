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

  test('UIC-COLOR-SWATCH-2.1 UIC-COLOR-SWATCH-2.2 picks a swatch with the keyboard and the pointer', async ({
    page,
    lab,
  }) => {
    await lab.open('color-swatch');
    const picker = page.locator('[data-lab-picker="palette"]');
    await expect(picker).toHaveAccessibleName('Palette');
    const options = picker.getByRole('option');
    await expect(options).toHaveCount(7);
    await expect(options.nth(2)).toHaveAttribute('aria-selected', 'true');
    const first = await options.nth(0).boundingBox();
    const second = await options.nth(1).boundingBox();
    expect(second?.y).toBe(first?.y);
    expect(second?.x).toBeGreaterThan((first?.x ?? 0) + (first?.width ?? 0));
    await options.nth(2).focus();
    await page.keyboard.press('ArrowRight');
    await expect(options.nth(3)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="picked"]')).toHaveText('#336699');
    await expect(options.nth(3)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(options.nth(5)).toBeFocused();
    await options.nth(0).click();
    await expect(page.locator('[data-lab-output="picked"]')).toHaveText('#cc3300');
    await options.nth(6).click({ force: true });
    await expect(page.locator('[data-lab-output="picked"]')).toHaveText('#cc3300');
    const stacked = page.locator('[data-lab-cell="layout=stack size=md"] .ui-color-swatch-picker');
    const items = stacked.getByRole('option');
    expect((await items.nth(1).boundingBox())?.y).toBeGreaterThan(
      (await items.nth(0).boundingBox())?.y ?? 0,
    );
    await lab.expectAccessible();
  });

  test('UIC-COLOR-SWATCH-1.1 passes axe in the dark theme', async ({ lab }) => {
    await lab.open('color-swatch', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
