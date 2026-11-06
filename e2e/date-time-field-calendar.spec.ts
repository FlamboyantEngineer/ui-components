import type { Locator, Page } from '@playwright/test';
import { expectPopoverFits } from './date-popover-fit.js';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

async function openCalendar(page: Page, name: string): Promise<Locator> {
  const trigger = field(page, name).getByRole('button', { name: /Calendar/ });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('Date Time Field calendar options', () => {
  test('UIC-DATE-TIME-FIELD-3.5 shows three months side by side and picks a range across them', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const dialog = await openCalendar(page, 'visible-months');
    const grids = dialog.getByRole('grid');
    await expect(grids).toHaveCount(3);
    await expect(dialog.locator('.ui-date-time-field__calendar-month')).toHaveText([
      'March 2026',
      'April 2026',
      'May 2026',
    ]);
    // The months sit in one row on a wide viewport.
    const boxes = await grids.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().top),
    );
    expect(new Set(boxes.map(Math.round)).size).toBe(1);
    await expect(dialog.locator('xpath=..')).not.toHaveAttribute('data-entering', /.*/);
    await lab.expectAccessible('.ui-date-time-field__dialog');
    await dialog.getByRole('button', { name: /March 30, 2026/ }).click();
    await dialog.getByRole('button', { name: /May 2, 2026/ }).click();
    await expect(page.locator('[data-lab-output="Months"]')).toHaveText(
      '{"start":"2026-03-30","end":"2026-05-02"}',
    );
  });

  test('UIC-DATE-TIME-FIELD-3.5 crosses months and a year from the keyboard and pages one month', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const dialog = await openCalendar(page, 'month-paging');
    await expect(dialog.getByRole('button', { name: /December 30, 2026/ })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('button', { name: /January 1, 2027/ })).toBeFocused();
    const header = dialog.locator('.ui-date-time-field__calendar-header');
    await header.getByRole('button', { name: 'Next' }).click();
    await expect(dialog.getByRole('grid')).toHaveCount(2);
    await expect(dialog.getByRole('grid').first()).toHaveAccessibleName(/January 2027/);
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`UIC-DATE-TIME-FIELD-3.5 stacks three months in a 320 pixel viewport (${dir})`, async ({
      page,
      lab,
    }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await lab.open('date-time-field');
      await page.evaluate((value) => document.documentElement.setAttribute('dir', value), dir);
      await openCalendar(page, 'visible-months');
      await expectPopoverFits(page.locator('.ui-date-time-field__popover'));
    });
  }
});

test.describe('Date Time Field weeks', () => {
  test('UIC-DATE-TIME-FIELD-3.6 numbers ISO weeks across the turn of the year as row headers', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const dialog = await openCalendar(page, 'iso-weeks');
    const december = dialog.getByRole('grid', { name: /December 2026/ });
    await expect(december.getByRole('rowheader').last()).toHaveAccessibleName('Week 53');
    const january = dialog.getByRole('grid', { name: /January 2027/ });
    await expect(january.getByRole('rowheader').first()).toHaveAccessibleName('Week 53');
    await expect(january.getByRole('rowheader').nth(1)).toHaveAccessibleName('Week 1');
    await expect(dialog.locator('.ui-date-time-field__calendar-weekday').first()).toHaveText('M');
    await expect(dialog.getByRole('button', { name: /December 30, 2026/ })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.getByRole('button', { name: /December 27, 2026/ })).toBeFocused();
    await lab.expectAccessible('.ui-date-time-field__dialog');
  });

  test('UIC-DATE-TIME-FIELD-3.6 reorders headers and days by the week start', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const dialog = await openCalendar(page, 'week-start');
    const grids = dialog.getByRole('grid');
    await expect(grids).toHaveCount(2);
    for (const grid of await grids.all()) {
      await expect(grid.locator('.ui-date-time-field__calendar-weekday').first()).toHaveText('S');
      await expect(grid.locator('.ui-date-time-field__calendar-weekday').nth(1)).toHaveText('S');
    }
    // The week number sits before the first day.
    const week = await dialog.getByRole('rowheader').first().boundingBox();
    const day = await dialog.locator('.ui-date-time-field__calendar-cell').first().boundingBox();
    if (!week || !day) throw new Error('calendar not drawn');
    expect(week.x).toBeLessThan(day.x);
  });
});
