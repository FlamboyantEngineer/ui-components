import { expect, matrixCell, test } from './fixtures.js';
import { swatchInkCount } from './swatch-ink.js';

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

  test('UIC-COLOR-SWATCH-1.1 shows the checkerboard through a translucent colour only', async ({
    page,
    lab,
  }) => {
    await lab.open('color-swatch');
    for (const size of ['xs', 'md', 'xl']) {
      const swatch = (colour: string) =>
        matrixCell(page, `colour=${colour} size=${size}`).locator('.ui-color-swatch');
      expect(await swatchInkCount(page, swatch('#336699')), size).toBe(1);
      for (const colour of ['#33669980', 'rgba(204, 51, 0, 0.25)', 'rgba(51, 102, 153, 0)']) {
        expect(await swatchInkCount(page, swatch(colour)), `${colour} ${size}`).toBeGreaterThan(1);
      }
      // The colour is drawn over the board, its opacity unchanged.
      await expect(swatch('#33669980')).toHaveCSS('opacity', '1');
      await expect(swatch('#33669980')).toHaveCSS(
        'background-image',
        /^linear-gradient\(rgba\(51, 102, 153, 0\.5\d*\).*conic-gradient/,
      );
    }
    // A fully transparent colour is named as a colour, unlike an empty swatch.
    await expect(
      matrixCell(page, 'colour=rgba(51, 102, 153, 0) size=md').locator('.ui-color-swatch'),
    ).not.toHaveAccessibleName('No color');
    // A picker's items draw it too.
    const picker = page.locator('[data-lab-picker="translucent"]');
    expect(await swatchInkCount(page, picker.locator('.ui-color-swatch').nth(1))).toBeGreaterThan(
      1,
    );
    expect(await swatchInkCount(page, picker.locator('.ui-color-swatch').first())).toBe(1);
    await lab.open('color-swatch', { theme: 'dark' });
    expect(
      await swatchInkCount(
        page,
        matrixCell(page, 'colour=#33669980 size=sm').locator('.ui-color-swatch'),
      ),
    ).toBeGreaterThan(1);
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
  test('UIC-COLOR-SWATCH-3.1 draws the colour as a bar under the glyph', async ({ page, lab }) => {
    await lab.open('color-swatch');
    for (const size of ['sm', 'md', 'lg']) {
      const button = matrixCell(page, `command=text colour=#cc3300 size=${size}`).getByRole(
        'button',
        { name: 'Text color' },
      );
      const icon = await button.locator('.ui-button__icon').boundingBox();
      const glyph = await button.locator('.ui-glyph').boundingBox();
      const bar = button.locator('.ui-color-swatch-button__swatch');
      const box = await bar.boundingBox();
      if (!icon || !glyph || !box) throw new Error(`The ${size} button did not lay out`);
      await expect(bar).toHaveCSS('background-color', 'rgb(204, 51, 0)');
      expect(box.y + box.height).toBeCloseTo(icon.y + icon.height, 0);
      expect(box.width).toBeLessThan(icon.width);
      expect(box.height).toBeGreaterThanOrEqual(2);
      expect(box.height).toBeLessThan(icon.height / 4);
    }
    const empty = matrixCell(page, 'command=fill colour=empty size=md');
    await expect(empty.locator('.ui-color-swatch-button__swatch')).toHaveAttribute(
      'data-empty',
      'true',
    );
    await expect(empty.getByRole('button', { name: 'Fill color' })).toHaveAccessibleDescription(
      'No color',
    );
    await lab.expectAccessible('table[data-lab-matrix="command colour size"]');
  });

  test('UIC-COLOR-SWATCH-3.1 UIC-COLOR-SWATCH-3.2 follows the picked colour and applies it', async ({
    page,
    lab,
  }) => {
    await lab.open('color-swatch');
    const text = page.locator('[data-lab-command="text"]');
    await page
      .locator('[data-lab-picker="text-colour"]')
      .getByRole('option', { name: 'dark grayish cyan blue' })
      .click();
    await expect(text).toHaveAccessibleDescription('dark grayish cyan blue');
    await expect(text.locator('.ui-color-swatch-button__swatch')).toHaveCSS(
      'background-color',
      'rgb(51, 102, 153)',
    );
    await text.click();
    await expect(page.locator('[data-lab-output="applied"]')).toHaveText('text #336699');
    await expect(
      matrixCell(page, 'command=text colour=disabled size=md').getByRole('button'),
    ).toBeDisabled();
  });
});
