import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function section(page: Page, title: string): Locator {
  return page.locator(`[data-lab-section="${title}"]`);
}

function cell(page: Page, variant: string, state: string, size: string): Locator {
  return page.locator(`[data-lab-cell="variant=${variant} state=${state} size=${size}"]`);
}

test.describe('Combobox lab', () => {
  test('UIC-COMBOBOX-1.1 UIC-COMBOBOX-1.2 draws fields at three sizes with the search variant', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const cells = page.locator('table[data-lab-matrix="variant state size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(2 * 6 * 3);
    for (const [size, height] of [
      ['sm', 26],
      ['md', 32],
      ['lg', 38],
    ] as const) {
      const field = cell(page, 'default', 'resting', size).locator('.ui-combobox__field');
      expect((await field.boundingBox())?.height).toBe(height);
    }
    await expect(
      cell(page, 'search', 'resting', 'md').locator('.ui-combobox__search-icon'),
    ).toBeVisible();
    await expect(
      cell(page, 'default', 'resting', 'md').locator('.ui-combobox__search-icon'),
    ).toHaveCount(0);
    await expect(cell(page, 'default', 'resting', 'md').getByRole('combobox')).toHaveAccessibleName(
      'default resting md',
    );
    await lab.expectAccessible();
  });

  test('UIC-COMBOBOX-1.3 shows disabled, read-only, invalid and pending states', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    await expect(cell(page, 'default', 'disabled', 'md').getByRole('combobox')).toBeDisabled();
    await expect(
      cell(page, 'default', 'disabled', 'md').locator('.ui-combobox__clear'),
    ).toHaveCount(0);
    const readOnly = cell(page, 'default', 'read-only', 'md');
    await expect(readOnly.getByRole('combobox')).toHaveAttribute('readonly', '');
    await expect(readOnly.locator('.ui-combobox__field')).toHaveCSS('border-top-style', 'dashed');
    await expect(cell(page, 'default', 'invalid', 'md').locator('.ui-combobox__error')).toHaveText(
      'Not in season',
    );
    const pending = cell(page, 'search', 'pending', 'md');
    await expect(pending.getByRole('combobox')).toHaveAttribute('aria-busy', 'true');
    await expect(pending.locator('.ui-combobox__spinner')).toBeVisible();
  });

  test('UIC-COMBOBOX-1.4 clears the text and keeps focus in the input', async ({ page, lab }) => {
    await lab.open('combobox');
    const field = cell(page, 'default', 'with value', 'md');
    const input = field.getByRole('combobox');
    await expect(input).toHaveValue('Apple');
    await field.getByRole('button', { name: 'Clear' }).click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(field.locator('.ui-combobox__clear')).toHaveCount(0);
  });

  test('UIC-COMBOBOX-2.1 UIC-COMBOBOX-2.3 UIC-COMBOBOX-2.4 UIC-COMBOBOX-2.7 filters, highlights and picks by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const area = section(page, 'Picking');
    const input = area.getByRole('combobox', { name: 'Fruit' });
    await input.click();
    await page.keyboard.type('e');
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole('option')).toHaveCount(5);
    await expect(listbox.getByRole('group', { name: 'Citrus' })).toBeVisible();
    await expect(listbox.getByRole('option', { name: /^Lime/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    const popover = page.locator('.ui-combobox__popover');
    await expect(popover).toHaveAttribute('data-layer', 'dropdown');
    await expect(popover).toHaveCSS('z-index', '130');
    const fieldBox = await area.locator('.ui-combobox__field').boundingBox();
    const popoverBox = await popover.boundingBox();
    expect(
      Math.abs((popoverBox?.y ?? 0) - ((fieldBox?.y ?? 0) + (fieldBox?.height ?? 0) + 4)),
    ).toBeLessThan(1);
    expect(popoverBox?.width ?? 0).toBeGreaterThanOrEqual((fieldBox?.width ?? 0) - 1);
    await lab.expectAccessible('.ui-combobox__popover');

    await page.keyboard.press('ArrowDown');
    const apple = listbox.getByRole('option', { name: /^Apple/ });
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      (await apple.getAttribute('id')) ?? '',
    );
    await expect(apple).toHaveAttribute('data-focused', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Lemon');
    await expect(input).toBeFocused();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(area.locator('[data-lab-output="chosen"]')).toHaveText('lemon');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(input).toHaveValue('Lemon');
  });

  test('UIC-COMBOBOX-2.6 shows the empty state when nothing matches', async ({ page, lab }) => {
    await lab.open('combobox');
    await section(page, 'Picking').getByRole('combobox', { name: 'Fruit' }).click();
    await page.keyboard.type('zzz');
    await expect(page.locator('.ui-combobox__empty')).toHaveText('No results');
  });

  test('UIC-COMBOBOX-2.2 shows suggestions the caller fetches, marking the field busy', async ({
    page,
    lab,
  }) => {
    await lab.open('combobox');
    const area = section(page, 'Asynchronous suggestions');
    const input = area.getByRole('combobox', { name: 'City' });
    const deliver = area.locator('[data-lab-action="deliver"]');
    const request = area.locator('[data-lab-output="request"]');
    await input.click();
    await page.keyboard.type('li');
    await expect(request).toHaveText('li');
    await expect(input).toHaveAttribute('aria-busy', 'true');
    await expect(area.locator('.ui-combobox__spinner')).toBeVisible();

    await deliver.click();
    await expect(request).toHaveText('nothing');
    await expect(input).not.toHaveAttribute('aria-busy');
    await expect(area.locator('.ui-combobox__spinner')).toHaveCount(0);
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText(['Lima', 'Lisbon']);

    await page.keyboard.type('mo');
    await expect(request).toHaveText('limo');
    await deliver.click();
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.ui-combobox__empty')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(input).toHaveValue('limo');
  });

  test('UIC-COMBOBOX-2.3 opens on focus when asked to', async ({ page, lab }) => {
    await lab.open('combobox');
    const input = section(page, 'Open on focus').getByRole('combobox', { name: 'Fruit on focus' });
    // The list closes when the page scrolls, so bring the field into view first.
    await input.scrollIntoViewIfNeeded();
    await expect(input).toBeInViewport();
    await input.click();
    await expect(page.getByRole('listbox')).toBeVisible();
  });

  test('UIC-COMBOBOX-1.3 stays accessible in the dark theme', async ({ page, lab }) => {
    await lab.open('combobox', { theme: 'dark' });
    await lab.expectAccessible();
    await section(page, 'Picking').getByRole('combobox', { name: 'Fruit' }).click();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await lab.expectAccessible('.ui-combobox__popover');
  });
});
