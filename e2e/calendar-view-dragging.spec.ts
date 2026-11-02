import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const demo = (page: Page) => page.locator('[data-lab-demo="dragging"]');
const output = (page: Page) => demo(page).locator('[data-lab-output]');
const day = (page: Page, date: string) => demo(page).locator(`[data-date="${date}"]`);
const timed = (page: Page, date: string) => day(page, date).locator('.ui-calendar-view__timed');

async function center(locator: Locator) {
  const box = requireDefined(await locator.boundingBox());
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Presses a handle and moves the pointer by steps to a point or element, without releasing. */
async function dragTo(page: Page, handle: Locator, target: Locator | { x: number; y: number }) {
  await handle.scrollIntoViewIfNeeded();
  const from = await center(handle);
  const to = 'boundingBox' in target ? await center(target) : target;
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
}

test.describe('Calendar View dragging', () => {
  test('UIC-CALENDAR-VIEW-6.1 UIC-CALENDAR-VIEW-6.2 moves a timed event to another day and hour with a preview', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    // Read-only and move-only events.
    await expect(grid.getByRole('button', { name: 'Move Locked audit' })).toHaveCount(0);
    await expect(grid.getByRole('button', { name: 'Move Fixed-length review' })).toHaveCount(1);
    await expect(grid.getByRole('button', { name: 'Resize Fixed-length review' })).toHaveCount(0);

    const handle = grid.getByRole('button', { name: 'Move Standup' });
    await handle.scrollIntoViewIfNeeded();
    const from = await center(handle);
    const hour = requireDefined(await timed(page, '2026-11-03').boundingBox()).height / 24;
    const next = await center(timed(page, '2026-11-03'));
    await dragTo(page, handle, { x: next.x, y: from.y + hour });
    const preview = grid.locator('.ui-calendar-view__event[data-preview]');
    await expect(preview).toHaveCount(1);
    await expect(preview).toHaveAttribute('aria-hidden', 'true');
    await expect(day(page, '2026-11-03').locator('[data-preview]')).toHaveCount(1);
    await expect(handle).toHaveAttribute('data-dragging', 'true');
    await page.mouse.up();
    await expect(preview).toHaveCount(0);
    await expect(output(page)).toHaveText('Standup: 2026-11-03T10:00 to 2026-11-03T10:30');
    await expect(day(page, '2026-11-03')).toContainText('Standup');
  });

  test('UIC-CALENDAR-VIEW-6.2 abandons a drag on Escape and resizes a bar by days', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    const handle = grid.getByRole('button', { name: 'Move Deadline' });
    await dragTo(page, handle, day(page, '2026-11-02').locator('.ui-calendar-view__all-day'));
    await expect(grid.locator('[data-preview]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(grid.locator('[data-preview]')).toHaveCount(0);
    await page.mouse.up();
    await expect(output(page)).toHaveText('No change yet');

    // The bar's end follows the pointer to the next day; the bar stays one event.
    const resize = grid.getByRole('button', { name: 'Resize Offsite' });
    const target = day(page, '2026-11-06').locator('.ui-calendar-view__all-day');
    await dragTo(page, resize, target);
    await page.mouse.up();
    await expect(output(page)).toHaveText('Offsite: 2026-11-03 to 2026-11-06');
    await expect(grid.getByRole('button', { name: /^Offsite,/ })).toHaveCount(1);
  });

  test('UIC-CALENDAR-VIEW-6.2 moves a multi-day bar across weeks in the month view as one event', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    await grid.getByRole('radio', { name: 'Month' }).click();
    const handle = grid.getByRole('button', { name: 'Move Offsite' });
    await dragTo(page, handle, day(page, '2026-11-10').locator('.ui-calendar-view__day-number'));
    await page.mouse.up();
    await expect(output(page)).toHaveText('Offsite: 2026-11-10 to 2026-11-12');
    // Pressing a handle without moving changes nothing.
    await grid.getByRole('button', { name: 'Move Offsite' }).click();
    await expect(output(page)).toHaveText('Offsite: 2026-11-10 to 2026-11-12');
  });

  test('UIC-CALENDAR-VIEW-6.3 steps events by keyboard across the night the clocks go back', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    await grid.getByRole('button', { name: 'Previous week' }).click();
    const shift = grid.getByRole('button', { name: 'Move Night shift' });
    await shift.focus();
    await page.keyboard.press('ArrowRight');
    // Eight wall-clock hours lasting nine elapsed keep nine: it now ends at 7 AM.
    await expect(output(page)).toHaveText('Night shift: 2026-11-01T22:00 to 2026-11-02T07:00');
    await expect(grid.getByRole('button', { name: 'Move Night shift' })).toBeFocused();
    await expect(grid.getByRole('grid')).toHaveAccessibleName(/Nov 1/);
    const resize = grid.getByRole('button', { name: 'Resize Standup' });
    await resize.focus();
    await page.keyboard.press('ArrowDown');
    await expect(output(page)).toHaveText('Standup: 2026-11-02T09:00 to 2026-11-02T09:45');
    await expect(resize).toBeFocused();
    await lab.expectAccessible('[data-lab-demo="dragging"]');
  });
});
