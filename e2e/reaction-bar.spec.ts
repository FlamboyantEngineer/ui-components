import { cellSelector, expect, familySelector, test } from './fixtures.js';

const cell = (id: string) => `${cellSelector(id)} .ui-reaction-bar`;

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

  test('UIC-REACTION-BAR-1.1 UIC-REACTION-BAR-1.2 formats counts in the locale', async ({
    page,
    lab,
  }) => {
    await lab.open('reaction-bar');
    const arabic = page.getByRole('group', { name: 'Reactions, ar-EG' });
    await expect(arabic.getByRole('button', { name: '🎉 ٥٦٬٧٨٩' })).toHaveText('🎉٥٦٬٧٨٩');
    const english = page.getByRole('group', { name: 'Reactions, en-US' });
    await expect(
      english.getByRole('button', { name: '👍 1,234, reacted by Maria Santos and 1,233 others' }),
    ).toHaveText('👍1,234');
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

  test('UIC-REACTION-BAR-1.6 is a named group and passes axe', async ({ page, lab }) => {
    await lab.open('reaction-bar');
    await expect(page.locator('#lab-root .ui-reaction-bar').first()).toHaveAttribute(
      'role',
      'group',
    );
    await expect(page.getByRole('group', { name: 'Reactions' }).first()).toBeVisible();
    await lab.expectAccessible();
  });
});

test.describe('Reaction Bar host cases', () => {
  test('UIC-REACTION-BAR-1.7 a summary chip toggles through the picker and reads only when read-only', async ({
    page,
    lab,
  }) => {
    await lab.open('reaction-bar');
    const summary = (id: string) => page.locator(`[data-lab-summary="${id}"]`);
    await expect(summary('empty interactive').locator('.ui-reaction-bar')).toHaveCount(0);
    const several = summary('several interactive');
    const chip = several.locator('.ui-reaction-bar__summary');
    await expect(chip.locator('.ui-reaction-bar__count')).toHaveText('18');
    await expect(chip.locator('.ui-reaction-bar__emoji img')).toHaveCount(1);
    await expect(chip).toHaveAttribute('data-reacted', 'true');
    await chip.click();
    const picker = page.getByRole('dialog');
    await expect(picker.getByRole('searchbox')).toBeFocused();
    await page.keyboard.type('rocket');
    await page.keyboard.press('Enter');
    await expect(several.locator('[data-lab-output="summary-toggle"]')).toHaveText(
      'reacted with 🚀',
    );
    await expect(chip.locator('.ui-reaction-bar__count')).toHaveText('19');

    const readOnly = summary('several read-only').locator('.ui-reaction-bar__summary');
    await expect(readOnly).toHaveAttribute('aria-disabled', 'true');
    await expect(summary('one read-only').locator('.ui-reaction-bar__count')).toHaveText('1');
    await lab.expectAccessible(familySelector('reaction-bar-host-cases'));
  });

  test('UIC-REACTION-BAR-1.4 offers the loaded emoji, reports a failure and recovers on reopening', async ({
    page,
    lab,
  }) => {
    await lab.open('reaction-bar');
    const demo = page.locator('[data-lab-demo="load-emoji"]');
    const add = demo.getByRole('button', { name: 'Add reaction' });
    const picker = page.getByRole('dialog');
    const loads = demo.locator('[data-lab-output="loads"]');

    await demo
      .getByRole('radiogroup', { name: 'The loader answers' })
      .getByRole('radio', { name: 'fails' })
      .click();
    await add.click();
    await expect(picker).toContainText('Loading');
    await expect(picker).toContainText(/could not/i);
    await expect(loads).toHaveText('fails');
    await page.keyboard.press('Escape');

    await demo
      .getByRole('radiogroup', { name: 'The loader answers' })
      .getByRole('radio', { name: 'after a second' })
      .click();
    await add.click();
    await expect(loads).toHaveText('fails, after a second');
    await expect(picker.getByRole('grid').first()).toBeVisible();
    await page.keyboard.type('bread');
    await page.keyboard.press('Enter');
    await expect(demo.getByRole('button', { name: /🍞/ })).toBeVisible();
  });
});
