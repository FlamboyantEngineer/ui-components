import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, size: string): Locator {
  return page.locator(`[data-lab-cell="state=${state} size=${size}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Search Field lab', () => {
  test('UIC-SEARCH-FIELD-1.1 UIC-SEARCH-FIELD-1.2 draws two box sizes with a glyph and the input', async ({
    page,
    lab,
  }) => {
    await lab.open('search-field');
    for (const [size, height] of [
      ['md', 28],
      ['sm', 24],
    ] as const) {
      const box = cell(page, 'empty', size).locator('.ui-search-field');
      expect((await box.boundingBox())?.height).toBe(height);
      await expect(box.locator('.ui-search-field__glyph')).toBeVisible();
      await expect(box.getByRole('searchbox', { name: `Search, empty, ${size}` })).toBeVisible();
    }
    await expect(
      cell(page, 'filled', 'md').getByRole('button', { name: 'Clear search' }),
    ).toBeVisible();
    await expect(cell(page, 'empty', 'md').getByRole('button')).toHaveCount(0);
    await expect(cell(page, 'read-only', 'md').getByRole('button')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-SEARCH-FIELD-1.3 UIC-SEARCH-FIELD-1.4 filters, clears and submits', async ({
    page,
    lab,
  }) => {
    await lab.open('search-field');
    const input = page.getByRole('searchbox', { name: 'Filter fruit' });
    const items = page.locator('[data-lab-list] li');
    await input.fill('ap');
    await expect(items).toHaveText(['Apple', 'Apricot', 'Grape']);
    await input.press('Enter');
    await expect(output(page, 'Submitted')).toHaveText('ap');
    await page.keyboard.press('Tab');
    const clear = page.locator('[data-lab-field="filter"]').getByRole('button', {
      name: 'Clear search',
    });
    await expect(clear).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(items).toHaveCount(9);
    await expect(clear).toHaveCount(0);

    await input.fill('fig');
    await input.press('Escape');
    await expect(input).toHaveValue('');
    await input.fill('pe');
    await page.locator('[data-lab-field="filter"] .ui-search-field__clear').click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('UIC-SEARCH-FIELD-1.3 shows clear text with its own name', async ({ page, lab }) => {
    await lab.open('search-field');
    const worded = page.locator('[data-lab-field="worded"]');
    const clear = worded.getByRole('button', { name: 'Clear the glossary filter' });
    await expect(clear).toHaveText('Clear');
    await clear.click();
    await expect(worded.getByRole('searchbox')).toHaveValue('');
  });

  test('UIC-SEARCH-FIELD-1.1 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('search-field', { theme: 'dark' });
    await expect(cell(page, 'empty', 'md').locator('.ui-search-field__group')).toHaveCSS(
      'background-color',
      'rgb(13, 17, 23)',
    );
    await lab.expectAccessible();
  });

  test('UIC-SEARCH-FIELD-2.1 UIC-SEARCH-FIELD-2.2 draws its label above the box and its messages below', async ({
    page,
    lab,
  }) => {
    await lab.open('search-field');
    const labelled = page.locator('[data-lab-field="labelled"]');
    const input = labelled.getByRole('searchbox', { name: 'Find a city' });
    const label = await labelled.locator('.ui-search-field__label').boundingBox();
    const group = await labelled.locator('.ui-search-field__group').boundingBox();
    expect((label?.y ?? 0) + (label?.height ?? 0)).toBeLessThanOrEqual(group?.y ?? 0);
    expect(group?.height).toBe(28);
    await expect(input).toHaveAccessibleDescription('Type at least three letters.');
    await input.fill('Os');
    await expect(labelled.locator('.ui-search-field__error')).toHaveText('Too short.');
    await expect(input).toHaveAccessibleDescription('Type at least three letters. Too short.');
    await input.fill('Oslo');
    await expect(labelled.locator('.ui-search-field__error')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-SEARCH-FIELD-2.1 keeps the input and its focus across a label layout change', async ({
    page,
    lab,
  }) => {
    await lab.open('search-field');
    const field = page.locator('[data-lab-field="changing"]');
    const input = field.getByRole('searchbox', { name: 'Search notes' });
    await input.focus();
    await input.evaluate((element: HTMLInputElement) => {
      element.setSelectionRange(1, 3);
      Object.assign(element, { labMarker: true });
    });
    // A click that does not move focus, as a responsive layout change would not.
    const toggle = page.getByRole('switch', { name: 'Visible label' });
    await toggle.dispatchEvent('click');
    await expect(field).toHaveAttribute('data-label-layout', 'label-control');
    await expect(input).toBeFocused();
    await expect(input).toHaveAccessibleDescription('Matches titles and text.');
    expect(
      await input.evaluate((element: HTMLInputElement) => [
        'labMarker' in element,
        element.selectionStart,
        element.selectionEnd,
      ]),
    ).toEqual([true, 1, 3]);
    await page.keyboard.type('X');
    await expect(input).toHaveValue('dXft');
    await toggle.dispatchEvent('click');
    await expect(field).toHaveAttribute('data-label-layout', 'control-only');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('dXft');
    await lab.expectAccessible();
  });

  test('UIC-SEARCH-FIELD-2.3 shows a spinner while results load', async ({ page, lab }) => {
    await lab.open('search-field');
    const loading = page.locator('[data-lab-field="loading"]');
    await expect(loading).toHaveAttribute('data-pending', 'true');
    await expect(loading.getByRole('progressbar', { name: 'Loading' })).toBeVisible();
    await page.locator('.ui-switch__label', { hasText: 'Loading' }).click();
    await expect(loading).not.toHaveAttribute('data-pending');
    await expect(loading.getByRole('progressbar')).toHaveCount(0);
  });
});
