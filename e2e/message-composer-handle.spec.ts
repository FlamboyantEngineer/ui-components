import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const scrolls = (input: Locator) =>
  input.evaluate((element) => element.scrollHeight > element.clientHeight + 1);

test.describe('Message Composer rows, length and handle', () => {
  test('UIC-MESSAGE-COMPOSER-1.3 bounds the rows of both composers and limits the plain length', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const rows = demo(page, 'rows');
    const plain = rows.getByRole('textbox', { name: 'Plain message with row bounds' });
    const rich = rows.getByRole('textbox', { name: 'Rich message with row bounds' });
    await expect.poll(() => scrolls(plain)).toBe(true);
    await expect
      .poll(() =>
        scrolls(
          rich.locator(
            'xpath=ancestor-or-self::*[contains(@class, "ui-message-composer__input")][1]',
          ),
        ),
      )
      .toBe(true);
    const short = await plain.evaluate((element) => element.clientHeight);
    await rows.getByRole('textbox', { name: 'Maximum rows' }).fill('12');
    await rows.getByRole('textbox', { name: 'Maximum rows' }).press('Enter');
    await expect(rows.locator('[data-lab-output="rows"]')).toHaveText('minRows 2, maxRows 12');
    await expect.poll(() => scrolls(plain)).toBe(false);
    expect(await plain.evaluate((element) => element.clientHeight)).toBeGreaterThan(short);

    const limited = demo(page, 'max-length');
    const input = limited.getByRole('textbox', { name: 'Short message' });
    await input.fill('');
    await input.pressSequentially('A crate of ripe pears for the market stall today');
    await expect(limited.locator('[data-lab-output="length"]')).toHaveText('40 of 40 characters');
    await page.keyboard.press('Enter');
    await expect(limited.locator('[data-lab-output="sent"]')).toHaveText(
      'Sent: A crate of ripe pears for the market sta',
    );
    await lab.expectAccessible('[data-lab-demo="rows"]');
  });

  test('UIC-MESSAGE-COMPOSER-4.10 reads the draft, value and selection and inserts through the handle', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const area = demo(page, 'handle');
    const output = area.locator('[data-lab-output="handle"]');
    await area.getByRole('button', { name: 'Read the handle' }).click();
    await expect(output).toHaveText(
      'draft: Ask about the plum order | value: Ask about the plum order | selection: 24–24',
    );
    await area.getByRole('button', { name: 'Edit the earlier message' }).click();
    await area.getByRole('button', { name: 'Read the handle' }).click();
    await expect(output).toContainText(
      'draft: Ask about the plum order | value: The pears arrive on Monday',
    );
    await area.getByRole('button', { name: 'Mention Ana' }).click();
    await expect(output).toHaveText('insertToken: editing');
    await area.getByRole('button', { name: 'Edit the earlier message' }).click();
    const box = area.getByRole('textbox', { name: 'Message with a handle' });
    await box.click();
    await page.keyboard.press('End');
    await area.getByRole('button', { name: 'Focus the composer' }).click();
    await expect(box).toBeFocused();
    await area.getByRole('button', { name: 'Mention Ana' }).click();
    await expect(output).toHaveText('insertToken: inserted');
    await expect(box.locator('.ui-message-composer__pill')).toHaveText('@Ana Lopez');
    await area.getByRole('button', { name: 'Read the handle' }).click();
    await expect(output).toHaveText(
      'draft: Ask about the plum order @Ana Lopez  | value: Ask about the plum order @Ana Lopez  | selection: 36–36',
    );
  });
});
