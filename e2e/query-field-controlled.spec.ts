import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('Query Field lab host control and minimal grammar', () => {
  test('UIC-QUERY-FIELD-1.5 UIC-QUERY-FIELD-1.4 completes and submits the host-held query', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const demo = page.locator('[data-lab-demo="controlled"]');
    const input = demo.getByRole('textbox', { name: 'Search the catalogue' });
    await expect(output(page, 'Host query')).toHaveText('genre:history');
    await demo.getByRole('button', { name: 'Replace with reader:' }).click();
    await expect(input).toHaveValue('reader:');
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.type('le');
    await expect(output(page, 'Host query')).toHaveText('reader:le');
    await expect(page.getByRole('option', { name: /lena/ })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('reader:lena');
    await expect(output(page, 'Host query')).toHaveText('reader:lena');
    await page.keyboard.press('Enter');
    await expect(output(page, 'Catalogue submitted')).toHaveText('reader:lena');
    await demo.getByRole('button', { name: 'Clear the query' }).click();
    await expect(input).toHaveValue('');
    await expect(output(page, 'Host query')).toHaveText('empty');
  });

  test('UIC-QUERY-FIELD-1.2 runs a grammar without tokens, completions or problems', async ({
    page,
    lab,
  }) => {
    await lab.open('query-field');
    const demo = page.locator('[data-lab-demo="plain"]');
    const input = demo.getByRole('textbox', { name: 'Plain query' });
    await expect(demo.locator('.ui-code-editor__token')).toHaveCount(0);
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.type('x');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(output(page, 'Plain submitted')).toHaveText('anything: goes (x');
    await page.keyboard.press('Tab');
    await expect(input).not.toBeFocused();
    await expect(input).toHaveValue('anything: goes (x');
  });
});
