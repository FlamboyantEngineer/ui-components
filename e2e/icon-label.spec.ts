import { expect, test } from './fixtures.js';

test.describe('Icon Label lab', () => {
  test('UIC-ICON-LABEL-1.2 sizes the icon and gap', async ({ page, lab }) => {
    await lab.open('icon-label');
    for (const [size, icon, gap] of [
      ['sm', 12, 4],
      ['md', 16, 8],
      ['lg', 20, 12],
    ] as const) {
      const cell = page.locator(`[data-lab-cell="icon=glyph size=${size}"]`);
      const iconBox = await cell.locator('.ui-icon-label__icon').boundingBox();
      const labelBox = await cell.locator('.ui-icon-label__label').boundingBox();
      expect(iconBox?.width).toBe(icon);
      expect(Math.round((labelBox?.x ?? 0) - ((iconBox?.x ?? 0) + (iconBox?.width ?? 0)))).toBe(
        gap,
      );
    }
  });

  test('UIC-ICON-LABEL-1.1 UIC-ICON-LABEL-1.3 truncates on one line and keeps the full text', async ({
    page,
    lab,
  }) => {
    await lab.open('icon-label');
    const truncated = page.locator(
      '[data-lab-cell="option=truncate size=md"] .ui-icon-label__label',
    );
    const wrapped = page.locator('[data-lab-cell="option=default size=md"] .ui-icon-label__label');
    const truncatedBox = await truncated.boundingBox();
    const wrappedBox = await wrapped.boundingBox();
    expect(truncatedBox?.height).toBeLessThan(wrappedBox?.height ?? 0);
    await expect(truncated).toHaveText(/narrow column$/);
    expect(await truncated.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await lab.expectAccessible();
  });
});
