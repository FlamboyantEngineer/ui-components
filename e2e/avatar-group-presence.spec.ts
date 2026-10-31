import { expect, matrix, matrixCell, test } from './fixtures.js';

test.describe('AvatarGroup presence layouts', () => {
  test('UIC-AVATAR-GROUP-11.2 UIC-AVATAR-GROUP-12.2 windows the people and sizes the overflow', async ({
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
      const cell = matrixCell(page, `variant=avatars size=${size}`, {
        family: 'avatar-group-presence-cases',
      });
      await expect(cell.locator('.ui-avatar-group__avatar')).toHaveCount(4);
      const overflow = cell.locator('.ui-avatar-group__overflow');
      await expect(overflow).toHaveText('+2');
      expect((await overflow.boundingBox())?.height).toBe(pixels);
      expect((await cell.locator('.ui-avatar').first().boundingBox())?.height).toBe(pixels);
    }
    const leftOut = matrixCell(page, 'setup=max 4, 2 left out variant=avatars', {
      family: 'avatar-group-presence-cases',
    });
    await expect(leftOut.locator('.ui-avatar-group__overflow')).toHaveText('+4');
    const only = matrixCell(page, 'setup=left out only variant=avatars', {
      family: 'avatar-group-presence-cases',
    });
    await expect(only.locator('.ui-avatar-group__avatar')).toHaveCount(0);
    await expect(only.locator('.ui-avatar-group__overflow')).toHaveText('+3');
    const one = matrixCell(page, 'setup=one person variant=avatars', {
      family: 'avatar-group-presence-cases',
    });
    await expect(one.locator('.ui-avatar-group__overflow')).toHaveCount(0);
  });

  test('UIC-AVATAR-GROUP-11.1 UIC-AVATAR-GROUP-11.3 names the group, the people and the overflow', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    const cell = matrixCell(page, 'setup=max 4, 2 left out variant=avatars', {
      family: 'avatar-group-presence-cases',
    });
    await expect(cell.getByRole('group')).toHaveAccessibleName(
      'Maria Santos, Jon Berg, Lena Ortiz, Sam Okafor, Priya Nair, Tom Li, Ines Duarte, Kofi Mensah',
    );
    await expect(
      cell.getByRole('img', {
        name: '4 more people: Priya Nair, Tom Li, Ines Duarte, Kofi Mensah',
      }),
    ).toHaveText('+4');
    const people = cell.locator('.ui-avatar-group__avatar');
    await expect(people).toHaveCount(4);
    await expect(people.nth(0)).toHaveAccessibleName('Maria Santos, Active');
    await expect(people.nth(3)).toHaveAccessibleName('Sam Okafor, Idle');
  });

  test('UIC-AVATAR-GROUP-11.4 reports the pressed person by click and keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    const strip = matrix(page, 'avatar-group-presence-cases').locator(
      '[data-lab-strip="following"]',
    );
    const following = matrix(page, 'avatar-group-presence-cases').locator(
      '[data-lab-output="following"]',
    );
    await strip.getByRole('button', { name: 'Jon Berg, Away' }).click();
    await expect(following).toHaveText('Jon Berg');
    await page.keyboard.press('Tab');
    await expect(strip.getByRole('button', { name: 'Lena Ortiz, Busy' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(following).toHaveText('Lena Ortiz');
    await page.keyboard.press('Tab');
    await page.keyboard.press(' ');
    await expect(following).toHaveText('Sam Okafor');

    await expect(strip.locator('.ui-avatar-group__overflow')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add a person left out' }).click();
    await expect(strip.getByRole('img', { name: '1 more person: Guest 1' })).toHaveText('+1');
    await page.getByRole('button', { name: 'Add a person left out' }).click();
    await expect(strip.locator('.ui-avatar-group__overflow')).toHaveText('+2');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(strip.locator('.ui-avatar-group__overflow')).toHaveCount(0);
  });

  test('UIC-AVATAR-GROUP-12.1 keeps dots decorative inside a control and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    const control = page.getByRole('button', { name: 'Photos, 3 people here' });
    const strip = control.locator('.ui-avatar-group');
    await expect(strip).toHaveAttribute('data-layout', 'dots');
    await expect(strip).toHaveAttribute('aria-hidden', 'true');
    const dots = strip.locator('.ui-avatar-group__dot');
    await expect(dots).toHaveCount(3);
    expect((await dots.first().boundingBox())?.width).toBe(6);
    await expect(strip.locator('[tabindex], button, [role]')).toHaveCount(0);
    const dotsCell = matrixCell(page, 'variant=dots size=md', {
      family: 'avatar-group-presence-cases',
    });
    await expect(dotsCell.locator('.ui-avatar-group__overflow')).toHaveText('+2');
    await lab.expectAccessible();
  });

  test('UIC-AVATAR-GROUP-11.5 opens the card of the pressed person', async ({ page, lab }) => {
    await lab.open('avatar-group');
    const strip = matrix(page, 'avatar-group-presence-cases').locator('[data-lab-strip="cards"]');
    await strip.getByRole('button', { name: 'Lena Ortiz, Busy' }).click();
    const card = page.getByRole('dialog', { name: 'Lena Ortiz' });
    await expect(card).toContainText('Busy');
    await page.mouse.click(5, 5);
    await expect(card).toHaveCount(0);
  });

  test('UIC-AVATAR-GROUP-11.6 lists the hidden people in a menu from the count', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar-group');
    const strip = matrix(page, 'avatar-group-presence-cases').locator('[data-lab-strip="menu"]');
    await expect(strip).toHaveAttribute('data-overflow', 'menu');
    const count = strip.getByRole('button', {
      name: '4 more people: Sam Okafor, Priya Nair, Tom Li, Ines Duarte',
    });
    await expect(count).toHaveText('+4');
    await count.click();
    const menu = page.getByRole('menu', { name: '4 more people' });
    await expect(menu.locator('.ui-user-identity__name')).toHaveText([
      'Sam Okafor',
      'Priya Nair',
      'Tom Li',
    ]);
    await expect(menu.getByRole('menuitem').first()).toHaveAccessibleName('Sam Okafor Idle');
    await expect(menu.locator('.ui-user-identity__indicator').first()).toBeVisible();
    await lab.expectAccessible('.ui-menu-popover');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem').nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveCount(0);
    await expect(
      matrix(page, 'avatar-group-presence-cases').locator('[data-lab-output="menu"]'),
    ).toHaveText('Priya Nair');
    await expect(count).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu.getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(count).toBeFocused();
  });

  test('UIC-AVATAR-GROUP-11.7 shows names in tooltips and opens cards on hover', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('avatar-group');
    await page.clock.pauseAt(Date.now() + 1000);
    const tooltips = matrix(page, 'avatar-group-presence-cases').locator(
      '[data-lab-strip="tooltips"]',
    );
    const persons = tooltips.locator('.ui-avatar-group__avatar');
    await persons.first().focus();
    await page.keyboard.press('Tab');
    await expect(persons.nth(1)).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveText('Jon Berg, Away');
    await persons.nth(1).blur();
    await page.clock.runFor(1000);

    const cards = matrix(page, 'avatar-group-presence-cases').locator(
      '[data-lab-strip="hover-cards"]',
    );
    await page.mouse.move(5, 5);
    await cards.getByRole('button', { name: 'Lena Ortiz, Busy' }).hover();
    await page.clock.runFor(600);
    await expect(page.getByRole('dialog', { name: 'Lena Ortiz' })).toContainText('Busy');
    await page.clock.resume();
  });
});
