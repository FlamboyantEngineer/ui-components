import { expect, test } from './fixtures.js';

test.describe('Presence Avatar lab', () => {
  test('UIC-PRESENCE-AVATAR-1.1 UIC-PRESENCE-AVATAR-1.4 badges the status at every size', async ({
    page,
    lab,
  }) => {
    await lab.open('presence-avatar');
    for (const [size, pixels] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
    ] as const) {
      const cell = page.locator(`[data-lab-cell="interaction=image status=active size=${size}"]`);
      const avatar = await cell.locator('.ui-presence-avatar__avatar').boundingBox();
      const badge = await cell.locator('.ui-presence-avatar__indicator').boundingBox();
      expect(avatar?.width).toBe(pixels);
      expect(badge).not.toBeNull();
      if (avatar && badge) {
        expect(badge.x + badge.width).toBeGreaterThan(avatar.x + avatar.width / 2);
        expect(badge.y + badge.height).toBeGreaterThan(avatar.y + avatar.height / 2);
      }
    }
    await expect(
      page.locator(
        '[data-lab-cell="interaction=image status=none size=md"] .ui-presence-avatar__indicator',
      ),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-lab-cell="interaction=image status=idle size=md"] .ui-presence-avatar'),
    ).toHaveAttribute('data-status', 'idle');
  });

  test('UIC-PRESENCE-AVATAR-1.3 presses once for a click, Enter, Space or a held key', async ({
    page,
    lab,
  }) => {
    await lab.open('presence-avatar');
    const avatar = page.locator('[data-lab-avatar="counter"]');
    const presses = page.locator('[data-lab-output="presses"]');
    await avatar.click();
    await expect(presses).toHaveText('1');
    await expect(avatar).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(presses).toHaveText('2');
    await page.keyboard.press(' ');
    await expect(presses).toHaveText('3');
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await expect(presses).toHaveText('4');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(avatar).toHaveAttribute('data-focus-visible', 'true');
  });

  test('UIC-PRESENCE-AVATAR-1.2 names each person with their status and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('presence-avatar');
    const image = page.locator('[data-lab-cell="interaction=image status=away size=md"]');
    await expect(image.getByRole('img', { name: 'Maria Santos, Away' })).toBeVisible();
    await expect(image.getByRole('button')).toHaveCount(0);
    const button = page.locator('[data-lab-cell="interaction=button status=busy size=md"]');
    await expect(button.getByRole('button', { name: 'Maria Santos, Busy' })).toBeVisible();
    await lab.expectAccessible();
    await lab.open('presence-avatar', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
