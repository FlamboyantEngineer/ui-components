import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="controller-${name}"]`);

test.describe('Field lab external form controller', () => {
  test('UIC-FIELD-12.4 loads, validates, focuses the first invalid field and resets', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const demo = page.locator('[data-lab-demo="field-controller"]');
    const title = demo.getByRole('textbox', { name: 'Title' });
    await expect(title).toHaveValue('Quarterly review');
    await expect(output(page, 'loading')).toHaveText('false');

    await demo.getByRole('button', { name: 'Clear the form' }).click();
    await demo.getByRole('button', { name: 'Save' }).click();
    await expect(title).toBeFocused();
    await expect(title).toHaveAttribute('aria-invalid', 'true');
    await expect(demo.getByText('Enter a title.')).toHaveCount(1);
    await expect(demo.getByText('A value is required.')).toHaveCount(0);
    await lab.expectAccessible('[data-lab-demo="field-controller"]');

    await demo.getByRole('button', { name: 'Reset' }).click();
    await expect(title).toHaveValue('Quarterly review');
    await expect(demo.getByText('Enter a title.')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'saved')).toHaveText('Quarterly review, 12 seats');
  });

  test('UIC-FIELD-12.4 marks the date range touched once focus leaves both dates', async ({
    page,
    lab,
  }) => {
    await lab.open('field');
    const demo = page.locator('[data-lab-demo="field-controller"]');
    await expect(output(page, 'loading')).toHaveText('false');
    const months = demo.getByRole('spinbutton', { name: /^month/ });
    await months.first().click();
    for (let step = 0; step < 3; step += 1) await page.keyboard.press('Tab');
    await expect(months.nth(1)).toBeFocused();
    await expect(output(page, 'touched')).toHaveText('none');
    await demo.getByRole('textbox', { name: 'Title' }).click();
    await expect(output(page, 'touched')).toHaveText('dates');
  });
});
