import { expect, test, matrixCell } from './fixtures.js';

test.describe('Avatar lab', () => {
  test('UIC-AVATAR-1.1 UIC-AVATAR-2.1 draws pictures, initials and group glyphs at every size', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const cells = page
      .locator('[data-lab-family="avatar-main"]')
      .locator('table[data-lab-matrix="content variant size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 2 * 5);
    for (const [size, pixels] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
      ['fill', 48],
    ] as const) {
      for (const content of ['picture', 'initials', 'group']) {
        const cell = matrixCell(page, `content=${content} variant=filled size=${size}`, {
          family: 'avatar-main',
        });
        const box = await cell.locator('.ui-avatar').boundingBox();
        expect(box?.width).toBe(pixels);
        expect(box?.height).toBe(pixels);
      }
    }
    const picture = matrixCell(page, 'content=picture variant=filled size=md', {
      family: 'avatar-main',
    }).locator('img');
    await expect(picture).toHaveClass('ui-avatar__image');
    expect(await picture.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(
      0,
    );
    await expect(
      matrixCell(page, 'content=initials variant=filled size=md', {
        family: 'avatar-main',
      }).locator('.ui-avatar__initials'),
    ).toHaveText('MS');
    await expect(
      matrixCell(page, 'content=group variant=filled size=md', { family: 'avatar-main' }).locator(
        '.ui-avatar__glyph',
      ),
    ).toBeVisible();
  });

  test('UIC-AVATAR-1.3 UIC-AVATAR-2.2 colours each slot through the stylesheet only', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const fills = new Set<string>();
    for (let slot = 0; slot < 8; slot += 1) {
      const filled = matrixCell(page, `variant=filled slot=${slot}`, {
        family: 'avatar-main',
      }).locator(`.ui-avatar`);
      await expect(filled).toHaveAttribute('data-color', String(slot));
      const fill = await filled
        .locator('.ui-avatar__initials')
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      fills.add(fill);
      const ring = await matrixCell(page, `variant=outlined slot=${slot}`, {
        family: 'avatar-main',
      })
        .locator(`.ui-avatar`)
        .evaluate((node) => getComputedStyle(node).borderTopColor);
      expect(ring).toBe(fill);
    }
    expect(fills.size).toBe(8);
    await expect(
      page.locator(
        '[data-lab-family="avatar-main"] .ui-avatar[style], [data-lab-family="avatar-main"] .ui-avatar [style]',
      ),
    ).toHaveCount(0);
  });

  test('UIC-AVATAR-1.4 falls back to the initials and tries a new address again', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const avatar = page
      .locator('[data-lab-family="avatar-main"]')
      .locator('[data-lab-avatar="fallback"]');
    await expect(avatar.locator('img')).toBeVisible();
    await page.getByRole('button', { name: 'Break the picture' }).click();
    await expect(
      page.locator('[data-lab-family="avatar-main"]').locator('[data-lab-output="picture"]'),
    ).toHaveText('broken');
    await expect(avatar.locator('.ui-avatar__initials')).toHaveText('JB');
    await expect(avatar.locator('img')).toHaveCount(0);
    await page.getByRole('button', { name: 'Restore the picture' }).click();
    await expect(avatar.locator('img')).toBeVisible();
    await expect(avatar).toHaveAccessibleName('Jon Berg');
  });

  test('UIC-AVATAR-1.4 tries a new responsive candidate after the first one fails', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const avatar = page
      .locator('[data-lab-family="avatar-main"]')
      .locator('[data-lab-avatar="candidate"]');
    await expect(avatar.locator('.ui-avatar__initials')).toHaveText('PN');
    await expect(avatar.locator('img')).toHaveCount(0);
    await page.getByRole('button', { name: 'Offer a working candidate' }).click();
    const image = avatar.locator('img');
    await expect(image).toBeVisible();
    await expect(avatar).not.toHaveAttribute('data-loading');
    expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(
      0,
    );
  });

  test('UIC-AVATAR-1.2 UIC-AVATAR-3.1 names avatars, hides decorative ones and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const derived = matrixCell(page, 'name=jon de berg source=derived', { family: 'avatar-main' });
    await expect(derived.getByRole('img', { name: 'jon de berg' })).toHaveText('JB');
    await expect(
      matrixCell(page, 'name=(blank) source=derived', { family: 'avatar-main' }).getByRole('img'),
    ).toHaveAccessibleName('Unnamed');
    await expect(
      matrixCell(page, 'name=Plato source=explicit initials', { family: 'avatar-main' }).locator(
        '.ui-avatar',
      ),
    ).toHaveText('AI');
    const decorative = matrixCell(page, 'name=Plato source=decorative', {
      family: 'avatar-main',
    }).locator('.ui-avatar');
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).not.toHaveAttribute('role');
    await lab.expectAccessible();
    await lab.open('avatar', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-AVATAR-2.3 rounds or squares the corners by shape', async ({ page, lab }) => {
    await lab.open('avatar');
    const radius = async (shape: string, content: string) =>
      matrixCell(page, `shape=${shape} content=${content} variant=filled`, {
        family: 'avatar-main',
      })
        .locator(`.ui-avatar`)
        .evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
    for (const content of ['picture', 'initials', 'group']) {
      expect(await radius('circle', content)).toBe('50%');
      expect(await radius('rounded', content)).toBe('25%');
      expect(await radius('square', content)).toBe('0px');
    }
    await expect(
      matrixCell(page, 'shape=square content=picture variant=filled', {
        family: 'avatar-main',
      }).locator('.ui-avatar'),
    ).toHaveAttribute('data-shape', 'square');
  });

  test('UIC-AVATAR-1.5 UIC-AVATAR-1.6 reports each loading status and keeps picture attributes', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const statuses = page
      .locator('[data-lab-family="avatar-main"]')
      .locator('[data-lab-output="status"]');
    const avatar = page
      .locator('[data-lab-family="avatar-main"]')
      .locator('[data-lab-avatar="status"]');
    await expect(statuses).toHaveText('idle');
    await page.getByRole('button', { name: 'Load a working picture' }).click();
    await expect(statuses).toHaveText('idle, loading, loaded');
    await expect(avatar.locator('img')).toBeVisible();
    await expect(avatar).not.toHaveAttribute('data-loading');
    await page.getByRole('button', { name: 'Load a broken picture' }).click();
    await expect(statuses).toHaveText('idle, loading, loaded, loading, error');
    await expect(avatar.locator('.ui-avatar__initials')).toHaveText('LO');
    await page.getByRole('button', { name: 'Remove the picture' }).click();
    await expect(statuses).toHaveText('idle, loading, loaded, loading, error, idle');

    const picture = page
      .locator('[data-lab-family="avatar-main"]')
      .locator('[data-lab-avatar="attributes"] img');
    await expect(picture).toHaveAttribute('srcset', /1x, data:image\/svg\+xml,.* 2x$/);
    await expect(picture).toHaveAttribute('referrerpolicy', 'no-referrer');
    await expect(picture).toHaveAttribute('crossorigin', 'anonymous');
    await expect(picture).toHaveAttribute('loading', 'lazy');
    await picture.scrollIntoViewIfNeeded();
    await expect
      .poll(() => picture.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  });

  test('UIC-AVATAR-2.1 renders unstyled without errors', async ({ page, lab }) => {
    await lab.open('avatar', { stylesheet: 'none' });
    await expect(
      page.locator('[data-lab-family="avatar-main"]').locator('.ui-avatar').first(),
    ).toBeVisible();
  });
});
