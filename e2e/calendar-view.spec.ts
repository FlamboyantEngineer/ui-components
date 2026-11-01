import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const plain = (text: string) => text.replace(/[\u00a0\u2009\u202f]/g, ' ');
const interactive = (page: Page) => page.locator('[data-lab-demo="interactive"]');
const day = (page: Page, date: string) => interactive(page).locator(`[data-date="${date}"]`);

test.describe('Calendar View lab', () => {
  test('UIC-CALENDAR-VIEW-1.1 UIC-CALENDAR-VIEW-1.2 UIC-CALENDAR-VIEW-1.4 UIC-CALENDAR-VIEW-4.1 shows each view with today marked', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const month = matrixCell(page, 'state=events view=month');
    await expect(month.getByRole('grid', { name: 'March 2026' })).toBeVisible();
    await expect(month.getByRole('columnheader').locator('[aria-hidden]')).toHaveText([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    const today = month.getByRole('gridcell', { name: /^Wednesday, March 18, 2026/ });
    await expect(today).toHaveAttribute('aria-current', 'date');
    await expect(today.locator('.ui-calendar-view__day-number')).toHaveCSS('font-weight', '600');
    await expect(month.locator('[data-outside-month]')).toHaveCount(4);
    const week = matrixCell(page, 'state=events view=week');
    await expect(week.locator('.ui-calendar-view__weekday[data-today] [aria-hidden]')).toHaveText(
      'Wed 18',
    );
    await expect(week.locator('.ui-calendar-view__hour')).toHaveCount(24);
    await expect(week.locator('.ui-calendar-view__views')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-CALENDAR-VIEW-2.3 UIC-CALENDAR-VIEW-2.5 draws bars across days and timed events on the time grid', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const month = matrixCell(page, 'state=events view=month');
    const trip = month.locator('[data-date="2026-03-12"] .ui-calendar-view__event');
    const thursday = await month.locator('[data-date="2026-03-12"]').boundingBox();
    const tripBox = await trip.boundingBox();
    expect(tripBox?.width).toBeGreaterThan((thursday?.width ?? 0) * 2.8);
    await expect(trip).toHaveAttribute('data-continues-after', 'true');
    const week = matrixCell(page, 'state=events view=week');
    const lunch = week.getByRole('button', { name: /^Team lunch/ });
    const review = week.getByRole('button', { name: /^Design review/ });
    const [lunchBox, reviewBox] = [await lunch.boundingBox(), await review.boundingBox()];
    expect(lunchBox && reviewBox && reviewBox.x > lunchBox.x).toBe(true);
    expect(lunchBox && reviewBox && reviewBox.y > lunchBox.y).toBe(true);
    const audit = week.getByRole('button', { name: /^Audit/ });
    const timed = await week
      .locator('[data-date="2026-03-19"] .ui-calendar-view__timed')
      .boundingBox();
    const auditBox = await audit.boundingBox();
    // 8:00 to 11:00 is a third to almost half of the day.
    expect(((auditBox?.y ?? 0) - (timed?.y ?? 0)) / (timed?.height ?? 1)).toBeCloseTo(8 / 24, 2);
    expect((auditBox?.height ?? 0) / (timed?.height ?? 1)).toBeCloseTo(3 / 24, 2);
  });

  test('UIC-CALENDAR-VIEW-2.5 keeps events under their hour labels on clock-change days', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const offset = async (demo: string, date: string, name: RegExp) => {
      const week = page.locator(`[data-lab-demo="clock-change-${demo}"]`);
      const timed = await week
        .locator(`[data-date="${date}"] .ui-calendar-view__timed`)
        .boundingBox();
      const box = await week.getByRole('button', { name }).first().boundingBox();
      return ((box?.y ?? 0) - (timed?.y ?? 0)) / (timed?.height ?? 1);
    };
    const label = async (demo: string, text: string) => {
      const week = page.locator(`[data-lab-demo="clock-change-${demo}"]`);
      const timed = await week
        .locator('.ui-calendar-view__gutter .ui-calendar-view__timed')
        .boundingBox();
      const hour = await week
        .locator('.ui-calendar-view__hour', { hasText: new RegExp(`^${text}$`) })
        .boundingBox();
      return ((hour?.y ?? 0) - (timed?.y ?? 0)) / (timed?.height ?? 1);
    };
    for (const [demo, day, next] of [
      ['2026-03-08', '2026-03-08', '2026-03-09'],
      ['2026-11-01', '2026-11-01', '2026-11-02'],
    ] as const) {
      const noon = await label(demo, '12 PM');
      expect(noon).toBeCloseTo(0.5, 2);
      expect(await offset(demo, day, /^Noon call/)).toBeCloseTo(noon, 2);
      expect(await offset(demo, next, /^Noon call/)).toBeCloseTo(noon, 2);
    }
    const openDay = page
      .locator('[data-lab-demo="clock-change-2026-03-08"]')
      .getByRole('button', { name: /^Open day/ });
    await expect(
      openDay.locator('xpath=ancestor::*[contains(@class,"ui-calendar-view__all-day")]'),
    ).toHaveCount(1);
    expect(await offset('2026-03-08', '2026-03-08', /^Night shift/)).toBeCloseTo(
      (await label('2026-03-08', '1 AM')) + 0.5 / 24,
      2,
    );
    const fall = page.locator('[data-lab-demo="clock-change-2026-11-01"]');
    const first = await fall
      .getByRole('button', { name: /^First pass, 1:30\sAM EDT/ })
      .boundingBox();
    const second = await fall
      .getByRole('button', { name: /^Second pass, 1:30\sAM EST/ })
      .boundingBox();
    expect(first?.y).toBeCloseTo(second?.y ?? 0, 0);
    expect((second?.x ?? 0) > (first?.x ?? 0)).toBe(true);
  });

  test('UIC-CALENDAR-VIEW-1.3 UIC-CALENDAR-VIEW-2.2 navigates periods and views and opens events', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const calendar = interactive(page);
    const output = calendar.locator('[data-lab-output]');
    await calendar.getByRole('button', { name: 'Next month' }).click();
    await expect(calendar.getByRole('grid', { name: 'April 2026' })).toBeVisible();
    await expect(output).toHaveText('2026-04-18, month. No event opened');
    await calendar.getByRole('button', { name: 'Today' }).click();
    await calendar.getByRole('radio', { name: 'Week' }).click();
    await expect(output).toHaveText('2026-03-18, week. No event opened');
    const title = plain((await calendar.locator('.ui-calendar-view__title').textContent()) ?? '');
    expect(title).toBe('Mar 15 – 21, 2026');
    await calendar.getByRole('button', { name: /^Audit, 8:00/ }).click();
    await expect(output).toHaveText('2026-03-19, week. Opened audit');
    await calendar.getByRole('button', { name: 'Previous week' }).click();
    await expect(output).toContainText('2026-03-12, week');
  });

  test('UIC-CALENDAR-VIEW-2.4 UIC-CALENDAR-VIEW-3.1 lists a crowded day behind more and shows day content', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const crowded = day(page, '2026-03-18');
    await expect(crowded.locator('.ui-calendar-view__day-content')).toHaveText('6 events');
    await expect(day(page, '2026-04-03').locator('.ui-calendar-view__day-content')).toHaveText(
      'Holiday',
    );
    await expect(crowded.locator('.ui-calendar-view__event')).toHaveCount(2);
    await crowded.getByRole('button', { name: '+4 more' }).click();
    const dialog = page.getByRole('dialog', { name: 'Wednesday, March 18, 2026' });
    await expect(dialog.locator('.ui-calendar-view__event')).toHaveCount(6);
    await expect(dialog).not.toHaveAttribute('data-entering');
    await lab.expectAccessible('[role="dialog"]');
    await dialog.getByRole('button', { name: /^Design review/ }).click();
    await expect(interactive(page).locator('[data-lab-output]')).toHaveText(
      '2026-03-18, month. Opened review',
    );
  });

  for (const view of ['Month', 'Week'] as const) {
    test(`UIC-CALENDAR-VIEW-2.2 keeps a focused event's button through repacked lanes (${view})`, async ({
      page,
      lab,
    }) => {
      await lab.open('calendar-view');
      const calendar = page.locator('[data-lab-demo="live-lanes"]');
      const output = calendar.locator('[data-lab-output]');
      await calendar.getByRole('radio', { name: view }).click();
      const inventory = calendar.getByRole('button', { name: /^Inventory count,/ });
      await calendar.getByRole('button', { name: 'Add an earlier event in a second' }).click();
      await inventory.focus();
      const prep = calendar.getByRole('button', { name: /^Audit prep,/ });
      await expect(prep).toBeVisible();
      await expect(inventory).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(output).toHaveText('Opened inventory');
      await calendar.getByRole('button', { name: 'Rename Audit prep in a second' }).click();
      await prep.focus();
      const renamed = calendar.getByRole('button', { name: /^Wrap-up,/ });
      await expect(renamed).toBeVisible();
      await expect(renamed).toBeFocused();
      await page.keyboard.press('Space');
      await expect(output).toHaveText('Opened prep');
    });
  }

  test('UIC-CALENDAR-VIEW-1.3 shows an allowed view as the allowed views change', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const area = page.locator('[data-lab-case="allowed-views"]');
    const calendar = area.locator('.ui-calendar-view');
    await expect(calendar).toHaveAttribute('data-view', 'week');
    await expect(area.getByRole('radiogroup')).toHaveCount(0);
    await area.getByText('Allow month').click();
    await area.getByRole('radio', { name: 'Month' }).click();
    await expect(calendar).toHaveAttribute('data-view', 'month');
    await area.getByText('Allow month').click();
    await expect(calendar).toHaveAttribute('data-view', 'week');
    await area.getByText('Allow month').click();
    await expect(calendar).toHaveAttribute('data-view', 'month');
  });

  test('UIC-CALENDAR-VIEW-4.2 moves between days by keyboard', async ({ page, lab }) => {
    await lab.open('calendar-view');
    const calendar = interactive(page);
    await day(page, '2026-03-18').focus();
    await page.keyboard.press('ArrowRight');
    await expect(day(page, '2026-03-19')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    await expect(day(page, '2026-03-28')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(calendar.getByRole('button', { name: /^Dentist/ })).toHaveCount(1);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('PageDown');
    await expect(calendar.getByRole('grid', { name: 'April 2026' })).toBeVisible();
    await expect(day(page, '2026-04-28')).toBeFocused();
    await expect(calendar.locator('[data-lab-output]')).toHaveText(
      '2026-04-28, month. No event opened',
    );
  });

  test('UIC-CALENDAR-VIEW-2.5 packs overlapping events from the right edge right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('calendar-view');
    const day = page.locator(
      '[data-lab-demo="rtl"] [data-date="2026-03-18"] .ui-calendar-view__timed',
    );
    const [first, second] = await day
      .locator(':scope > *')
      .evaluateAll((blocks) =>
        blocks
          .filter((block) => block instanceof HTMLElement && block.style.width === '50%')
          .map((block) => block.getBoundingClientRect().x),
      );
    expect(first).toBeGreaterThan(second ?? Infinity);
  });

  test('UIC-CALENDAR-VIEW-1.5 follows the provider locale', async ({ page, lab }) => {
    await lab.open('calendar-view');
    const french = page.locator('[data-lab-demo="locale"]');
    await expect(french.getByRole('columnheader').first().locator('[aria-hidden]')).toHaveText(
      /^lun\. 16$/,
    );
    await expect(french.getByRole('button', { name: 'Semaine suivante' })).toBeVisible();
    await expect(french.getByRole('button', { name: /^Audit, 08:00/ })).toBeVisible();
  });
});
