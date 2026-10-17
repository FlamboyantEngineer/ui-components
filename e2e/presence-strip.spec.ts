import { expect, test } from './fixtures.js';

test.describe('Presence Strip lab', () => {
  test('UIC-PRESENCE-STRIP-1.2 UIC-PRESENCE-STRIP-2.2 windows the people and sizes the overflow', async ({
    page,
    lab,
  }) => {
    await lab.open('presence-strip');
    for (const [size, pixels] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
    ] as const) {
      const cell = page.locator(`[data-lab-cell="variant=avatars size=${size}"]`);
      await expect(cell.locator('.ui-presence-strip__person')).toHaveCount(4);
      const overflow = cell.locator('.ui-presence-strip__overflow');
      await expect(overflow).toHaveText('+2');
      expect((await overflow.boundingBox())?.height).toBe(pixels);
      expect((await cell.locator('.ui-avatar').first().boundingBox())?.height).toBe(pixels);
    }
    const leftOut = page.locator('[data-lab-cell="setup=max 4, 2 left out variant=avatars"]');
    await expect(leftOut.locator('.ui-presence-strip__overflow')).toHaveText('+4');
    const only = page.locator('[data-lab-cell="setup=left out only variant=avatars"]');
    await expect(only.locator('.ui-presence-strip__person')).toHaveCount(0);
    await expect(only.locator('.ui-presence-strip__overflow')).toHaveText('+3');
    const one = page.locator('[data-lab-cell="setup=one person variant=avatars"]');
    await expect(one.locator('.ui-presence-strip__overflow')).toHaveCount(0);
  });

  test('UIC-PRESENCE-STRIP-1.1 UIC-PRESENCE-STRIP-1.3 names the group, the people and the overflow', async ({
    page,
    lab,
  }) => {
    await lab.open('presence-strip');
    const cell = page.locator('[data-lab-cell="setup=max 4, 2 left out variant=avatars"]');
    await expect(cell.getByRole('group')).toHaveAccessibleName(
      'Maria Santos, Jon Berg, Lena Ortiz, Sam Okafor, Priya Nair, Tom Li, Ines Duarte, Kofi Mensah',
    );
    await expect(
      cell.getByRole('img', {
        name: '4 more people: Priya Nair, Tom Li, Ines Duarte, Kofi Mensah',
      }),
    ).toHaveText('+4');
    const people = cell.locator('.ui-presence-strip__person > .ui-avatar');
    await expect(people).toHaveCount(4);
    await expect(people.nth(0)).toHaveAccessibleName('Maria Santos, Active');
    await expect(people.nth(3)).toHaveAccessibleName('Sam Okafor, Idle');
  });

  test('UIC-PRESENCE-STRIP-1.4 reports the pressed person by click and keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('presence-strip');
    const strip = page.locator('[data-lab-strip="following"]');
    const following = page.locator('[data-lab-output="following"]');
    await strip.getByRole('button', { name: 'Jon Berg, Away' }).click();
    await expect(following).toHaveText('Jon Berg');
    await page.keyboard.press('Tab');
    await expect(strip.getByRole('button', { name: 'Lena Ortiz, Busy' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(following).toHaveText('Lena Ortiz');
    await page.keyboard.press('Tab');
    await page.keyboard.press(' ');
    await expect(following).toHaveText('Sam Okafor');

    await expect(strip.locator('.ui-presence-strip__overflow')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add a person left out' }).click();
    await expect(strip.getByRole('img', { name: '1 more person: Guest 1' })).toHaveText('+1');
    await page.getByRole('button', { name: 'Add a person left out' }).click();
    await expect(strip.locator('.ui-presence-strip__overflow')).toHaveText('+2');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(strip.locator('.ui-presence-strip__overflow')).toHaveCount(0);
  });

  test('UIC-PRESENCE-STRIP-2.1 keeps dots decorative inside a control and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('presence-strip');
    const control = page.getByRole('button', { name: 'Sheet 1, 3 people here' });
    const strip = control.locator('.ui-presence-strip');
    await expect(strip).toHaveAttribute('data-variant', 'dots');
    await expect(strip).toHaveAttribute('aria-hidden', 'true');
    const dots = strip.locator('.ui-presence-strip__dot');
    await expect(dots).toHaveCount(3);
    expect((await dots.first().boundingBox())?.width).toBe(6);
    await expect(strip.locator('[tabindex], button, [role]')).toHaveCount(0);
    const dotsCell = page.locator('[data-lab-cell="variant=dots size=md"]');
    await expect(dotsCell.locator('.ui-presence-strip__overflow')).toHaveText('+2');
    await lab.expectAccessible();
    await lab.open('presence-strip', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-PRESENCE-STRIP-1.5 opens the card of the pressed person', async ({ page, lab }) => {
    await lab.open('presence-strip');
    const strip = page.locator('[data-lab-strip="cards"]');
    await strip.getByRole('button', { name: 'Lena Ortiz, Busy' }).click();
    const card = page.getByRole('dialog', { name: 'Lena Ortiz' });
    await expect(card).toContainText('Busy');
    await page.mouse.click(5, 5);
    await expect(card).toHaveCount(0);
  });
});
