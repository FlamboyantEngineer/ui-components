import type { Locator, Page } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { expectPopoverFits } from './date-popover-fit.js';
import { expect, matrixCell, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

test.describe('Relative Date Field lab', () => {
  test('UIC-RELATIVE-DATE-FIELD-1.1 UIC-RELATIVE-DATE-FIELD-1.3 commits a preset picked from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    const cells = page.locator('table[data-lab-matrix="state layout"] td[data-lab-cell]');
    expect(await cells.count()).toBe(8 * 4);
    const presets = field(page, 'presets');
    const trigger = presets.getByRole('button', { name: 'Today Due' });
    await expect(presets.locator('time')).toHaveAttribute('datetime', '2026-04-20');
    await expect(presets.locator('time')).toHaveText('Apr 20, 2026');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveText([
      'Today',
      'Tomorrow',
      'Yesterday',
      'Next week',
      'Last week',
    ]);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(listbox).toBeHidden();
    await expect(page.locator('[data-lab-output="Committed"]')).toHaveText('2026-04-21');
    await expect(presets.getByRole('button', { name: 'Tomorrow Due' })).toBeFocused();
    await expect(presets.locator('time')).toHaveAttribute('datetime', '2026-04-21');
    await lab.expectAccessible();
  });

  test('UIC-FIELD-4.1 UIC-RELATIVE-DATE-FIELD-1.4 reaches the restore button of a dirty field by Tab', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    const dirty = matrixCell(page, 'state=dirty layout=label-control').locator('.ui-field');
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await dirty.getByRole('button', { name: /Apr 27, 2026/ }).focus();
    await page.keyboard.press('Tab');
    await expect(dirty.getByRole('button', { name: 'Restore Due' })).toBeFocused();
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
  });

  test('UIC-RELATIVE-DATE-FIELD-1.3 passes axe in the dark theme, with the presets open', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field', { theme: 'dark' });
    await lab.expectAccessible();
    await field(page, 'custom')
      .getByRole('button', { name: /Follow up$/ })
      .click();
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText([
      'In 3 days',
      'In 2 weeks',
      'Next month',
      'Next year',
    ]);
    await lab.expectAccessible('.ui-relative-date-field__popover');
  });

  test('UIC-RELATIVE-DATE-FIELD-2.1 picks any day from the calendar beside the presets', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    const extra = page.locator('[data-lab-output="Extra"]');
    const calendarField = field(page, 'calendar');
    const trigger = calendarField.getByRole('button', { name: 'Tomorrow Review' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const popover = page.locator('.ui-relative-date-field__popover');
    const listbox = popover.getByRole('listbox');
    const calendar = popover.locator('.ui-relative-date-field__calendar');
    await expect(calendar.getByRole('grid', { name: /April 2026/ })).toBeVisible();
    expect(requireDefined(await calendar.boundingBox()).x).toBeGreaterThan(
      requireDefined(await listbox.boundingBox()).x,
    );
    await lab.expectAccessible('.ui-relative-date-field__popover');
    await page.keyboard.press('Tab');
    await expect(calendar.getByRole('button', { name: 'Previous' })).toBeFocused();
    await calendar.getByRole('button', { name: /April 24, 2026/ }).click();
    await expect(popover).toHaveCount(0);
    await expect(extra).toHaveText('"2026-04-24"');
    await expect(calendarField.getByRole('button', { name: 'In 4 days Review' })).toBeFocused();
  });

  test('UIC-RELATIVE-DATE-FIELD-2.2 UIC-RELATIVE-DATE-FIELD-2.3 UIC-RELATIVE-DATE-FIELD-2.4 lists named, range and bounded presets', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    const extra = page.locator('[data-lab-output="Extra"]');
    await field(page, 'labelled')
      .getByRole('button', { name: /Deadline$/ })
      .click();
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText([
      'In a fortnight',
      'End of month',
    ]);
    await page.getByRole('option', { name: 'End of month' }).click();
    await expect(extra).toHaveText('"2026-04-30"');

    const range = field(page, 'range');
    await range.getByRole('button', { name: /Report period$/ }).click();
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText([
      'Today',
      'Last 7 days',
      'Last 30 days',
      'Next 7 days',
    ]);
    await page.getByRole('option', { name: 'Next 7 days' }).click();
    await expect(extra).toHaveText('{"start":"2026-04-20","end":"2026-04-27"}');
    await expect(
      range.getByRole('button', { name: 'Today – Apr 27, 2026 Report period' }),
    ).toBeVisible();
    await expect(range.locator('.ui-relative-date-field__preview time')).toHaveCount(2);

    const bounded = field(page, 'bounded');
    await bounded.getByRole('button', { name: /Delivery$/ }).click();
    const options = page.getByRole('listbox').getByRole('option');
    await expect(page.getByRole('option', { name: 'Yesterday' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page.getByRole('option', { name: 'Next week' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(options.filter({ hasText: 'Yesterday' })).toHaveCSS(
      'text-decoration-line',
      'line-through',
    );
    await expect(
      page
        .locator('.ui-relative-date-field__calendar')
        .getByRole('button', { name: /April 26, 2026/ }),
    ).toHaveAttribute('aria-disabled', 'true');
    await lab.expectAccessible('.ui-relative-date-field__popover');
    await page.keyboard.press('Escape');
    await lab.expectAccessible();
  });

  test('UIC-RELATIVE-DATE-FIELD-1.6 submits named values with their form', async ({
    page,
    lab,
  }) => {
    await lab.open('relative-date-field');
    const form = page.locator('form').filter({ has: page.locator('[data-lab-output="Form"]') });
    const submit = form.getByRole('button', { name: 'Submit' });
    const entries = page.locator('[data-lab-output="Form"]');
    await submit.click();
    await expect(entries).toHaveText(
      'follow-up=2026-04-21 period-start=2026-04-13 period-end=2026-04-20',
    );
    await form.getByRole('button', { name: /Follow-up$/ }).click();
    await page.getByRole('option', { name: 'Next week' }).click();
    await submit.click();
    await expect(entries).toHaveText(
      'follow-up=2026-04-27 period-start=2026-04-13 period-end=2026-04-20',
    );
    await form.getByRole('button', { name: 'Reset' }).click();
    await submit.click();
    await expect(entries).toHaveText(
      'follow-up=2026-04-21 period-start=2026-04-13 period-end=2026-04-20',
    );
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`UIC-RELATIVE-DATE-FIELD-1.6 fits presets and calendar in a 320 pixel viewport (${dir})`, async ({
      page,
      lab,
    }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await lab.open('relative-date-field');
      await page.evaluate((value) => document.documentElement.setAttribute('dir', value), dir);
      const popover = page.locator('.ui-relative-date-field__popover');
      for (const [name, label] of [
        ['range', /Report period$/],
        ['calendar', /Review$/],
      ] as const) {
        const trigger = field(page, name).getByRole('button', { name: label });
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
        await expectPopoverFits(popover);
        await page.keyboard.press('Escape');
        await expect(popover).toHaveCount(0);
      }
    });
  }
});
