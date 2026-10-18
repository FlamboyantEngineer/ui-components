import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const cell = (page: Page, state: string, part = 'text only') =>
  page.locator(`[data-lab-cell="state=${state} part=${part}"]`);

const composer = (page: Page, name: string) => page.locator(`[data-lab-composer="${name}"]`);

test.describe('Message Composer lab', () => {
  test('UIC-MESSAGE-COMPOSER-1.1 UIC-MESSAGE-COMPOSER-1.3 UIC-MESSAGE-COMPOSER-1.5 UIC-MESSAGE-COMPOSER-2.2 draws each state', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const draft = cell(page, 'draft').getByRole('textbox', { name: 'Message (draft, text only)' });
    await expect(draft).toHaveValue('Can we move the review to Friday?');
    await expect(cell(page, 'draft').getByRole('button', { name: 'Send' })).toBeEnabled();
    await expect(cell(page, 'empty').getByRole('button', { name: 'Send' })).toBeDisabled();
    await expect(cell(page, 'pending').locator('.ui-message-composer')).toHaveAttribute(
      'data-pending',
      'true',
    );
    await expect(cell(page, 'pending').locator('.ui-icon-button__spinner')).toBeVisible();
    await expect(cell(page, 'stoppable').getByRole('button', { name: 'Stop' })).toBeEnabled();
    await expect(cell(page, 'disabled').getByRole('textbox')).toBeDisabled();
    const full = cell(page, 'draft', 'attachments and tools');
    const attachment = await full.locator('.ui-message-composer__attachments').boundingBox();
    const input = await full.getByRole('textbox').boundingBox();
    const tools = await full.locator('.ui-message-composer__toolbar').boundingBox();
    const send = await full.getByRole('button', { name: 'Send' }).boundingBox();
    expect(attachment && input && attachment.y + attachment.height <= input.y).toBe(true);
    expect(tools && send && tools.x + tools.width <= send.x).toBe(true);
    await lab.expectAccessible();
  });

  test('UIC-MESSAGE-COMPOSER-1.1 UIC-MESSAGE-COMPOSER-1.2 sends on Enter, breaks lines with Shift+Enter and grows', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const live = composer(page, 'live');
    const input = live.getByRole('textbox', { name: 'Message' });
    await input.click();
    const oneLine = (await input.boundingBox())?.height ?? 0;
    await page.keyboard.type('First line');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Second line');
    await expect.poll(async () => (await input.boundingBox())?.height).toBeGreaterThan(oneLine);
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveText('First line\nSecond line');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect.poll(async () => (await input.boundingBox())?.height).toBe(oneLine);
    await live.getByRole('button', { name: 'Send with Enter' }).click();
    await input.click();
    await page.keyboard.type('Wait');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Wait\n');
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('[data-lab-sent="2"]')).toHaveText('Wait\n');
    await live.getByRole('button', { name: 'Attach a file' }).click();
    await live.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.locator('[data-lab-sent="3"]')).toHaveText(' (Photo 1.png)');
  });

  test('UIC-MESSAGE-COMPOSER-1.3 turns Send into Stop and keeps keyboard focus on it', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const reply = composer(page, 'reply');
    await reply.getByRole('textbox').click();
    await page.keyboard.type('How warm was the crate?');
    await page.keyboard.press('Enter');
    const stop = reply.getByRole('button', { name: 'Stop' });
    await expect(stop).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(stop).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="stops"]')).toHaveText('1');
    await expect(reply.getByRole('button', { name: 'Send' })).toBeFocused();
  });

  test('UIC-MESSAGE-COMPOSER-1.6 mentions people with Enter inserting instead of sending', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const input = composer(page, 'live').getByRole('textbox');
    await input.click();
    await page.keyboard.type('Ping @le');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveCount(1);
    await expect(list.getByRole('option')).toContainText('Lena Ortiz');
    await expect(page.locator('.ui-message-composer__completions')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Ping @Lena ');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveCount(0);
    await page.keyboard.type('@');
    await expect(list.getByRole('option')).toHaveCount(3);
    await expect(page.locator('.ui-message-composer__completions')).not.toHaveAttribute(
      'data-entering',
    );
    await lab.expectAccessible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveText('Ping @Lena @');
  });
});
