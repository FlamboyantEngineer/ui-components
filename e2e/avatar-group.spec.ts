import { expect, test } from './fixtures.js';

test.describe('Avatar Group lab', () => {
  test('UIC-AVATAR-GROUP-1.1 UIC-AVATAR-GROUP-1.2 overlaps the avatars and counts the rest', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    for (const [size, pixels] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
    ] as const) {
      const cell = page.locator(`[data-lab-cell="variant=filled size=${size}"]`);
      const avatars = cell.locator('.ui-avatar-group__avatar');
      await expect(avatars).toHaveCount(4);
      await expect(cell.locator('.ui-avatar-group__overflow')).toHaveText('+2');
      const first = await avatars.nth(0).boundingBox();
      const second = await avatars.nth(1).boundingBox();
      expect(first?.height).toBe(pixels);
      // Each avatar starts before the previous one ends.
      expect((second?.x ?? 0) - (first?.x ?? 0)).toBeLessThan(pixels);
    }
    const none = page.locator('[data-lab-cell="setup=max 0 action=none"]');
    await expect(none.locator('.ui-avatar-group__avatar')).toHaveCount(0);
    await expect(none.locator('.ui-avatar-group__overflow')).toHaveText('+6');
    const one = page.locator('[data-lab-cell="setup=one person action=none"]');
    await expect(one.locator('.ui-avatar-group__overflow')).toHaveCount(0);
  });

  test('UIC-AVATAR-GROUP-2.1 names the group, the avatars and the overflow', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    const cell = page.locator('[data-lab-cell="setup=max 3 action=none"]');
    const group = cell.getByRole('group');
    await expect(group).toHaveAccessibleName(
      'Maria Santos, Jon Berg, Lena Ortiz, Sam Okafor, Priya Nair, Tom Li',
    );
    await expect(
      group.getByRole('img', { name: '3 more people: Sam Okafor, Priya Nair, Tom Li' }),
    ).toHaveText('+3');
    await expect(group.getByRole('img', { name: 'Jon Berg' })).toBeVisible();
    const names = page.locator('[data-lab-group="names"]');
    await expect(names).toHaveAccessibleName('Reviewers');
    await expect(names.getByRole('img', { name: 'Unnamed' })).toBeVisible();
    await expect(names.locator('.ui-avatar__initials').last()).toHaveText('JB');
  });

  test('UIC-AVATAR-GROUP-2.2 lists everyone from the keyboard and pointer, and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    const group = page.locator('[data-lab-group="list"]');
    await expect(group).toHaveAccessibleName(
      'Maria Santos, Jon Berg, Lena Ortiz, Sam Okafor, Priya Nair, Tom Li',
    );
    const trigger = group.getByRole('button');
    // Styled avatars are boxes, which the name computation pads with spaces.
    await expect(trigger).toHaveAccessibleName(
      /^Maria Santos ?, Jon Berg ?, Lena Ortiz ?, 3 more people: Sam Okafor, Priya Nair, Tom Li$/,
    );
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '6 people' });
    await expect(dialog.locator('.ui-user-identity__name')).toHaveText([
      'Maria Santos',
      'Jon Berg',
      'Lena Ortiz',
      'Sam Okafor',
      'Priya Nair',
      'Tom Li',
    ]);
    await expect(dialog.locator('.ui-avatar-group__item').nth(1)).toContainText('Reviewer');
    await expect(dialog).not.toHaveAttribute('data-entering');
    await lab.expectAccessible('.ui-avatar-group__popover');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog).toHaveCount(0);
    await lab.expectAccessible();
    await lab.open('avatar-group', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
