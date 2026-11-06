import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Masked Text Field lab', () => {
  test('UIC-MASKED-TEXT-FIELD-1.2 UIC-MASKED-TEXT-FIELD-2.1 UIC-MASKED-TEXT-FIELD-1.4 types digits into stable separators', async ({
    page,
    lab,
  }) => {
    await lab.open('masked-text-field');
    const input = field(page, 'phone').getByRole('textbox', { name: 'Phone' });
    await expect(input).toHaveAttribute('inputmode', 'numeric');
    await input.click();
    await page.keyboard.type('555x0123');
    await expect(input).toHaveValue('(555) 012-3');
    await expect(output(page, 'Raw')).toHaveText('5550123');
    await page.keyboard.type('456');
    await page.keyboard.press('Enter');
    await expect(output(page, 'Committed')).toHaveText('5550123456');
    await page.getByRole('button', { name: 'Submit phone' }).click();
    await expect(output(page, 'Submitted')).toHaveText('5550123456');
    await lab.expectAccessible();
  });

  test('UIC-MASKED-TEXT-FIELD-2.2 UIC-MASKED-TEXT-FIELD-2.1 deletes across separators and edits mid-value', async ({
    page,
    lab,
  }) => {
    await lab.open('masked-text-field');
    await page.getByRole('button', { name: 'Fill a sample' }).click();
    const input = field(page, 'phone').getByRole('textbox', { name: 'Phone' });
    await expect(input).toHaveValue('(555) 012-3456');
    await input.click();
    // After ") ", Backspace removes the last digit of the area code.
    await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(6, 6));
    await page.keyboard.press('Backspace');
    await expect(input).toHaveValue('(550) 123-456');
    expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(3);
    await page.keyboard.type('9');
    await expect(input).toHaveValue('(559) 012-3456');
    expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(4);
    await page.keyboard.press('Delete');
    await expect(input).toHaveValue('(559) 123-456');
    await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 4));
    await page.keyboard.type('1');
    await expect(output(page, 'Raw')).toHaveText('1123456');
  });

  test('UIC-MASKED-TEXT-FIELD-2.3 UIC-MASKED-TEXT-FIELD-1.3 reads pastes, composition and partial values', async ({
    page,
    lab,
  }) => {
    await lab.open('masked-text-field');
    const reference = field(page, 'reference').getByRole('textbox', { name: 'Reference code' });
    await reference.click();
    await page.keyboard.insertText('ab-c 12 3');
    await expect(reference).toHaveValue('ABC-123');
    await page.keyboard.press('Enter');
    await expect(reference).toHaveAttribute('aria-invalid', 'true');
    await page.keyboard.type('4');
    await page.keyboard.press('Enter');
    await expect(reference).not.toHaveAttribute('aria-invalid');
    await page.getByRole('button', { name: 'Submit reference' }).click();
    await expect(output(page, 'Reference submitted')).toHaveText('ABC-1234');
    const key = field(page, 'key').getByRole('textbox', { name: 'Device key' });
    await key.click();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.imeSetComposition', { text: 'ab', selectionStart: 2, selectionEnd: 2 });
    await expect(key).toHaveValue('ab');
    await cdp.send('Input.insertText', { text: 'ab' });
    await expect(key).toHaveValue('AB');
    await page.keyboard.type('cdz12');
    await expect(output(page, 'Key')).toHaveText('ABCD12');
    await expect(key).toHaveValue('ABCD 12');
  });
});
