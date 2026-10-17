import { expect, test } from './fixtures.js';

test.describe('User Identity lab', () => {
  test('UIC-USER-IDENTITY-1.3 sizes the avatar with the row', async ({ page, lab }) => {
    await lab.open('user-identity');
    for (const [size, pixels] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
    ] as const) {
      const avatar = page.locator(
        `[data-lab-cell="kind=initials content=name only size=${size}"] .ui-user-identity__avatar`,
      );
      expect((await avatar.boundingBox())?.width).toBe(pixels);
    }
  });

  test('UIC-USER-IDENTITY-1.1 UIC-USER-IDENTITY-1.3 truncates each line independently and keeps the text', async ({
    page,
    lab,
  }) => {
    await lab.open('user-identity');
    const long = page.locator('[data-lab-cell="text=long size=md"]');
    const name = long.locator('.ui-user-identity__name');
    const description = long.locator('.ui-user-identity__description');
    await expect(name).toHaveText('Maria Fernanda Santos de Oliveira');
    await expect(description).toHaveText('maria.fernanda.santos@example.com');
    for (const line of [name, description]) {
      expect(await line.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    }
    const nameBox = await name.boundingBox();
    const descriptionBox = await description.boundingBox();
    expect(descriptionBox?.y).toBeGreaterThan(nameBox?.y ?? 0);
    expect((await long.locator('.ui-user-identity').boundingBox())?.width).toBeLessThanOrEqual(160);
    const short = page.locator('[data-lab-cell="text=short size=md"] .ui-user-identity__name');
    expect(await short.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(false);
  });

  test('UIC-USER-IDENTITY-1.5 adds no tab stop and passes axe', async ({ page, lab }) => {
    await lab.open('user-identity');
    await expect(
      page.locator('#lab-root .ui-user-identity :is([tabindex], [role], button, a)'),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Break the picture' }).click();
    await expect(page.locator('[data-lab-identity="fallback"] .ui-avatar__initials')).toHaveText(
      'JB',
    );
    await lab.expectAccessible();
    await lab.open('user-identity', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
