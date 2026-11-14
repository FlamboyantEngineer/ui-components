import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Number Field exact decimal lab', () => {
  test('UIC-NUMBER-FIELD-9.2 UIC-NUMBER-FIELD-9.4 UIC-NUMBER-FIELD-9.5 keeps values beyond a number exactly', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
    const input = field(page, 'exact').getByRole('spinbutton', { name: 'Exact value' });
    await expect(input).toHaveValue('9,007,199,254,740,993');
    await input.focus();
    await page.keyboard.press('ArrowUp');
    await expect(output(page, 'Exact committed')).toHaveText('9007199254740994');
    await input.fill('123456789012345678901234567890.000000000000000000000000000001');
    await expect(output(page, 'Exact value')).toHaveText('9007199254740994');
    await input.press('Enter');
    await expect(output(page, 'Exact committed')).toHaveText(
      '123456789012345678901234567890.000000000000000000000000000001',
    );
    await page.getByRole('button', { name: 'Submit exact decimal' }).click();
    await expect(output(page, 'Exact submitted')).toHaveText(
      '123456789012345678901234567890.000000000000000000000000000001',
    );
    await page.getByRole('button', { name: 'Set a long fraction' }).click();
    await expect(input).toHaveValue('-0.1000000000000000000000000000001');
    await lab.expectAccessible();
  });

  test('UIC-NUMBER-FIELD-10.5 UIC-NUMBER-FIELD-11.1 steps exactly from the keyboard and the buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
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

  test('UIC-NUMBER-FIELD-9.3 UIC-NUMBER-FIELD-9.4 reads locale text and reports an unreadable draft', async ({
    page,
    lab,
  }) => {
    await lab.open('number-field');
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
