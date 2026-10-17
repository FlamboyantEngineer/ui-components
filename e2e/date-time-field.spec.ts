import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, mode: string): Locator {
  return page.locator(`[data-lab-cell="state=${state} mode=${mode}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

const committed = (page: Page) => page.locator('[data-lab-output="Committed"]');

test.describe('Date Time Field lab', () => {
  test('UIC-DATE-TIME-FIELD-1.1 draws each mode in every state', async ({ page, lab }) => {
    await lab.open('date-time-field');
    const cells = page.locator('table[data-lab-matrix="state mode"] td[data-lab-cell]');
    expect(await cells.count()).toBe(8 * 4);
    const date = cell(page, 'resting', 'date');
    await expect(date.getByRole('group', { name: 'Due' })).toHaveCSS('height', '28px');
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
    expect(dialogBox!.y).toBeGreaterThan(groupBox!.y);
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
});
