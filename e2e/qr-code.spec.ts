import { expect, test } from './fixtures.js';

test.describe('QR Code lab', () => {
  test('UIC-QR-CODE-2.1 UIC-QR-CODE-2.2 draws each level at its version and size', async ({
    page,
    lab,
  }) => {
    await lab.open('qr-code');
    for (const [level, version] of [
      ['low', '4'],
      ['medium', '4'],
      ['quartile', '5'],
      ['high', '7'],
    ] as const) {
      const code = page.locator(`[data-lab-cell="text=sentence level=${level}"] .ui-qr-code`);
      await expect(code).toHaveAttribute('data-error-correction', level);
      await expect(code).toHaveAttribute('data-version', version);
      const modules = Number(version) * 4 + 17 + 8;
      expect((await code.boundingBox())?.width).toBe(modules * 3);
    }
    const wide = page.locator('[data-lab-cell="quietZone=0 moduleSize=4"] .ui-qr-code');
    await expect(wide).toHaveAttribute('viewBox', '0 0 25 25');
    expect((await wide.boundingBox())?.width).toBe(100);
  });

  test('UIC-QR-CODE-1.1 UIC-QR-CODE-3.1 names the code and grows with its text', async ({
    page,
    lab,
  }) => {
    await lab.open('qr-code');
    const code = page.locator('[data-lab-code="editable"]');
    await expect(code).toHaveAccessibleName('QR code: https://example.com/menu');
    await expect(page.locator('[data-lab-output="symbol"]')).toHaveText(
      'version 2, mask 2, 25 × 25',
    );
    const field = page.getByRole('textbox', { name: 'Text to encode' });
    await field.fill('https://example.com/menu/lunch/specials/today');
    await expect(code).toHaveAccessibleName(
      'QR code: https://example.com/menu/lunch/specials/today',
    );
    await expect(code).toHaveAttribute('data-version', '4');
    await expect(page.locator('[data-lab-output="symbol"]')).toContainText('33 × 33');
    await expect(page.getByRole('img', { name: 'Guest Wi-Fi' })).toBeVisible();
    await expect(page.locator('[data-lab-cell="case=version 40"] .ui-qr-code')).toHaveAttribute(
      'data-version',
      '40',
    );
  });

  test('UIC-QR-CODE-2.1 paints dark modules on a light ground and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('qr-code', { theme: 'dark' });
    const code = page.locator('[data-lab-code="editable"]');
    const colours = await code.evaluate((element) => ({
      ground: getComputedStyle(element).backgroundColor,
      modules: getComputedStyle(element.querySelector('path') as Element).fill,
    }));
    // Readers expect dark modules on a light ground, whatever the theme.
    expect(colours).toEqual({ ground: 'rgb(255, 255, 255)', modules: 'rgb(0, 0, 0)' });
    await lab.expectAccessible();
    await lab.open('qr-code');
    await lab.expectAccessible();
  });
});
