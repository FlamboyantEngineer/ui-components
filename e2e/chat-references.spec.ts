import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page) => page.locator('[data-lab-demo="references"]');
const box = (page: Page) => demo(page).getByRole('textbox', { name: 'Message' });
const composerChips = (page: Page) =>
  demo(page).locator('.ui-message-composer__pill[data-kind="reference"]');

/** Inserts a sample record from the chat composer's "+" menu. */
async function insertReference(page: Page, label: string) {
  await demo(page).getByRole('button', { name: 'Add and more' }).click();
  await page.getByRole('menuitem', { name: new RegExp(`Reference ${label}`) }).click();
  await expect(box(page)).toBeFocused();
}

test.describe('Chat references', () => {
  test('UIC-CHAT-3.10 UIC-CHAT-3.2 sends references among words and alone, and draws them in the transcript', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const history = demo(page).locator('article').first();
    await expect(history.getByRole('link', { name: 'TRIP-4 Lisbon weekend' })).toBeVisible();
    await box(page).click();
    await page.keyboard.type('Check ');
    await insertReference(page, 'TRIP-4');
    await page.keyboard.type('and ');
    await insertReference(page, 'TRIP-2');
    await page.keyboard.press('Enter');
    await expect(demo(page).locator('[data-lab-output="references"]')).toHaveText(
      'lisbon: 7c2e4f10-9b1a-4d3e-8f6a-2b5c1d0e9a47, 55b0e9c1-3a7d-4f2b-9e6c-8d4a1b7f3c25',
    );
    const sent = demo(page).locator('article', { hasText: 'Check' });
    await expect(sent.locator('.ui-chat-parts__token[data-kind="reference"]')).toHaveCount(2);
    await expect(sent.getByText('Restricted item')).toBeVisible();
    await insertReference(page, 'NOTE-12');
    await page.keyboard.press('Enter');
    await expect(demo(page).locator('[data-lab-output="references"]')).toHaveText(
      'lisbon: 19af6c3d-2e8b-4a7f-b1d0-5c9e3f2a6b81',
    );
    await lab.expectAccessible('[data-lab-section="Record references"]');
  });

  test('UIC-CHAT-3.10 UIC-CHAT-3.7 keeps a refused message and its references in its own conversation', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    await demo(page).getByText('Refuse messages', { exact: true }).click();
    await box(page).click();
    await insertReference(page, 'NOTE-9');
    await page.keyboard.press('Enter');
    await demo(page).getByRole('radio', { name: 'Porto trip' }).click();
    await expect(box(page)).toHaveText('');
    await expect(demo(page).locator('[data-lab-output="references"]')).toHaveText(
      'Not sent: the draft and its references are kept.',
    );
    await expect(composerChips(page)).toHaveCount(0);
    await demo(page).getByRole('radio', { name: 'Lisbon trip' }).click();
    await expect(composerChips(page)).toHaveCount(1);
    await expect(composerChips(page)).toHaveText('Missing item');
    await page.reload();
    await expect(composerChips(page)).toHaveCount(1);
  });
});
