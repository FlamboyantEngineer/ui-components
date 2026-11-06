import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

test.describe('Multi Date Field lab', () => {
  test('UIC-MULTI-DATE-FIELD-1.1 renders its states accessibly', async ({ lab }) => {
    await lab.open('multi-date-field');
    await lab.expectAccessible();
  });

  test('UIC-MULTI-DATE-FIELD-1.3 toggles days by pointer and keyboard across months', async ({
    page,
    lab,
  }) => {
    await lab.open('multi-date-field');
    const picking = field(page, 'picking');
    const calendar = picking.locator('.ui-multi-date-field__calendar');
    const output = page.locator('[data-lab-output="Picked"]');
    const tags = picking.getByRole('grid', { name: 'Team days selected values' });
    await expect(tags.getByRole('row')).toHaveCount(2);
    await calendar.getByRole('button', { name: /April 9, 2026/ }).click();
    await expect(output).toHaveText('["2026-04-08","2026-04-09","2026-04-20"]');
    await expect(calendar.getByRole('button', { name: /April 9, 2026/ })).toHaveAttribute(
      'data-selected',
      'true',
    );
    // From 30 April the keyboard crosses into May and picks it.
    await calendar.getByRole('button', { name: /April 30, 2026/ }).click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(output).toHaveText(
      '["2026-04-08","2026-04-09","2026-04-20","2026-04-30","2026-05-01"]',
    );
    await calendar.getByRole('button', { name: /May 1, 2026/ }).press('Space');
    await expect(output).toHaveText('["2026-04-08","2026-04-09","2026-04-20","2026-04-30"]');
  });

  test('UIC-MULTI-DATE-FIELD-1.3 removes dates from their tags and keeps focus in the field', async ({
    page,
    lab,
  }) => {
    await lab.open('multi-date-field');
    const picking = field(page, 'picking');
    const tags = picking.getByRole('grid', { name: 'Team days selected values' });
    await tags.getByRole('row').first().focus();
    await page.keyboard.press('Delete');
    await expect(tags.getByRole('row')).toHaveCount(1);
    await expect(tags.getByRole('row').first()).toBeFocused();
    await page.keyboard.press('Backspace');
    await expect(tags).toHaveCount(0);
    await expect(picking.locator('.ui-date-time-field__calendar-cell[tabindex="0"]')).toBeFocused();
    await expect(page.locator('[data-lab-output="Picked"]')).toHaveText('[]');
  });

  test('UIC-MULTI-DATE-FIELD-1.4 refuses unavailable days and days past the limit', async ({
    page,
    lab,
  }) => {
    await lab.open('multi-date-field');
    const rules = field(page, 'rules');
    const output = page.locator('[data-lab-output="Office"]');
    // Unavailable and taken days are disabled, so the presses are forced.
    await rules.getByRole('button', { name: /Saturday, April 18, 2026/ }).click({ force: true });
    await rules.getByRole('button', { name: /Wednesday, April 15, 2026/ }).click({ force: true });
    await expect(output).toHaveText('[]');
    await rules.getByRole('button', { name: /Thursday, April 16, 2026/ }).click();
    await expect(output).toHaveText('["2026-04-13","2026-04-14","2026-04-16"]');
    const friday = rules.getByRole('button', { name: /Friday, April 17, 2026/ });
    await expect(friday).toHaveAttribute('data-unavailable', 'true');
    await friday.click({ force: true });
    await expect(output).toHaveText('["2026-04-13","2026-04-14","2026-04-16"]');
  });

  test('UIC-MULTI-DATE-FIELD-1.5 submits the name once per date', async ({ page, lab }) => {
    await lab.open('multi-date-field');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('[data-lab-output="Form"]')).toHaveText(
      'date=2026-04-07 date=2026-04-21',
    );
  });

  test('UIC-MULTI-DATE-FIELD-1.1 mirrors right to left with week numbers at the inline start', async ({
    page,
    lab,
  }) => {
    await lab.open('multi-date-field');
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    const planning = field(page, 'planning');
    await expect(planning.getByRole('grid')).toHaveCount(2);
    const week = await planning.getByRole('rowheader').first().boundingBox();
    const day = await planning.locator('.ui-date-time-field__calendar-cell').first().boundingBox();
    if (!week || !day) throw new Error('calendar not drawn');
    expect(week.x).toBeGreaterThan(day.x);
  });
});
