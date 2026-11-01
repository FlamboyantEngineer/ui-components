import type { Locator, Page } from '@playwright/test';
import { controlHeight, expect, matrixCell, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';
import { expectPopoverFits } from './date-popover-fit.js';

function cell(page: Page, state: string, mode: string): Locator {
  return matrixCell(page, `state=${state} mode=${mode}`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

const committed = (page: Page) => page.locator('[data-lab-output="Committed"]');

test.describe('Date Time Field lab', () => {
  test('UIC-DATE-TIME-FIELD-1.1 draws each mode in every state', async ({ page, lab }) => {
    await lab.open('date-time-field');
    const cells = page.locator('table[data-lab-matrix="state mode"] td[data-lab-cell]');
    expect(await cells.count()).toBe(8 * 5);
    const date = cell(page, 'resting', 'date');
    await expect(date.getByRole('group', { name: 'Due' })).toHaveCSS(
      'height',
      `${await controlHeight(page, 'md')}px`,
    );
    await expect(date.getByRole('spinbutton', { name: /^month/ })).toHaveText('4');
    await expect(date.getByRole('button', { name: /Calendar/ })).toBeVisible();
    await expect(
      cell(page, 'resting', 'time').getByRole('button', { name: /Calendar/ }),
    ).toHaveCount(0);
    await expect(
      cell(page, 'resting', 'date-range').locator('.ui-date-time-field__input'),
    ).toHaveCount(2);
    await expect(
      cell(page, 'dirty', 'date').locator('.ui-date-time-field__previous del'),
    ).toHaveText('Apr 10, 2026');
    await expect(cell(page, 'read-only', 'date').locator('.ui-date-time-field__group')).toHaveCSS(
      'border-top-style',
      'dashed',
    );
    await expect(
      cell(page, 'disabled', 'date').getByRole('button', { name: /Calendar/ }),
    ).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-DATE-TIME-FIELD-1.3 UIC-DATE-TIME-FIELD-2.1 UIC-DATE-TIME-FIELD-2.2 picks from the calendar and clears', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const bounded = field(page, 'bounded');
    const group = bounded.getByRole('group', { name: 'Delivery' });
    await bounded.getByRole('button', { name: /Calendar/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const groupBox = await group.boundingBox();
    const dialogBox = await dialog.boundingBox();
    expect(requireDefined(dialogBox).y).toBeGreaterThan(requireDefined(groupBox).y);
    await expect(dialog.getByRole('grid', { name: /April 2026/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /April 13, 2026/ })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(committed(page)).toHaveText('"2026-04-14"');
    await bounded.getByRole('button', { name: /Calendar/ }).click();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(committed(page)).toHaveText('null');
    await expect(group.getByRole('spinbutton', { name: /^month/ })).toHaveAttribute(
      'data-placeholder',
      'true',
    );
  });

  test('UIC-DATE-TIME-FIELD-1.4 keeps a typed value outside the bounds uncommitted and refuses outside days', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const bounded = field(page, 'bounded');
    await bounded.getByRole('spinbutton', { name: /^month/ }).focus();
    await page.keyboard.type('05');
    await expect(bounded.locator('.ui-field__message')).toHaveText(
      /Choose a value on or before Apr 30, 2026\./,
    );
    await expect(committed(page)).toHaveText('"2026-04-13"');
    await expect(bounded.locator('.ui-date-time-field__group')).toHaveCSS(
      'border-top-color',
      'rgb(207, 34, 46)',
    );
    await bounded.getByRole('button', { name: 'Restore Delivery' }).click();
    await bounded.getByRole('button', { name: /Calendar/ }).click();
    await expect(page.getByRole('button', { name: /March 31, 2026/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('UIC-FIELD-4.1 UIC-DATE-TIME-FIELD-1.4 reaches the restore button of an uncommitted value by Tab', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const bounded = field(page, 'bounded');
    await bounded.getByRole('spinbutton', { name: /^month/ }).focus();
    await page.keyboard.type('05');
    await expect(bounded).toHaveAttribute('data-dirty', 'true');
    await bounded.getByRole('spinbutton', { name: /^year/ }).focus();
    await page.keyboard.press('Tab');
    await expect(bounded.getByRole('button', { name: /Calendar/ })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(bounded.getByRole('button', { name: 'Restore Delivery' })).toBeFocused();
    await expect(bounded).toHaveAttribute('data-dirty', 'true');
    await expect(committed(page)).toHaveText('"2026-04-13"');
  });

  test('UIC-DATE-TIME-FIELD-2.1 passes axe in the dark theme, with the calendar open', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field', { theme: 'dark' });
    await lab.expectAccessible();
    await field(page, 'range')
      .getByRole('button', { name: /Calendar/ })
      .click();
    await expect(page.getByRole('grid')).toHaveCount(2);
    await lab.expectAccessible('.ui-date-time-field__popover');
  });

  test('UIC-DATE-TIME-FIELD-3.1 UIC-DATE-TIME-FIELD-3.2 refuses unavailable days and offers presets', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const picked = page.locator('[data-lab-output="Picked"]');
    const availability = field(page, 'availability');
    await availability.getByRole('button', { name: /Calendar/ }).click();
    const dialog = page.getByRole('dialog');
    const saturday = dialog.getByRole('button', { name: /Saturday, April 18, 2026/ });
    await expect(saturday).toHaveCSS('text-decoration-line', 'none');
    await expect(saturday).toHaveAttribute('aria-disabled', 'true');
    const presets = dialog.locator('.ui-date-time-field__presets');
    const calendar = dialog.locator('.ui-date-time-field__calendar');
    expect(requireDefined(await presets.boundingBox()).x).toBeLessThan(
      requireDefined(await calendar.boundingBox()).x,
    );
    await expect(dialog.getByRole('button', { name: 'A Saturday' })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Last year' })).toBeDisabled();
    await lab.expectAccessible('.ui-date-time-field__popover');
    await dialog.getByRole('button', { name: 'Start of April' }).click();
    await expect(dialog).toBeHidden();
    await expect(picked).toHaveText('"2026-04-01"');
    const day = availability.getByRole('spinbutton', { name: /^day/ });
    await day.focus();
    await page.keyboard.type('04');
    await expect(availability.locator('.ui-field__message')).toHaveText(
      'Choose an available date.',
    );
    await expect(picked).toHaveText('"2026-04-01"');

    await field(page, 'range-presets')
      .getByRole('button', { name: /Calendar/ })
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'Easter week' }).click();
    await expect(picked).toHaveText('{"start":"2026-04-06","end":"2026-04-12"}');
  });

  test('UIC-DATE-TIME-FIELD-3.3 jumps to a month and a year from the heading selects', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    await field(page, 'heading')
      .getByRole('button', { name: /Calendar/ })
      .click();
    const dialog = page.getByRole('dialog');
    const month = dialog.locator('.ui-date-time-field__calendar-select[data-unit="month"] button');
    await month.click();
    await page.getByRole('option', { name: 'Dec' }).click();
    await expect(dialog.getByRole('grid', { name: /December 2026/ })).toBeVisible();
    const year = dialog.locator('.ui-date-time-field__calendar-select[data-unit="year"] button');
    await year.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('option', { name: '2028' }).click();
    await expect(dialog.getByRole('grid', { name: /December 2028/ })).toBeVisible();
    await expect(dialog).toBeVisible();
    await lab.expectAccessible('.ui-date-time-field__popover');
    await dialog.getByRole('button', { name: /December 1, 2028/ }).click();
    await expect(field(page, 'heading').getByRole('spinbutton', { name: /^year/ })).toHaveText(
      '2028',
    );
  });

  test('UIC-DATE-TIME-FIELD-4.1 edits seconds', async ({ page, lab }) => {
    await lab.open('date-time-field');
    const zonedOutput = page.locator('[data-lab-output="Zoned"]');
    const seconds = field(page, 'seconds');
    await expect(seconds.getByRole('spinbutton', { name: /^hour/ })).toHaveText('06');
    await expect(seconds.getByRole('spinbutton', { name: /^second/ })).toHaveText('15');
    await seconds.getByRole('spinbutton', { name: /^second/ }).focus();
    await page.keyboard.press('ArrowUp');
    await expect(zonedOutput).toHaveText('"06:30:16"');
    await lab.expectAccessible();
  });

  test('UIC-DATE-TIME-FIELD-4.2 edits a zoned hour', async ({ page, lab }) => {
    await lab.open('date-time-field');
    const zonedOutput = page.locator('[data-lab-output="Zoned"]');
    const zoned = field(page, 'zoned');
    await expect(zoned.getByRole('spinbutton', { name: /^hour/ })).toHaveText('12');
    await expect(zoned.locator('[data-type="timeZoneName"]')).toHaveText(/GMT\+9/);
    await zoned.getByRole('spinbutton', { name: /^hour/ }).focus();
    await page.keyboard.press('ArrowUp');
    await expect(zonedOutput).toHaveText('"2026-04-13T13:00:00+09:00[Asia/Tokyo]"');
    await lab.expectAccessible();
  });

  test('UIC-DATE-TIME-FIELD-4.3 edits a time-range endpoint', async ({ page, lab }) => {
    await lab.open('date-time-field');
    const zonedOutput = page.locator('[data-lab-output="Zoned"]');
    const range = field(page, 'time-range');
    await expect(range.locator('[data-type="timeZoneName"]')).toHaveCount(0);
    await range.getByRole('spinbutton', { name: /^hour/ }).nth(1).focus();
    await page.keyboard.press('ArrowDown');
    await expect(zonedOutput).toHaveText(
      '{"start":"2026-04-13T09:00:00+00:00[UTC]","end":"2026-04-13T16:00:00+00:00[UTC]"}',
    );
    await lab.expectAccessible();
  });

  test('UIC-DATE-TIME-FIELD-4.4 shows a range end error from its form until that end changes', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const stay = field(page, 'server-error');
    const booking = page.locator('[data-lab-output="Booking"]');
    await expect(stay.getByText('This end date is fully booked.')).toBeVisible();
    await page.getByRole('button', { name: 'Book' }).click();
    await expect(booking).toHaveText('none');
    await stay.getByRole('spinbutton', { name: /^day/ }).nth(1).focus();
    await page.keyboard.press('ArrowUp');
    await expect(stay.getByText('This end date is fully booked.')).toHaveCount(0);
    await page.getByRole('button', { name: 'Book' }).click();
    await expect(booking).toHaveText('sent');
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`UIC-DATE-TIME-FIELD-2.1 fits its calendars in a 320 pixel viewport (${dir})`, async ({
      page,
      lab,
    }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await lab.open('date-time-field');
      await page.evaluate((value) => document.documentElement.setAttribute('dir', value), dir);
      for (const name of ['range', 'availability', 'range-presets', 'heading']) {
        const trigger = field(page, name).getByRole('button', { name: /Calendar/ });
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
        await expectPopoverFits(page.locator('.ui-date-time-field__popover'));
        await page.keyboard.press('Escape');
        await expect(page.locator('.ui-date-time-field__popover')).toHaveCount(0);
      }
    });
  }
});

test.describe('Date Time Field lab in another time zone', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('UIC-DATE-TIME-FIELD-1.2 shows an offset value as wall time in the browser zone', async ({
    page,
    lab,
  }) => {
    await lab.open('date-time-field');
    const launch = field(page, 'offset');
    await expect(launch.getByRole('spinbutton', { name: /^hour/ })).toHaveText('11');
    await expect(launch.getByRole('spinbutton', { name: /^day/ })).toHaveText('13');
  });
});

test('UIC-DATE-TIME-FIELD-1.1 keeps the space before the day period', async ({ page, lab }) => {
  await lab.open('date-time-field');
  const period = cell(page, 'resting', 'date-time').locator('[data-type="dayPeriod"]').first();
  const space = period.locator('xpath=preceding-sibling::*[1]');
  await expect(space).toHaveAttribute('data-type', 'literal');
  expect(await space.evaluate((element) => element.textContent)).toBe(' ');
  expect((await space.boundingBox())?.width).toBeGreaterThan(1);
});

test('UIC-DATE-TIME-FIELD-1.1 keeps the label beside the control and a range inside its frame', async ({
  page,
  lab,
}) => {
  await lab.open('date-time-field');
  const after = matrixCell(page, 'layout=control-label').locator('.ui-date-time-field');
  const group = await after.locator('.ui-date-time-field__group').boundingBox();
  const label = await after.locator('.ui-field__label').boundingBox();
  if (!group || !label) throw new Error('field not drawn');
  const gap = label.x - (group.x + group.width);
  expect(gap).toBeGreaterThanOrEqual(4);
  expect(gap).toBeLessThanOrEqual(8);

  const shift = page.locator('[data-lab-field="time-range"]');
  const contained = () =>
    shift.locator('.ui-date-time-field__group').evaluate((frame) => {
      const box = frame.getBoundingClientRect();
      const parts = [
        ...frame.querySelectorAll(
          '.ui-date-time-field__segment, .ui-date-time-field__separator, .ui-date-time-field__button',
        ),
      ];
      return parts.every((part) => {
        const rect = part.getBoundingClientRect();
        return (
          rect.left >= box.left - 0.5 &&
          rect.right <= box.right + 0.5 &&
          rect.top >= box.top - 0.5 &&
          rect.bottom <= box.bottom + 0.5
        );
      });
    });
  expect(await contained()).toBe(true);
  expect(
    await shift.locator('.ui-date-time-field__group').evaluate((frame) => frame.clientHeight),
  ).toBeLessThan(40);
  await page.setViewportSize({ width: 330, height: 800 });
  await expect.poll(contained).toBe(true);
  const end = shift.getByRole('spinbutton', { name: /minute/i }).last();
  await end.click();
  await expect(end).toBeFocused();
  await shift.getByRole('button', { name: /Calendar/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
