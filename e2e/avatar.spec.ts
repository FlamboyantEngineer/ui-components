import { expect, test } from './fixtures.js';

test.describe('Avatar lab', () => {
  test('UIC-AVATAR-1.1 UIC-AVATAR-2.1 draws pictures, initials and group glyphs at every size', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const cells = page.locator('table[data-lab-matrix="content variant size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 2 * 5);
    for (const [size, pixels] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
      ['fill', 48],
    ] as const) {
      for (const content of ['picture', 'initials', 'group']) {
        const cell = page.locator(
          `[data-lab-cell="content=${content} variant=filled size=${size}"]`,
        );
        const box = await cell.locator('.ui-avatar').boundingBox();
        expect(box?.width).toBe(pixels);
        expect(box?.height).toBe(pixels);
      }
    }
    const picture = page.locator('[data-lab-cell="content=picture variant=filled size=md"] img');
    await expect(picture).toHaveClass('ui-avatar__image');
    expect(await picture.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(
      0,
    );
    await expect(
      page.locator(
        '[data-lab-cell="content=initials variant=filled size=md"] .ui-avatar__initials',
      ),
    ).toHaveText('MS');
    await expect(
      page.locator('[data-lab-cell="content=group variant=filled size=md"] .ui-avatar__glyph'),
    ).toBeVisible();
  });

  test('UIC-AVATAR-1.3 UIC-AVATAR-2.2 colours each slot through the stylesheet only', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const fills = new Set<string>();
    for (let slot = 0; slot < 8; slot += 1) {
      const filled = page.locator(`[data-lab-cell="variant=filled slot=${slot}"] .ui-avatar`);
      await expect(filled).toHaveAttribute('data-color', String(slot));
      const fill = await filled
        .locator('.ui-avatar__initials')
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      fills.add(fill);
      const ring = await page
        .locator(`[data-lab-cell="variant=outlined slot=${slot}"] .ui-avatar`)
        .evaluate((node) => getComputedStyle(node).borderTopColor);
      expect(ring).toBe(fill);
    }
    expect(fills.size).toBe(8);
    await expect(
      page.locator('#lab-root .ui-avatar[style], #lab-root .ui-avatar [style]'),
    ).toHaveCount(0);
  });

  test('UIC-AVATAR-1.4 falls back to the initials and tries a new address again', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const avatar = page.locator('[data-lab-avatar="fallback"]');
    await expect(avatar.locator('img')).toBeVisible();
    await page.getByRole('button', { name: 'Break the picture' }).click();
    await expect(page.locator('[data-lab-output="picture"]')).toHaveText('broken');
    await expect(avatar.locator('.ui-avatar__initials')).toHaveText('JB');
    await expect(avatar.locator('img')).toHaveCount(0);
    await page.getByRole('button', { name: 'Restore the picture' }).click();
    await expect(avatar.locator('img')).toBeVisible();
    await expect(avatar).toHaveAccessibleName('Jon Berg');
  });

  test('UIC-AVATAR-1.2 UIC-AVATAR-3.1 names avatars, hides decorative ones and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const derived = page.locator('[data-lab-cell="name=jon de berg source=derived"]');
    await expect(derived.getByRole('img', { name: 'jon de berg' })).toHaveText('JB');
    await expect(
      page.locator('[data-lab-cell="name=(blank) source=derived"]').getByRole('img'),
    ).toHaveAccessibleName('Unnamed');
    await expect(
      page.locator('[data-lab-cell="name=Plato source=explicit initials"] .ui-avatar'),
    ).toHaveText('AI');
    const decorative = page.locator('[data-lab-cell="name=Plato source=decorative"] .ui-avatar');
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).not.toHaveAttribute('role');
    await lab.expectAccessible();
    await lab.open('avatar', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-AVATAR-2.1 renders unstyled without errors', async ({ page, lab }) => {
    await lab.open('avatar', { stylesheet: 'none' });
    await expect(page.locator('.ui-avatar').first()).toBeVisible();
  });
});
