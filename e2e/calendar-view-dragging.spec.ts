import type { Locator, Page } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { expect, test } from './fixtures.js';

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

/** The event as it is, drawn as a ghost while it is dragged. */
async function expectGhost(event: Locator) {
  await expect(event).toHaveAttribute('data-dragging', 'true');
  await expect(event).toHaveCSS('opacity', /^0\.\d+$/);
}

async function expectSettled(event: Locator) {
  await expect(event).not.toHaveAttribute('data-dragging');
  await expect(event).toHaveCSS('opacity', '1');
}

async function boxOf(locator: Locator) {
  return requireDefined(await locator.boundingBox());
}

async function boxesOf(page: Page, titles: string[]) {
  return Promise.all(titles.map((title) => boxOf(eventNamed(page, title))));
}

/** The preview sits at the inline start of the day's time grid, whatever it crosses. */
async function expectStart(preview: Locator, column: { x: number }) {
  await expect(preview).toHaveCount(1);
  expect(Math.abs((await boxOf(preview)).x - column.x)).toBeLessThan(2);
}

const eventNamed = (page: Page, title: string) =>
  demo(page).getByRole('button', { name: new RegExp(`^${title},`) });
const editor = (page: Page) => page.getByRole('dialog', { name: 'Edit event' });

test.describe('Calendar View dragging', () => {
  test('UIC-CALENDAR-VIEW-6.1 UIC-CALENDAR-VIEW-6.2 drags an event to move it, without handles, and clicks it to edit', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    // No handle bars: only invisible edges, and no edge or move on the read-only event.
    await expect(
      grid.locator('.ui-calendar-view__event-move, .ui-calendar-view__event-resize'),
    ).toHaveCount(0);
    const edge = grid.getByRole('button', { name: 'Change end of Standup' });
    await expect(edge).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(grid.getByRole('button', { name: 'Change end of Locked audit' })).toHaveCount(0);
    await expect(eventNamed(page, 'Locked audit')).not.toHaveAttribute('data-movable');
    await expect(
      grid.getByRole('button', { name: 'Change end of Fixed-length review' }),
    ).toHaveCount(0);

    const standup = eventNamed(page, 'Standup');
    await standup.scrollIntoViewIfNeeded();
    const from = await center(standup);
    const hour = requireDefined(await timed(page, '2026-11-03').boundingBox()).height / 24;
    const next = await center(timed(page, '2026-11-03'));
    await dragTo(page, standup, { x: next.x, y: from.y + hour });
    const preview = grid.locator('.ui-calendar-view__event[data-preview]');
    await expect(preview).toHaveCount(1);
    await expect(preview).toHaveAttribute('aria-hidden', 'true');
    await expect(day(page, '2026-11-03').locator('[data-preview]')).toHaveCount(1);
    await expectGhost(standup);
    await page.mouse.up();
    await expect(preview).toHaveCount(0);
    await expectSettled(standup);
    await expect(output(page)).toHaveText('Standup: 2026-11-03T10:00 to 2026-11-03T10:30');
    // The release of the drag is not a click: no editor.
    await expect(editor(page)).toHaveCount(0);

    // A click without dragging opens the editor.
    await eventNamed(page, 'Standup').click();
    await expect(editor(page).getByRole('textbox', { name: 'Title' })).toHaveValue('Standup');
    await editor(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(editor(page)).toBeHidden();
  });

  test('UIC-CALENDAR-VIEW-6.2 abandons a drag on Escape and drags a bar end by days', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    await dragTo(
      page,
      eventNamed(page, 'Deadline'),
      day(page, '2026-11-02').locator('.ui-calendar-view__all-day'),
    );
    await expect(grid.locator('[data-preview]')).toHaveCount(1);
    await expectGhost(eventNamed(page, 'Deadline'));
    await page.keyboard.press('Escape');
    await expect(grid.locator('[data-preview]')).toHaveCount(0);
    await expectSettled(eventNamed(page, 'Deadline'));
    await page.mouse.up();
    await expect(output(page)).toHaveText('No change yet');
    await expect(editor(page)).toHaveCount(0);

    const end = grid.getByRole('button', { name: 'Change end of Offsite' });
    await dragTo(page, end, day(page, '2026-11-06').locator('.ui-calendar-view__all-day'));
    await page.mouse.up();
    await expect(output(page)).toHaveText('Offsite: 2026-11-03 to 2026-11-06');
    await expect(eventNamed(page, 'Offsite')).toHaveCount(1);
  });

  test('UIC-CALENDAR-VIEW-6.1 UIC-CALENDAR-VIEW-6.2 changes the start and end alone in the resize mode', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    await grid.getByRole('radio', { name: 'Start and end' }).click();
    await expect(eventNamed(page, 'Offsite')).not.toHaveAttribute('data-movable');
    const start = grid.getByRole('button', { name: 'Change start of Offsite' });
    // A press alone leaves the event as it is.
    await start.scrollIntoViewIfNeeded();
    const pressed = await center(start);
    await page.mouse.move(pressed.x, pressed.y);
    await page.mouse.down();
    await expect(eventNamed(page, 'Offsite')).not.toHaveAttribute('data-dragging');
    await page.mouse.up();
    // Resizing a bar's start ghosts the event as it is, apart from its preview, until release.
    await dragTo(page, start, day(page, '2026-11-02').locator('.ui-calendar-view__all-day'));
    await expectGhost(eventNamed(page, 'Offsite'));
    await expect(grid.locator('[data-preview]')).toHaveCount(1);
    await page.mouse.up();
    await expect(output(page)).toHaveText('Offsite: 2026-11-02 to 2026-11-05');
    await expectSettled(eventNamed(page, 'Offsite'));

    // A block's bottom edge follows the pointer down an hour; its start stays.
    const end = grid.getByRole('button', { name: 'Change end of Standup' });
    await end.scrollIntoViewIfNeeded();
    const hour = requireDefined(await timed(page, '2026-11-02').boundingBox()).height / 24;
    const from = await center(end);
    await dragTo(page, end, { x: from.x, y: from.y + hour });
    await expectGhost(eventNamed(page, 'Standup'));
    await page.mouse.up();
    await expect(output(page)).toHaveText('Standup: 2026-11-02T09:00 to 2026-11-02T10:30');
    await expectSettled(eventNamed(page, 'Standup'));
    // Dragging the event itself moves nothing in this mode.
    const standup = eventNamed(page, 'Standup');
    const body = await center(standup);
    await dragTo(page, standup, { x: body.x + 200, y: body.y });
    await page.mouse.up();
    await expect(output(page)).toHaveText('Standup: 2026-11-02T09:00 to 2026-11-02T10:30');
  });

  test('UIC-CALENDAR-VIEW-6.2 moves a multi-day bar across weeks in the month view as one event', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    await grid.getByRole('radio', { name: 'Month' }).click();
    // Pressed at its middle day, 4 November, the bar keeps that grip: dropped on the 10th it starts
    // on the 9th.
    await dragTo(
      page,
      eventNamed(page, 'Offsite'),
      day(page, '2026-11-10').locator('.ui-calendar-view__day-number'),
    );
    await page.mouse.up();
    await expect(output(page)).toHaveText('Offsite: 2026-11-09 to 2026-11-11');
    await expect(editor(page)).toHaveCount(0);
  });

  test('UIC-CALENDAR-VIEW-6.2 keeps the preview of a moving block at the start of its day and the others in place until release', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    const preview = grid.locator('.ui-calendar-view__event[data-preview]');
    const pairing = eventNamed(page, 'Pairing');
    await pairing.scrollIntoViewIfNeeded();
    const settled = await boxesOf(page, ['Pairing', 'Interview', 'Fixed-length review']);
    const wednesday = await boxOf(timed(page, '2026-11-04'));
    const hour = wednesday.height / 24;
    const from = await center(pairing);
    // Down two hours, across Interview: the preview stays at the day's start, nothing repacks.
    await dragTo(page, pairing, { x: from.x, y: from.y + hour });
    await expectStart(preview, wednesday);
    await page.mouse.move(from.x, from.y + 2 * hour, { steps: 4 });
    await expectStart(preview, wednesday);
    expect(await boxesOf(page, ['Pairing', 'Interview', 'Fixed-length review'])).toEqual(settled);
    // Over to Thursday, across Locked audit.
    const thursday = await boxOf(timed(page, '2026-11-05'));
    const locked = await boxOf(eventNamed(page, 'Locked audit'));
    await page.mouse.move(thursday.x + thursday.width / 2, locked.y + locked.height / 2, {
      steps: 6,
    });
    await expectStart(preview, thursday);
    expect(await boxOf(eventNamed(page, 'Locked audit'))).toEqual(locked);
    await page.mouse.up();
    await expect(output(page)).toHaveText('Pairing: 2026-11-05T09:45 to 2026-11-05T11:45');
    // Released, the moved event is packed beside Locked audit as usual.
    const moved = await boxOf(pairing);
    expect(moved.width).toBeLessThan(thursday.width * 0.75);
  });

  test('UIC-CALENDAR-VIEW-6.2 keeps the preview of a resized bar on the first row until release, cancelled or declined', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    await grid.getByRole('radio', { name: 'Start and end' }).click();
    const preview = grid.locator('.ui-calendar-view__event[data-preview]');
    const sprint = eventNamed(page, 'Sprint');
    await sprint.scrollIntoViewIfNeeded();
    const settled = await boxesOf(page, ['Sprint', 'Offsite', 'Deadline']);
    const firstRow = await boxOf(day(page, '2026-11-04').locator('.ui-calendar-view__all-day'));
    const end = grid.getByRole('button', { name: 'Change end of Sprint' });
    await dragTo(page, end, day(page, '2026-11-07').locator('.ui-calendar-view__all-day'));
    await expect(preview).toHaveCount(1);
    expect(Math.abs((await boxOf(preview)).y - firstRow.y)).toBeLessThan(2);
    expect(await boxesOf(page, ['Sprint', 'Offsite', 'Deadline'])).toEqual(settled);
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect(preview).toHaveCount(0);
    expect(await boxesOf(page, ['Sprint', 'Offsite', 'Deadline'])).toEqual(settled);

    // A host that keeps the event as it was: the bar returns to its place.
    await grid.getByText('Decline changes').click();
    const start = grid.getByRole('button', { name: 'Change start of Sprint' });
    await dragTo(page, start, day(page, '2026-11-02').locator('.ui-calendar-view__all-day'));
    expect(Math.abs((await boxOf(preview)).y - firstRow.y)).toBeLessThan(2);
    await page.mouse.up();
    await expect(output(page)).toHaveText('Declined Sprint: 2026-11-02 to 2026-11-06');
    await expect(preview).toHaveCount(0);
    expect(await boxesOf(page, ['Sprint', 'Offsite', 'Deadline'])).toEqual(settled);
  });

  test('UIC-CALENDAR-VIEW-6.3 steps events by keyboard across the night the clocks go back', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const grid = demo(page);
    await grid.getByRole('button', { name: 'Previous week' }).click();
    await eventNamed(page, 'Night shift').focus();
    // Modified arrows are shortcuts, not steps.
    for (const chord of [
      'Control+ArrowRight',
      'Alt+ArrowDown',
      'Shift+ArrowRight',
      'Meta+ArrowLeft',
    ])
      await page.keyboard.press(chord);
    await expect(output(page)).toHaveText('No change yet');
    await eventNamed(page, 'Night shift').first().focus();
    await page.keyboard.press('ArrowRight');
    // Eight wall-clock hours lasting nine elapsed keep nine: it now ends at 7 AM.
    await expect(output(page)).toHaveText('Night shift: 2026-11-01T22:00 to 2026-11-02T07:00');
    await expect(eventNamed(page, 'Night shift').first()).toBeFocused();
    await expect(grid.getByRole('grid')).toHaveAccessibleName(/Nov 1/);
    const end = grid.getByRole('button', { name: 'Change end of Standup' });
    await end.focus();
    await page.keyboard.press('ArrowDown');
    await expect(output(page)).toHaveText('Standup: 2026-11-02T09:00 to 2026-11-02T09:45');
    await expect(end).toBeFocused();
    await expect(end).toHaveCSS('outline-style', 'solid');
    await lab.expectAccessible('[data-lab-demo="dragging"]');
  });
});
