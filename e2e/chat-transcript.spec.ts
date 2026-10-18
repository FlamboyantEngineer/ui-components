import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const cell = (page: Page, origin: string, status: string) =>
  page.locator(`[data-lab-cell="origin=${origin} status=${status}"] .ui-chat-message`);

/** How far the log's viewport is from its bottom, in pixels. */
function distanceToBottom(log: Locator): Promise<number> {
  return log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop);
}

test.describe('Chat Transcript lab', () => {
  test('UIC-CHAT-TRANSCRIPT-2.1 UIC-CHAT-TRANSCRIPT-2.2 draws messages by origin and status', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const received = cell(page, 'received', 'complete');
    await expect(received).toHaveAttribute('data-origin', 'received');
    await expect(received.locator('.ui-chat-message__author')).toHaveText('Helper');
    await expect(received.locator('.ui-chat-message__time')).toHaveText('18 minutes ago');
    await expect(received.getByRole('button', { name: 'Copy message' })).toBeVisible();
    await expect(cell(page, 'sent', 'complete')).toHaveAttribute('data-origin', 'sent');
    const sentBox = await page.locator('[data-lab-message="1"]').boundingBox();
    const receivedBox = await page.locator('[data-lab-message="2"]').boundingBox();
    expect(
      sentBox && receivedBox && sentBox.x + sentBox.width > receivedBox.x + receivedBox.width,
    ).toBe(true);
    expect(sentBox && receivedBox && sentBox.x > receivedBox.x).toBe(true);
    await expect(cell(page, 'received', 'streaming')).toHaveAttribute('aria-busy', 'true');
    await expect(cell(page, 'received', 'error')).toHaveAttribute('data-status', 'error');
    await expect(
      cell(page, 'received', 'error').getByRole('button', { name: 'Retry' }),
    ).toBeVisible();
    await expect(cell(page, 'system', 'complete').locator('.ui-chat-message__header')).toHaveCount(
      0,
    );
    await expect(cell(page, 'system', 'complete')).toHaveText(
      'Lena Ortiz joined the conversation.',
    );
  });

  test('UIC-CHAT-TRANSCRIPT-1.1 UIC-CHAT-TRANSCRIPT-1.2 UIC-CHAT-TRANSCRIPT-1.3 follows a streaming reply until the reader scrolls up', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('chat-transcript');
    const log = page.getByRole('log', { name: 'Live conversation' });
    await expect.poll(() => distanceToBottom(log)).toBeLessThanOrEqual(1);
    const ask = page.getByRole('textbox', { name: 'Ask' });
    await ask.fill('How were the samples?');
    await ask.press('Enter');
    await page.clock.runFor(2000);
    await expect(page.locator('[data-lab-message="14"]')).toContainText('The north field');
    await expect.poll(() => distanceToBottom(log)).toBeLessThanOrEqual(1);
    await log.evaluate((node) => node.scrollTo({ top: 0 }));
    const jump = page.getByRole('button', { name: 'Jump to latest' });
    await expect(jump).toBeVisible();
    await page.clock.runFor(2000);
    expect(await log.evaluate((node) => node.scrollTop)).toBe(0);
    await jump.click();
    await expect(jump).toBeHidden();
    await expect(log).toBeFocused();
    await expect.poll(() => distanceToBottom(log)).toBeLessThanOrEqual(1);
    await page.clock.runFor(2000);
    await expect.poll(() => distanceToBottom(log)).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.locator('[data-lab-message="14"]')).toHaveAttribute(
      'data-status',
      'complete',
    );
    await page.clock.runFor(2000);
    await expect(page.locator('[data-lab-message="14"]')).not.toHaveAttribute('aria-busy');
  });

  test('UIC-CHAT-TRANSCRIPT-1.1 shows an empty state until the first message', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const transcript = page.locator('[data-lab-transcript="empty"]');
    await expect(transcript).toHaveAttribute('data-empty', 'true');
    const log = transcript.getByRole('log', { name: 'New conversation' });
    await expect(log).toContainText('Ask about the field notes.');
    await log.getByRole('button', { name: 'List the open questions' }).click();
    await expect(transcript).not.toHaveAttribute('data-empty');
    await expect(log.locator('.ui-chat-message__content')).toHaveText('List the open questions');
  });

  test('UIC-CHAT-TRANSCRIPT-1.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('chat-transcript');
    await lab.expectAccessible();
    await lab.open('chat-transcript', { theme: 'dark' });
    await page
      .getByRole('log', { name: 'Live conversation' })
      .evaluate((node) => node.scrollTo({ top: 0 }));
    await expect(page.getByRole('button', { name: 'Jump to latest' })).toBeVisible();
    await lab.expectAccessible();
  });
});
