import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-relative-time`;

test.describe('Relative Time lab', () => {
  test('UIC-RELATIVE-TIME-1.1 UIC-RELATIVE-TIME-1.2 words each value against the clock', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-time');
    for (const [value, label, inline] of [
      ['seconds', '12 seconds ago', '12 seconds ago'],
      ['minutes', '12 minutes ago', '12 minutes ago'],
      ['hours', '3 hours ago', '3 hours ago'],
      ['in hours', 'In 3 hours', 'in 3 hours'],
      ['yesterday', 'Yesterday', 'yesterday'],
      ['days ago', '4 days ago', '4 days ago'],
      ['in days', 'In 3 days', 'in 3 days'],
      ['absolute', 'Feb 3, 2026', 'Feb 3, 2026'],
    ] as const) {
      await expect(page.locator(cell(`value=${value} casing=label`))).toHaveText(label);
      await expect(page.locator(cell(`value=${value} casing=mid-sentence`))).toHaveText(inline);
    }
    const yesterday = page.locator(cell('value=yesterday casing=label'));
    await expect(yesterday).toHaveAttribute('datetime', '2026-04-19');
    await expect(yesterday).toHaveAttribute('data-relation', 'past');
    await expect(yesterday).toHaveAttribute('data-format', 'relative');
    await expect(page.locator(cell('value=absolute casing=label'))).toHaveAttribute(
      'data-format',
      'absolute',
    );
    await expect(page.locator(cell('tooltip=shown fallback=2 days'))).toHaveText('Apr 16, 2026');
  });

  test('UIC-RELATIVE-TIME-3.1 UIC-RELATIVE-TIME-3.2 shows the absolute date on focus and hover', async ({
    page,
    lab,
  }) => {
    // Scrolling closes a tooltip, so the whole lab fits the viewport and tabbing never scrolls.
    await page.setViewportSize({ width: 1280, height: 4000 });
    await lab.open('relative-time');
    const time = page.locator(cell('tooltip=shown fallback=7 days'));
    await time.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(time).toBeFocused();
    // The previous timestamp's tooltip may still be fading out.
    const tooltip = page.locator('[role="tooltip"]:not([data-exiting])');
    await expect(tooltip).toHaveText('Apr 16, 2026');
    await expect(tooltip).toHaveClass(/ui-relative-time__tooltip/);
    await expect(time).toHaveAccessibleDescription('Apr 16, 2026');
    await expect(time).toHaveText('4 days ago');
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);

    const hours = page.locator(cell('value=hours casing=label'));
    await page.mouse.move(5, 5);
    await hours.hover();
    await expect(tooltip).toHaveText(/^Apr 20, 2026, 7:05\sAM$/);

    for (const id of ['tooltip=off fallback=7 days', 'tooltip=shown fallback=2 days']) {
      await expect(page.locator(cell(id))).not.toHaveAttribute('tabindex');
    }
  });

  test('UIC-RELATIVE-TIME-1.4 shows the placeholder of a missing value', async ({ page, lab }) => {
    await lab.open('relative-time');
    const empty = page.locator(cell('value=empty placeholder=never'));
    await expect(empty).toHaveText('never');
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(page.locator(cell('value=unreadable placeholder=none'))).toHaveCount(0);
  });

  test('UIC-RELATIVE-TIME-2.2 keeps a live timestamp current on the shared clock', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('relative-time');
    await page.clock.pauseAt(Date.now() + 1000);
    const live = page.locator('[data-lab-time="live"]');
    await page.getByRole('button', { name: 'Save now' }).click();
    await expect(live).toHaveText('now');
    // Step the clock a second at a time and wait for each render, so every render schedules its
    // next wake on the shared timer before the clock moves on.
    for (let second = 1; second < 60; second += 1) {
      await page.clock.runFor(1000);
      await expect(live).toHaveText(second === 1 ? '1 second ago' : `${second} seconds ago`);
    }
    for (let second = 60; second <= 80; second += 1) await page.clock.runFor(1000);
    await expect(live).toHaveText('1 minute ago');
    await page.clock.resume();
  });

  test('UIC-RELATIVE-TIME-3.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('relative-time');
    await expect(page.locator('#lab-root .ui-relative-time').first()).toBeVisible();
    await lab.expectAccessible();
    await lab.open('relative-time', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
