import { expect, test, matrixCell } from './fixtures.js';

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
      const swatch = matrixCell(page, `colour=#336699 size=${size}`).locator(`.ui-color-swatch`);
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
    const empty = matrixCell(page, 'colour=empty size=lg').locator('.ui-color-swatch');
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
    const stacked = matrixCell(page, 'layout=stack size=md').locator('.ui-color-swatch-picker');
    const items = stacked.getByRole('option');
    expect((await items.nth(1).boundingBox())?.y).toBeGreaterThan(
      (await items.nth(0).boundingBox())?.y ?? 0,
    );
    await lab.expectAccessible();
  });

  test('UIC-COLOR-SWATCH-2.4 UIC-COLOR-SWATCH-2.5 keeps a controlled value and picks equal colours together', async ({
    page,
    lab,
  }) => {
    await lab.open('color-swatch');
    const picker = page.locator('[data-lab-picker="controlled"]');
    const selected = picker.locator('[role="option"][aria-selected="true"]');
    await expect(selected).toHaveCount(1);
    await page.getByRole('button', { name: 'Set red' }).click();
    await expect(selected).toHaveCount(3);
    await page.getByRole('button', { name: 'Set unreadable' }).click();
    await expect(selected).toHaveCount(0);
    await picker.getByRole('option', { name: 'Red, hsl(15, 100%, 40%)' }).click();
    await expect(page.locator('[data-lab-output="reported"]')).toHaveText('hsl(15, 100%, 40%)');
    await expect(selected).toHaveCount(3);
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(selected).toHaveCount(0);
  });

  test('UIC-COLOR-SWATCH-1.1 passes axe in the dark theme', async ({ lab }) => {
    await lab.open('color-swatch', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
