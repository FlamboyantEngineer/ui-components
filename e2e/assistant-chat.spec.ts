import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

const endGap = (viewport: Locator) =>
  viewport.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop);

const offsetFromViewport = (message: Locator) =>
  message.evaluate((element) => {
    const viewport = element.closest('.ui-message-scroller__viewport');
    return element.getBoundingClientRect().top - (viewport?.getBoundingClientRect().top ?? 0);
  });

test.describe('Composable assistant chat', () => {
  test('UIC-CHAT-43.1 anchors a sent turn, then follows the streaming reply to its end', async ({
    page,
    lab,
  }) => {
    await lab.open('assistant-chat');
    const thread = page.getByRole('region', { name: 'Assistant thread' });
    const viewport = thread.getByRole('region', { name: 'Conversation' });
    const input = thread.getByRole('textbox', { name: 'Message' });
    await expect(thread.getByRole('heading', { name: 'Start a conversation' })).toBeVisible();
    await input.fill('Plan a weekend trip');
    await input.press('Enter');
    const sent = thread.getByRole('article', { name: 'You' });
    await expect(sent).toHaveText('Plan a weekend trip');
    await expect.poll(() => offsetFromViewport(sent)).toBeGreaterThanOrEqual(0);
    await expect.poll(() => offsetFromViewport(sent)).toBeLessThan(24);
    await expect(thread.getByRole('heading', { name: 'Start a conversation' })).toHaveCount(0);
    await expect(thread.getByRole('button', { name: 'Stop reply' })).toBeVisible();
    await expect.poll(() => offsetFromViewport(sent)).toBeLessThan(-24);
    await expect(thread.getByText('Final note:', { exact: false })).toBeVisible();
    await expect(thread.getByRole('button', { name: 'Copy reply' })).toBeVisible();
    await expect.poll(() => endGap(viewport)).toBeLessThan(3);
    await expect(thread.getByRole('button', { name: 'Jump to latest' })).toHaveCount(0);
    await thread.getByRole('button', { name: 'New conversation' }).click();
    await expect(thread.getByRole('heading', { name: 'Start a conversation' })).toBeVisible();
    await expect(thread.getByRole('article')).toHaveCount(0);
    await expect(input).toBeEmpty();
  });

  test('UIC-CHAT-43.2 preserves the viewport through prepend and resumes following on Jump', async ({
    page,
    lab,
  }) => {
    await lab.open('assistant-chat');
    const thread = page.getByRole('region', { name: 'Older messages' });
    const viewport = thread.getByRole('region', { name: 'Conversation history' });
    await expect.poll(() => endGap(viewport)).toBeLessThan(3);
    const existing = viewport.getByText('Spend Saturday afternoon', { exact: false });
    await viewport.evaluate((element) => {
      element.scrollTop = 90;
    });
    const before = await offsetFromViewport(existing);
    await thread.getByRole('button', { name: 'Load older messages' }).click();
    await expect(thread.getByText('Could you suggest an easy weekend trip?')).toBeAttached();
    await expect
      .poll(async () => Math.abs((await offsetFromViewport(existing)) - before))
      .toBeLessThan(3);
    await thread.getByRole('button', { name: 'Jump to latest' }).click();
    await expect.poll(() => endGap(viewport)).toBeLessThan(3);
    const input = thread.getByRole('textbox', { name: 'Message' });
    await input.fill('Another itinerary');
    await input.press('Enter');
    await expect(thread.getByRole('button', { name: 'Stop reply' })).toBeVisible();
    await thread.getByRole('article', { name: 'You' }).last().hover();
    await page.mouse.wheel(0, -180);
    await expect(thread.getByRole('button', { name: 'Jump to latest' })).toBeVisible();
    await expect(thread.getByRole('button', { name: 'Stop reply' })).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect.poll(() => endGap(viewport)).toBeGreaterThan(20);
    await thread.getByRole('button', { name: 'Jump to latest' }).click();
    await expect.poll(() => endGap(viewport)).toBeLessThan(3);
  });

  test('UIC-CHAT-43.3 keeps inline approval operable while a reply streams', async ({
    page,
    lab,
  }) => {
    await lab.open('assistant-chat');
    const thread = page.getByRole('region', { name: 'Assistant thread' });
    const input = thread.getByRole('textbox', { name: 'Message' });
    await input.fill('Check the schedule with approval');
    await input.press('Enter');
    const approval = thread.getByRole('button', { name: 'Approve', exact: true });
    await expect(approval).toBeVisible();
    await expect(thread.locator('.ui-message-scroller__item').last()).toHaveAttribute(
      'aria-busy',
      'false',
    );
    await approval.click();
    await expect(thread.getByRole('button', { name: 'Copy reply' })).toBeVisible({
      timeout: 10_000,
    });
  });
});
