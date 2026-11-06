import type { Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

const demo = (page: Page) => page.locator('[data-lab-demo="day-agenda"]');
const plain = (text: string) => text.replace(/[\u00a0\u2009\u202f]/g, ' ');

test.describe('Calendar View day and agenda lab', () => {
  test('UIC-CALENDAR-VIEW-1.7 UIC-CALENDAR-VIEW-1.4 draws one day on the time grid with overlaps side by side', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const calendar = demo(page);
    const grid = calendar.getByRole('grid', { name: 'Wednesday, March 18, 2026' });
    await expect(grid.getByRole('gridcell')).toHaveCount(1);
    await expect(calendar.locator('.ui-calendar-view__weekday[data-today]')).toHaveCount(1);
    const lunch = await calendar.getByRole('button', { name: /^Team lunch,/ }).boundingBox();
    const review = await calendar.getByRole('button', { name: /^Design review,/ }).boundingBox();
    const day = await grid.getByRole('gridcell').boundingBox();
    expect(lunch && review && day).toBeTruthy();
    if (!lunch || !review || !day) return;
    // Side by side, each about half of the day's width, which fills the frame beside the gutter.
    expect(review.x).toBeGreaterThanOrEqual(lunch.x + lunch.width - 1);
    expect(lunch.width).toBeGreaterThan(day.width * 0.4);
    expect(day.width).toBeGreaterThan(700);
    await lab.expectAccessible();
  });

  test('UIC-CALENDAR-VIEW-1.3 UIC-CALENDAR-VIEW-4.2 moves by a day from the toolbar and the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const calendar = demo(page);
    await calendar.getByRole('button', { name: 'Next day' }).click();
    await expect(calendar.getByRole('grid', { name: 'Thursday, March 19, 2026' })).toBeVisible();
    await calendar.getByRole('gridcell').focus();
    await page.keyboard.press('PageDown');
    await expect(calendar.getByRole('gridcell')).toHaveAttribute('data-date', '2026-03-20');
    await expect(calendar.getByRole('gridcell')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(calendar.getByRole('gridcell')).toHaveAttribute('data-date', '2026-03-19');
    await expect(calendar.locator('output')).toContainText('2026-03-19, day');
  });

  test('UIC-CALENDAR-VIEW-1.7 UIC-CALENDAR-VIEW-6.3 steps an event by keyboard on the day grid', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const calendar = demo(page);
    await calendar.getByRole('button', { name: /^Standup,/ }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(calendar.locator('output')).toContainText(
      'Saved Standup: 2026-03-18T09:15 to 2026-03-18T09:30',
    );
    await expect(calendar.getByRole('button', { name: /^Standup,/ })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(calendar.getByRole('grid', { name: 'Thursday, March 19, 2026' })).toBeVisible();
    await expect(calendar.getByRole('button', { name: /^Standup,/ })).toBeFocused();
  });

  test('UIC-CALENDAR-VIEW-1.8 UIC-CALENDAR-VIEW-1.3 lists the week by day and keeps the focused day across views', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const calendar = demo(page);
    await calendar.getByRole('radio', { name: 'Agenda' }).click();
    const agenda = calendar.getByRole('group', { name: /Mar 15/ });
    await expect(agenda).toBeVisible();
    await expect(agenda.getByRole('heading')).toHaveText([
      'Sunday, March 15, 2026',
      'Monday, March 16, 2026',
      'Tuesday, March 17, 2026',
      'Wednesday, March 18, 2026',
      'Thursday, March 19, 2026',
      'Friday, March 20, 2026',
    ]);
    const wednesday = agenda.getByRole('group', { name: 'Wednesday, March 18, 2026' });
    await expect(wednesday).toHaveAttribute('aria-current', 'date');
    const times = await wednesday.locator('.ui-calendar-view__event-time').allTextContents();
    expect(times.map(plain).slice(0, 2)).toEqual(['All day', '9:00 – 9:15 AM']);
    await expect(agenda.locator('[data-movable]')).toHaveCount(0);
    await lab.expectAccessible();
    await calendar.getByRole('radio', { name: 'Day' }).click();
    await expect(calendar.getByRole('grid', { name: 'Wednesday, March 18, 2026' })).toBeVisible();
  });

  test('UIC-CALENDAR-VIEW-1.8 UIC-CALENDAR-VIEW-5.2 opens the editor from the agenda and keeps read-only events', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const calendar = demo(page);
    await calendar.getByRole('radio', { name: 'Agenda' }).click();
    await calendar.getByRole('button', { name: /^Board review \(locked\),/ }).click();
    await expect(calendar.locator('output')).toContainText('Opened locked');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await calendar.getByRole('button', { name: /^Team lunch,/ }).click();
    await expect(page.getByRole('dialog', { name: 'Edit event' })).toBeVisible();
  });

  test('UIC-CALENDAR-VIEW-1.8 lists empty days and shows the empty state for a quiet week', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const calendar = demo(page);
    await calendar.getByRole('radio', { name: 'Agenda' }).click();
    await calendar.getByText('List empty days in the agenda').click();
    await expect(calendar.locator('.ui-calendar-view__agenda-day')).toHaveCount(7);
    await calendar.getByRole('button', { name: 'Next week' }).click();
    await calendar.getByRole('button', { name: 'Next week' }).click();
    await expect(calendar.locator('.ui-calendar-view__agenda-empty')).toHaveText(
      'Nothing planned this week. Pick another week or add an event.',
    );
  });

  test('UIC-CALENDAR-VIEW-1.8 stacks times above titles in a narrow host and mirrors right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const calendar = demo(page);
    await calendar.getByRole('radio', { name: 'Agenda' }).click();
    await calendar.getByText('Narrow host (320px)').click();
    const lunch = calendar.getByRole('button', { name: /^Team lunch,/ });
    const time = await lunch.locator('.ui-calendar-view__event-time').boundingBox();
    const title = await lunch.locator('.ui-calendar-view__event-title').boundingBox();
    expect(time && title).toBeTruthy();
    if (!time || !title) return;
    expect(title.y).toBeGreaterThanOrEqual(time.y + time.height - 1);
    const agenda = calendar.locator('.ui-calendar-view__agenda');
    const fits = await agenda.evaluate((element) => element.scrollWidth <= element.clientWidth);
    expect(fits).toBe(true);
    const rtl = page
      .locator('[data-lab-demo="rtl-agenda"]')
      .getByRole('button')
      .filter({
        has: page.locator('.ui-calendar-view__event-time'),
      });
    const rtlEvent = rtl.first();
    const rtlTime = await rtlEvent.locator('.ui-calendar-view__event-time').boundingBox();
    const rtlTitle = await rtlEvent.locator('.ui-calendar-view__event-title').boundingBox();
    expect(rtlTime && rtlTitle).toBeTruthy();
    if (!rtlTime || !rtlTitle) return;
    expect(rtlTime.x).toBeGreaterThan(rtlTitle.x);
  });

  test('UIC-CALENDAR-VIEW-1.7 UIC-CALENDAR-VIEW-1.8 shows the day and agenda states', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const day = matrixCell(page, 'state=events view=day');
    await expect(day.getByRole('grid', { name: 'Wednesday, March 18, 2026' })).toBeVisible();
    const empty = matrixCell(page, 'state=empty view=agenda');
    await expect(empty.locator('.ui-calendar-view__agenda-empty')).toHaveText('No events');
  });
});
