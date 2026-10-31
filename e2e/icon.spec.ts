import { cellSelector, expect, matrixCell, test } from './fixtures.js';

test.describe('Icon lab', () => {
  test('UIC-ICON-1.1 UIC-ICON-1.2 draws every glyph in three box sizes', async ({ page, lab }) => {
    await lab.open('icon');
    const cells = page.locator('table[data-lab-matrix="glyph size"] td[data-lab-cell]');
    const rows = await page.locator('table[data-lab-matrix="glyph size"] tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(26);
    expect(await cells.count()).toBe(rows * 3);
    for (const [size, pixels] of [
      ['sm', 12],
      ['md', 16],
      ['lg', 20],
    ] as const) {
      const box = await matrixCell(page, `glyph=close size=${size}`)
        .locator(`.ui-icon`)
        .boundingBox();
      expect(box?.width).toBe(pixels);
      expect(box?.height).toBe(pixels);
      const glyph = await matrixCell(page, `glyph=close size=${size}`)
        .locator(`.ui-icon__glyph`)
        .boundingBox();
      expect(glyph?.width).toBe(pixels);
    }
  });

  test('UIC-ICON-1.3 exposes only labelled icons to assistive technology', async ({
    page,
    lab,
  }) => {
    await lab.open('icon');
    const labelled = matrixCell(page, 'source=glyph naming=labelled size=md');
    await expect(labelled.getByRole('img', { name: 'Information' })).toBeVisible();
    const decorative = page.locator(
      `${cellSelector('source=glyph naming=decorative size=md')} .ui-icon`,
    );
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await lab.expectAccessible();
  });

  test('UIC-ICON-1.5 sizes an inherited icon from the surrounding font', async ({ page, lab }) => {
    await lab.open('icon');
    for (const fontSize of [12, 16, 24]) {
      const icon = matrixCell(page, `fontSize=${fontSize} glyph=info`).locator(`.ui-icon`);
      await expect(icon).toHaveAttribute('data-size', 'inherit');
      const box = await icon.boundingBox();
      expect(box?.width).toBe(fontSize);
      expect(box?.height).toBe(fontSize);
    }
  });

  test('UIC-ICON-1.2 renders unstyled without errors', async ({ page, lab }) => {
    await lab.open('icon', { stylesheet: 'none' });
    await expect(page.locator('.ui-icon').first()).toBeVisible();
  });
});
