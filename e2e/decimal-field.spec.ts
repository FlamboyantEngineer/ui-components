import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Decimal Field lab', () => {
  test('UIC-DECIMAL-FIELD-1.2 UIC-DECIMAL-FIELD-1.4 UIC-DECIMAL-FIELD-1.5 keeps values beyond a number exactly', async ({
    page,
    lab,
  }) => {
    await lab.open('decimal-field');
    const input = field(page, 'exact').getByRole('spinbutton', { name: 'Exact value' });
    await expect(input).toHaveValue('9,007,199,254,740,993');
    await input.focus();
    await page.keyboard.press('ArrowUp');
    await expect(output(page, 'Committed')).toHaveText('9007199254740994');
    await input.fill('123456789012345678901234567890.000000000000000000000000000001');
    await expect(output(page, 'Value')).toHaveText('9007199254740994');
    await input.press('Enter');
    await expect(output(page, 'Committed')).toHaveText(
      '123456789012345678901234567890.000000000000000000000000000001',
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Submitted')).toHaveText(
      '123456789012345678901234567890.000000000000000000000000000001',
    );
    await page.getByRole('button', { name: 'Set a long fraction' }).click();
    await expect(input).toHaveValue('-0.1000000000000000000000000000001');
    await lab.expectAccessible();
  });

  test('UIC-DECIMAL-FIELD-2.5 UIC-DECIMAL-FIELD-3.1 steps exactly from the keyboard and the buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('decimal-field');
    const ratio = field(page, 'ratio');
    const input = ratio.getByRole('spinbutton', { name: 'Ratio' });
    await input.focus();
    await page.keyboard.press('ArrowUp');
    await expect(output(page, 'Ratio')).toHaveText('0.3');
    await expect(input).toHaveAttribute('aria-valuetext', '0.3');
    await ratio.getByRole('button', { name: 'Increase Ratio' }).click();
    await expect(output(page, 'Ratio')).toHaveText('0.4');
    await expect(input).toBeFocused();
    await input.fill('7');
    await input.press('Tab');
    await expect(output(page, 'Ratio')).toHaveText('1');
    await expect(ratio.getByRole('button', { name: 'Increase Ratio' })).toBeDisabled();
  });

  test('UIC-DECIMAL-FIELD-1.3 UIC-DECIMAL-FIELD-1.4 reads locale text and reports an unreadable draft', async ({
    page,
    lab,
  }) => {
    await lab.open('decimal-field');
    const german = field(page, 'locale-de-DE').getByRole('spinbutton');
    await expect(german).toHaveValue('-1.234.567,891');
    await expect(field(page, 'locale-fr-FR').getByRole('spinbutton')).toHaveValue('-1 234 567,891');
    await german.fill('2,5x');
    await german.press('Enter');
    await expect(german).toHaveAttribute('aria-invalid', 'true');
    await german.fill('2,5');
    await german.press('Enter');
    await expect(german).toHaveValue('2,5');
    await expect(german).not.toHaveAttribute('aria-invalid');
    const price = field(page, 'price').getByRole('spinbutton', { name: 'Price' });
    await price.fill('4.005');
    await price.press('Enter');
    await expect(price).toHaveValue('4.01');
  });
});
