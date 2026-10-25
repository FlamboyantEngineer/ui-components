import { expect, test } from './fixtures.js';

test.describe('Avatar presence', () => {
  test('UIC-AVATAR-11.1 UIC-AVATAR-11.4 badges the status at every size', async ({ page, lab }) => {
    await lab.open('avatar');
    for (const [size, pixels] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
    ] as const) {
      const cell = page
        .locator('[data-lab-family="avatar-presence-cases"]')
        .locator(`[data-lab-cell="interaction=image status=active size=${size}"]`);
      const avatar = await cell.locator('.ui-avatar__surface').boundingBox();
      const badge = await cell.locator('.ui-avatar__indicator').boundingBox();
      expect(avatar?.width).toBe(pixels);
      expect(badge).not.toBeNull();
      if (avatar && badge) {
        expect(badge.x + badge.width).toBeGreaterThan(avatar.x + avatar.width / 2);
        expect(badge.y + badge.height).toBeGreaterThan(avatar.y + avatar.height / 2);
      }
    }
    await expect(
      page
        .locator('[data-lab-family="avatar-presence-cases"]')
        .locator('[data-lab-cell="interaction=image status=none size=md"] .ui-avatar__indicator'),
    ).toHaveCount(0);
    await expect(
      page
        .locator('[data-lab-family="avatar-presence-cases"]')
        .locator('[data-lab-cell="interaction=image status=idle size=md"] .ui-avatar'),
    ).toHaveAttribute('data-status', 'idle');
  });

  test('UIC-AVATAR-11.3 presses once for a click, Enter, Space or a held key', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const avatar = page
      .locator('[data-lab-family="avatar-presence-cases"]')
      .locator('[data-lab-avatar="counter"]');
    const presses = page
      .locator('[data-lab-family="avatar-presence-cases"]')
      .locator('[data-lab-output="presses"]');
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

  test('UIC-AVATAR-11.2 names each person with their status and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const image = page
      .locator('[data-lab-family="avatar-presence-cases"]')
      .locator('[data-lab-cell="interaction=image status=away size=md"]');
    await expect(image.getByRole('img', { name: 'Maria Santos, Away' })).toBeVisible();
    await expect(image.getByRole('button')).toHaveCount(0);
    const button = page
      .locator('[data-lab-family="avatar-presence-cases"]')
      .locator('[data-lab-cell="interaction=button status=busy size=md"]');
    await expect(button.getByRole('button', { name: 'Maria Santos, Busy' })).toBeVisible();
    await lab.expectAccessible();
    await lab.open('avatar', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-AVATAR-11.6 opens the person card from the keyboard and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const avatar = page
      .locator('[data-lab-family="avatar-presence-cases"]')
      .locator('[data-lab-avatar="card"]');
    await expect(avatar).toHaveClass(/ui-user-card__trigger/);
    await avatar.focus();
    await page.keyboard.press('Enter');
    const card = page.getByRole('dialog', { name: 'Jon Berg' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Away');
    await lab.expectAccessible('.ui-user-card__popover');
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(avatar).toBeFocused();
  });

  test('UIC-AVATAR-11.7 shows the name in a tooltip on hover and keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const image = page
      .locator('[data-lab-family="avatar-presence-cases"]')
      .locator('[data-lab-avatar="tooltip-image"]');
    await expect(image).toHaveAttribute('role', 'img');
    await expect(image).toHaveAccessibleName('Maria Santos, Active');
    await page.mouse.move(5, 5);
    await image.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveText('Maria Santos, Active');
    await page.mouse.move(5, 5);
    await expect(tooltip).toHaveCount(0);

    const button = page
      .locator('[data-lab-family="avatar-presence-cases"]')
      .locator('[data-lab-avatar="tooltip-button"]');
    await image.focus();
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await expect(tooltip).toHaveText('Priya Nair, Away');
    await expect(button).toHaveAccessibleName('Priya Nair, Away');
    await expect(button).toHaveAccessibleDescription('');
    await page.keyboard.press('Shift+Tab');
    await expect(image).toBeFocused();
    await expect(tooltip).toHaveText('Maria Santos, Active');
    await lab.expectAccessible();
  });

  test('UIC-AVATAR-11.8 opens the card on hover without taking focus', async ({ page, lab }) => {
    await page.clock.install();
    await lab.open('avatar');
    await page.clock.pauseAt(Date.now() + 1000);
    const avatar = page
      .locator('[data-lab-family="avatar-presence-cases"]')
      .locator('[data-lab-avatar="hover-card"]');
    await page.mouse.move(5, 5);
    await avatar.hover();
    await page.clock.runFor(599);
    const card = page.getByRole('dialog', { name: 'Sam Okafor' });
    await expect(card).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(card).toContainText('Idle');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(card.locator(':focus')).toHaveCount(0);
    await page.mouse.move(5, 5);
    await page.clock.runFor(1000);
    await expect(card).toHaveCount(0);
    await page.clock.resume();
  });
});
