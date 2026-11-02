import type { Locator } from '@playwright/test';
import { expect, matrix, matrixCell, test } from './fixtures.js';

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
      const cell = matrixCell(page, `variant=filled size=${size}`, { family: 'avatar-group-main' });
      const avatars = cell.locator('.ui-avatar-group__avatar');
      await expect(avatars).toHaveCount(4);
      await expect(cell.locator('.ui-avatar-group__overflow')).toHaveText('+2');
      const first = await avatars.nth(0).boundingBox();
      const second = await avatars.nth(1).boundingBox();
      expect(first?.height).toBe(pixels);
      // Each avatar starts before the previous one ends.
      expect((second?.x ?? 0) - (first?.x ?? 0)).toBeLessThan(pixels);
    }
    const none = matrixCell(page, 'setup=max 0 action=none', { family: 'avatar-group-main' });
    await expect(none.locator('.ui-avatar-group__avatar')).toHaveCount(0);
    await expect(none.locator('.ui-avatar-group__overflow')).toHaveText('+6');
    const one = matrixCell(page, 'setup=one person action=none', { family: 'avatar-group-main' });
    await expect(one.locator('.ui-avatar-group__overflow')).toHaveCount(0);
  });

  test('UIC-AVATAR-GROUP-2.1 names the group, the avatars and the overflow', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    const cell = matrixCell(page, 'setup=max 3 action=none', { family: 'avatar-group-main' });
    const group = cell.getByRole('group');
    await expect(group).toHaveAccessibleName(
      'Maria Santos, Jon Berg, Lena Ortiz, Sam Okafor, Priya Nair, Tom Li',
    );
    await expect(
      group.getByRole('img', { name: '3 more people: Sam Okafor, Priya Nair, Tom Li' }),
    ).toHaveText('+3');
    await expect(group.getByRole('img', { name: 'Jon Berg' })).toBeVisible();
    const names = matrix(page, 'avatar-group-main').locator('[data-lab-group="names"]');
    await expect(names).toHaveAccessibleName('Reviewers');
    await expect(names.getByRole('img', { name: 'Unnamed' })).toBeVisible();
    await expect(names.locator('.ui-avatar__initials').last()).toHaveText('JB');
  });

  test('UIC-AVATAR-GROUP-2.2 lists everyone from the keyboard and pointer, and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    const group = matrix(page, 'avatar-group-main').locator('[data-lab-group="list"]');
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
  });
});

test('UIC-AVATAR-GROUP-1.1 carries identity overrides and the palette size into the menu and the list', async ({
  page,
  lab,
}) => {
  await lab.open('avatar-group');
  const demo = page.locator('[data-lab-demo="group-identity"]');
  const expected = async () =>
    Object.fromEntries(
      (await demo.locator('[data-lab-output="slots"] li').allInnerTexts()).map((text) => {
        const [name, slot] = text.split(': ');
        return [name, slot];
      }),
    );
  const checkAvatars = async (scope: Locator) => {
    const slots = await expected();
    const avatars = scope.locator('.ui-avatar');
    const count = await avatars.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const avatar = avatars.nth(index);
      const name = (await avatar.getAttribute('aria-label'))?.split(',')[0] ?? '';
      const slot = slots[name];
      if (slot !== undefined && slot !== 'undefined')
        await expect(avatar, name).toHaveAttribute('data-color', slot);
    }
  };

  await demo.getByRole('textbox', { name: "First person's name" }).fill('Maria Ortega');
  await demo.getByRole('button', { name: 'Reverse the order' }).click();
  const menuGroup = demo.locator('[data-lab-group="identity-menu"]');
  await checkAvatars(menuGroup);
  await menuGroup.getByRole('button', { name: /more people/ }).click();
  const menu = page.getByRole('menu', { name: /more people/ });
  await expect(menu.getByRole('menuitem')).toHaveCount(3);
  await checkAvatars(menu);
  await expect(menu.locator('.ui-avatar[data-shape="square"]')).toHaveCount(1);
  await page.keyboard.press('Escape');

  await demo.locator('[data-lab-group="identity-list"]').getByRole('button').click();
  const dialog = page.getByRole('dialog', { name: '5 people' });
  await checkAvatars(dialog);
  await expect(dialog.locator('.ui-avatar[data-shape="square"]')).toHaveCount(2);
  await expect(dialog.getByText('K', { exact: true })).toBeVisible();
  await expect(dialog.locator('img[loading="lazy"][referrerpolicy="no-referrer"]')).toHaveCount(1);
  await expect(dialog.locator('.ui-user-identity__name')).toHaveText([
    'Omar Haddad',
    'Ana Ruiz',
    'Jon Berg',
    'Kim Lee',
    'Maria Ortega',
  ]);
});
