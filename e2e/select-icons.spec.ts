import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-family="icons"] [data-lab-field="${name}"]`);
}

test.describe('Select Field icon choices lab', () => {
  test('UIC-SELECT-FIELD-11.1 UIC-SELECT-FIELD-11.3 shows icons and keeps a no-icon choice', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const cells = page.locator(
      '[data-lab-family="icons"] table[data-lab-matrix="state layout"] td[data-lab-cell]',
    );
    expect(await cells.count()).toBe(8 * 4);
    const symbol = field(page, 'symbol');
    const trigger = symbol.getByRole('button', { name: 'Square Symbol' });
    const icon = trigger.locator('.ui-select-field__value-icon');
    await expect(icon).toBeVisible();
    expect((await icon.boundingBox())?.width).toBe(18);
    await trigger.click();
    const options = page.locator('.ui-select-field__listbox').getByRole('option');
    await expect(options.first()).toHaveText('No icon');
    expect(
      await page.locator('.ui-select-field__listbox .ui-select-field__option-icon').count(),
    ).toBe(5);
    await expect(page.getByRole('searchbox')).toHaveCount(0);
    await options.first().click();
    await expect(
      page.locator('[data-lab-family="icons"] [data-lab-output="Committed"]'),
    ).toHaveText('none');
    await expect(symbol.getByRole('button', { name: 'No icon Symbol' })).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-SELECT-FIELD-11.1 passes axe in the dark theme, with the list open', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field', { theme: 'dark' });
    await lab.expectAccessible();
    await field(page, 'symbol').getByRole('button', { name: 'Square Symbol' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await lab.expectAccessible('.ui-select-field__popover');
  });
});
