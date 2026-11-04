import { controlHeight, expect, matrixCell, test } from './fixtures.js';

test.describe('Pin Input lab sizes', () => {
  test('UIC-PIN-INPUT-1.1 UIC-PIN-INPUT-1.4 draws each size in each state', async ({
    page,
    lab,
  }) => {
    await lab.open('pin-input');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const cells = matrixCell(page, `size=${size} state=filled`).locator('.ui-pin-input__cell');
      await expect(cells).toHaveCount(4);
      expect((await cells.first().boundingBox())?.height).toBe(
        (await controlHeight(page, size)) + 8,
      );
    }
    const masked = matrixCell(page, 'size=md state=masked').locator('.ui-pin-input__cell');
    await expect(masked.first()).toHaveAttribute('type', 'password');
    await expect(
      matrixCell(page, 'size=md state=invalid').locator('.ui-pin-input__cell').first(),
    ).toHaveAttribute('aria-invalid', 'true');
    await expect(
      matrixCell(page, 'size=md state=disabled').locator('.ui-pin-input__cell').first(),
    ).toBeDisabled();
    const narrow = page.locator('[data-lab-demo="narrow-pin"]');
    const frame = await narrow.boundingBox();
    const label = await narrow.locator('.ui-field__label').boundingBox();
    expect(label && frame && label.x + label.width <= frame.x + frame.width + 1).toBe(true);
  });
});
