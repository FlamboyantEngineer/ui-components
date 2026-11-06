import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Search Field lab forms, focus and hints', () => {
  test('UIC-SEARCH-FIELD-1.6 UIC-SEARCH-FIELD-1.4 submits its name, reports events and resets', async ({
    page,
    lab,
  }) => {
    await lab.open('search-field');
    const form = page.getByRole('form', { name: 'Recipe search' });
    const box = form.getByRole('searchbox', { name: 'Recipes' });
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Recipe search submitted')).toHaveText('q=soup');
    await box.fill('stew');
    await box.press('Enter');
    await expect(output(page, 'Search events')).toContainText('change "stew" · enter "stew"');
    await box.press('Escape');
    await expect(box).toHaveValue('');
    await expect(output(page, 'Search events')).toContainText('clear');
    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(box).toHaveValue('soup');
  });

  test('UIC-SEARCH-FIELD-2.2 blocks a native submit on an invalid query and lets an aria one through', async ({
    page,
    lab,
  }) => {
    await lab.open('search-field');
    await page
      .getByRole('form', { name: 'Native city search' })
      .getByRole('button', { name: 'Submit' })
      .click();
    await expect(output(page, 'Native city search submitted')).toHaveText('not yet');
    await page
      .getByRole('form', { name: 'Aria city search' })
      .getByRole('button', { name: 'Submit' })
      .click();
    await expect(output(page, 'Aria city search submitted')).toHaveText('city=Ro');
  });

  test('UIC-SEARCH-FIELD-1.1 focuses through inputRef and on mount, and passes input hints', async ({
    page,
    lab,
  }) => {
    await lab.open('search-field');
    await page.getByRole('button', { name: 'Focus the search' }).click();
    await expect(page.getByRole('searchbox', { name: 'Search the archive' })).toBeFocused();
    await page.getByRole('button', { name: 'Select the shelf query' }).click();
    const shelves = page.getByRole('searchbox', { name: 'Search the shelves' });
    await expect(shelves).toBeFocused();
    expect(
      await shelves.evaluate((input: HTMLInputElement) => [
        input.selectionStart,
        input.selectionEnd,
      ]),
    ).toEqual([0, 9]);
    await page.getByRole('button', { name: 'Mount an autofocused search' }).click();
    await expect(page.getByRole('searchbox', { name: 'Quick find' })).toBeFocused();
    const order = page.getByRole('searchbox', { name: 'Order number' });
    await expect(order).toHaveAttribute('inputmode', 'numeric');
    await expect(order).toHaveAttribute('enterkeyhint', 'search');
    await expect(order).toHaveAttribute('autocomplete', 'off');
    await expect(order).toHaveAttribute('spellcheck', 'false');
    const messages = page.getByRole('searchbox', { name: 'Search messages' });
    await expect(messages).toHaveAttribute('enterkeyhint', 'go');
    await expect(messages).toHaveAttribute('spellcheck', 'true');
  });
});
