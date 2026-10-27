import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-reaction-bar`;

test.describe('Reaction Bar lab', () => {
  test('UIC-REACTION-BAR-1.1 UIC-REACTION-BAR-1.2 draws chips named by who reacted', async ({
    page,
    lab,
  }) => {
    await lab.open('reaction-bar');
    const bar = page.locator(cell('mode=interactive reactions=several'));
    await expect(bar.locator('.ui-reaction-bar__reaction')).toHaveCount(4);
    await expect(
      bar.getByRole('button', { name: '👍 3, reacted by You, Maria Santos, and Jon Berg' }),
    ).toBeVisible();
    const custom = bar.getByRole('button', { name: 'Ship it 2, reacted by Tom Li and Jon Berg' });
    await expect(custom.locator('img.ui-reaction-bar__image')).toBeVisible();
    await expect(bar.getByRole('button', { name: '👀 1' })).toHaveText('👀1');
    await expect(
      page
        .locator(cell('maxNames=1'))
        .getByRole('button', { name: '🎉 12, reacted by Lena Ortiz and 11 others' }),
    ).toBeVisible();
    await expect(
      page.locator(cell('mode=interactive reactions=empty')).locator('.ui-reaction-bar__reaction'),
    ).toHaveCount(0);

    await page.mouse.move(5, 5);
    await bar.getByRole('button', { name: /^🎉/ }).hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      '🎉 12, reacted by Lena Ortiz, Sam Okafor, Priya Nair and 9 others',
    );
  });

  test('UIC-REACTION-BAR-1.3 UIC-REACTION-BAR-1.4 toggles and adds reactions', async ({
    page,
    lab,
  }) => {
    await lab.open('reaction-bar');
    const bar = page.locator('[data-lab-bar="live"]');
    const output = page.locator('[data-lab-output="toggle"]');
    const thumbs = bar.getByRole('button', { name: /^👍/ });
    await expect(thumbs).toHaveAttribute('aria-pressed', 'true');
    await thumbs.click();
    await expect(output).toHaveText('removed 👍');
    await expect(thumbs).toHaveAttribute('aria-pressed', 'false');
    await expect(thumbs).toHaveAccessibleName('👍 2, reacted by Maria Santos and Jon Berg');
    await thumbs.press('Space');
    await expect(thumbs).toHaveAttribute('aria-pressed', 'true');

    await bar.getByRole('button', { name: 'Add reaction' }).click();
    const picker = page.getByRole('dialog', { name: 'Emoji picker' });
    await expect(picker.getByRole('grid', { name: 'Recently used' })).toBeVisible();
    await page.keyboard.type('rocket');
    await page.keyboard.press('Enter');
    await expect(picker).toHaveCount(0);
    await expect(output).toHaveText('reacted with 🚀');
    await expect(bar.getByRole('button', { name: '🚀 1, reacted by You' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(bar.getByRole('button', { name: 'Add reaction' })).toBeFocused();
  });

  test('UIC-REACTION-BAR-1.5 keeps read-only chips focusable but refuses presses', async ({
    page,
    lab,
  }) => {
    await lab.open('reaction-bar');
    const bar = page.locator(cell('mode=read-only reactions=several'));
    await expect(bar).toHaveAttribute('data-readonly', 'true');
    await expect(bar.getByRole('button', { name: 'Add reaction' })).toHaveCount(0);
    const thumbs = bar.getByRole('button', { name: /^👍/ });
    await expect(thumbs).toHaveAttribute('aria-disabled', 'true');
    await thumbs.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(thumbs).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(cell('mode=read-only reactions=empty'))).toHaveCount(0);
  });

  test('UIC-REACTION-BAR-1.6 is a named group and passes axe in both themes', async ({
    page,
    lab,
  }) => {
    await lab.open('reaction-bar');
    await expect(page.locator('#lab-root .ui-reaction-bar').first()).toHaveAttribute(
      'role',
      'group',
    );
    await expect(page.getByRole('group', { name: 'Reactions' }).first()).toBeVisible();
    await lab.expectAccessible();
    await lab.open('reaction-bar', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
