import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-relative-time`;

test.describe('Relative Time lab', () => {
  test('UIC-RELATIVE-TIME-1.1 UIC-RELATIVE-TIME-1.2 words each value against the clock', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-time');
    for (const [value, label, inline] of [
      ['seconds', 'Now', 'now'],
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

  test('UIC-RELATIVE-TIME-1.2 reads Now or live seconds by precision, in each unit style', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-time');
    for (const [value, minute, second] of [
      ['just now', 'Now', '12 seconds ago'],
      ['100 seconds ago', '1 minute ago', '2 minutes ago'],
      ['25 minutes ago', '25 minutes ago', '25 minutes ago'],
      ['in 40 seconds', 'Now', 'In 40 seconds'],
    ] as const) {
      await expect(page.locator(cell(`value=${value} precision=minute`))).toHaveText(minute);
      await expect(page.locator(cell(`value=${value} precision=second`))).toHaveText(second);
    }
    for (const [unitStyle, seconds, minutes, hours] of [
      ['long', '12 seconds ago', '12 minutes ago', 'In 3 hours'],
      ['short', '12 sec. ago', '12 min. ago', 'In 3 hr.'],
      ['narrow', '12s ago', '12m ago', 'In 3h'],
    ] as const) {
      await expect(page.locator(cell(`value=seconds unitStyle=${unitStyle}`))).toHaveText(seconds);
      await expect(page.locator(cell(`value=minutes unitStyle=${unitStyle}`))).toHaveText(minutes);
      await expect(page.locator(cell(`value=in hours unitStyle=${unitStyle}`))).toHaveText(hours);
    }
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
    const live = page.locator('[data-lab-time="second"]');
    const minute = page.locator('[data-lab-time="minute"]');
    await page.getByRole('button', { name: 'Save now' }).click();
    await expect(live).toHaveText('now');
    await expect(minute).toHaveText('now');
    // Step the clock a second at a time and wait for each render, so every render schedules its
    // next wake on the shared timer before the clock moves on.
    for (let second = 1; second < 60; second += 1) {
      await page.clock.runFor(1000);
      await expect(live).toHaveText(second === 1 ? '1 second ago' : `${second} seconds ago`);
      await expect(minute).toHaveText('now');
    }
    for (let second = 60; second <= 80; second += 1) await page.clock.runFor(1000);
    await expect(live).toHaveText('1 minute ago');
    await expect(minute).toHaveText('1 minute ago');
    await page.clock.resume();
  });

  test('UIC-RELATIVE-TIME-3.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('relative-time');
    await expect(page.locator('#lab-root .ui-relative-time').first()).toBeVisible();
    await lab.expectAccessible();
    await lab.open('relative-time', { theme: 'dark' });
    await lab.expectAccessible();
  });
  test('UIC-RELATIVE-TIME-2.2 updates a shared deadline after timestamps are removed and remounted', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('relative-time');
    // Keep the captured label stable while checking that every subscriber has caught up.
    await page.clock.pauseAt(Date.now() + 1000);
    const demo = page.locator('[data-lab-demo="shared-clock"]');
    const times = demo.locator('time');
    await expect(times).toHaveCount(20);
    await demo.getByRole('button', { name: 'Remove timestamps' }).click();
    await expect(times).toHaveCount(0);
    await page.clock.runFor(30_000);
    await demo.getByRole('button', { name: 'Mount timestamps' }).click();
    await expect(times).toHaveCount(20);
    const before = await times.first().textContent();
    await page.clock.runFor(30_000);
    await expect(times.first()).not.toHaveText(requireDefined(before));
    await expect(times).toHaveText(Array(20).fill(await times.first().textContent()));
    await page.clock.resume();
  });
});

test.describe('Relative Time server text in Tokyo', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('UIC-RELATIVE-TIME-2.3 formats the server text without the local time zone', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-time');
    for (const [value, text] of [
      ['2026-10-31T12:00:00Z', /Oct 31, 2026, 12:00:00\sPM\sUTC/],
      ['2026-10-31T12:00', /Oct 31, 2026, 12:00\sPM$/],
      ['2026-10-31', /^Oct 31, 2026$/],
    ] as const) {
      await expect(page.locator(`[data-lab-cell="value=${value}"] output`)).toHaveText(text);
    }
  });
});

test.describe('Relative Time frozen clock', () => {
  test('UIC-RELATIVE-TIME-2.2 stops waking a timestamp whose clock does not move', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-time');
    const demo = page.locator('[data-lab-demo="frozen-clock"]');
    await expect(demo.locator('.ui-relative-time')).toHaveText('In 1 minute');
    await page.waitForTimeout(500);
    const count = demo.getByRole('button', { name: 'Count clock reads' });
    await count.click();
    const first = Number(await demo.locator('[data-lab-output="reads"]').textContent());
    expect(first).toBeLessThan(10);
    await page.waitForTimeout(500);
    await count.click();
    // Only the press's own render reads the clock again; no wake did.
    await expect(demo.locator('[data-lab-output="reads"]')).toHaveText(String(first + 1));
  });
});

test.describe('Relative Time lab in New York', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('UIC-RELATIVE-TIME-1.1 UIC-RELATIVE-TIME-1.3 keeps instants through a repeated daylight saving hour', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-time');
    for (const value of ['second 01:30 (offset)', 'second 01:30 (UTC)', 'second 01:30 (zone)']) {
      const time = page.locator(cell(`value=${value}`));
      await expect(time).toHaveText('In 45 minutes');
      await expect(time).toHaveAttribute('data-relation', 'future');
      await time.focus();
      await expect(page.getByRole('tooltip').last()).toHaveText(/1:30:00\sAM\sEST/);
      await time.blur();
    }
    const earlier = page.locator(cell('value=first 01:30 (offset)'));
    await expect(earlier).toHaveText('14 minutes ago');
    await expect(earlier).toHaveAttribute('data-relation', 'past');
  });
});
