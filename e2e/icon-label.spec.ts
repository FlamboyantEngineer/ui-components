import { expect, test, matrixCell } from './fixtures.js';

test.describe('Icon Label lab', () => {
  test('UIC-ICON-LABEL-1.2 sizes the icon and gap', async ({ page, lab }) => {
    await lab.open('icon-label');
    for (const [size, icon, gap] of [
      ['sm', 12, 4],
      ['md', 16, 8],
      ['lg', 20, 12],
    ] as const) {
      const cell = matrixCell(page, `icon=glyph size=${size}`);
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
    const wrapped = matrixCell(page, 'option=default size=md').locator('.ui-icon-label__label');
    const truncatedBox = await truncated.boundingBox();
    const wrappedBox = await wrapped.boundingBox();
    expect(truncatedBox?.height).toBeLessThan(wrappedBox?.height ?? 0);
    await expect(truncated).toHaveText(/narrow column$/);
    expect(await truncated.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await lab.expectAccessible();
  });

  test('UIC-ICON-LABEL-1.6 shows a cut label whole in a tooltip', async ({ page, lab }) => {
    await lab.open('icon-label');
    const truncated = page.locator(
      '[data-lab-cell="option=truncate size=md"] .ui-icon-label__label',
    );
    await expect(truncated).toHaveClass(/ui-truncation-tooltip/);
    await truncated.hover();
    await expect(page.getByRole('tooltip')).toHaveText(/narrow column$/);
    await page.mouse.move(0, 0);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(
      matrixCell(page, 'option=default size=md').locator('.ui-icon-label__label'),
    ).not.toHaveClass(/ui-truncation-tooltip/);
  });
  test('UIC-ICON-LABEL-1.3 hides a collapsible label when its own room is narrow', async ({
    page,
    lab,
  }) => {
    await lab.open('icon-label');
    for (const placement of ['alone', 'in a row']) {
      for (const [room, isShown] of [
        ['96px', false],
        ['160px', true],
        ['320px', true],
      ] as const) {
        const cell = matrixCell(page, `placement=${placement} room=${room}`);
        const label = cell.locator('.ui-icon-label__label');
        await expect(label).toHaveText('Collapsible settings');
        const width = (await label.boundingBox())?.width ?? 0;
        expect(width > 1, `${placement} in ${room} shows its text`).toBe(isShown);
      }
    }
  });
});
