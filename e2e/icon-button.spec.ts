import { expect, test } from './fixtures.js';

test.describe('Icon Button lab', () => {
  test('UIC-ICON-BUTTON-1.1 UIC-ICON-BUTTON-1.2 draws named square buttons at four sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('icon-button');
    for (const [size, edge] of [
      ['xs', 22],
      ['sm', 26],
      ['md', 32],
      ['lg', 38],
    ] as const) {
      const button = page
        .locator(`[data-lab-cell="variant=ghost size=${size}"]`)
        .getByRole('button', {
          name: 'More actions',
        });
      const box = await button.boundingBox();
      expect(box?.width).toBe(edge);
      expect(box?.height).toBe(edge);
    }
  });

  test('UIC-ICON-BUTTON-1.3 shows pending and selected states accessibly', async ({
    page,
    lab,
  }) => {
    await lab.open('icon-button');
    await expect(
      page.locator('[data-lab-cell="variant=ghost state=pending"] .ui-icon-button__spinner'),
    ).toBeVisible();
    await expect(
      page.locator('[data-lab-cell="variant=ghost state=selected"] .ui-icon-button'),
    ).toHaveAttribute('aria-pressed', 'true');
    await lab.expectAccessible();
  });
});
