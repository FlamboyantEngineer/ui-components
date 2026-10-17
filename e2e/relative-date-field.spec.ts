import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

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
});
