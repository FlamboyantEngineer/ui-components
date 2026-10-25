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

test.describe('Chat Transcript lab: messages and conversation parts', () => {
  const section = (page: Page, title: string) => page.locator(`[data-lab-section="${title}"]`);
  const matrixCell = (page: Page, id: string) => page.locator(`[data-lab-cell="${id}"]`);
  const teamMessage = (page: Page, id: string) => page.locator(`[data-lab-message="${id}"]`);
  const opacityOf = (locator: Locator) =>
    locator.evaluate((node) => Number(getComputedStyle(node).opacity));
  const messageSections = [
    'Message states',
    'Delivery',
    'Markers, quotes and slots',
    'Grouped positions',
    'Conversation parts',
    'Group conversation',
    'Days in a time zone',
  ];

  test('UIC-CHAT-TRANSCRIPT-2.4 names a message by its author and shows the absolute time in a tooltip', async ({
    page,
    lab,
  }) => {
    // Scrolling closes a tooltip, so the whole lab fits the viewport.
    await page.setViewportSize({ width: 1280, height: 6000 });
    await lab.open('chat-transcript');
    const message = matrixCell(page, 'from=sent state=complete').getByRole('article');
    await expect(message).toHaveAccessibleName(/^Maria Santos, Apr 20, 2026, 10:12\sAM$/);
    const time = message.locator('.ui-chat-message__time');
    await expect(time).toHaveText('18 minutes ago');
    await page.mouse.move(5, 5);
    await time.hover();
    const tooltip = page.locator('[role="tooltip"]:not([data-exiting])');
    await expect(tooltip).toHaveText(/^Apr 20, 2026, 10:12\sAM$/);
    await expect(time).toHaveAccessibleDescription(/^Apr 20, 2026, 10:12\sAM$/);
  });

  test('UIC-CHAT-TRANSCRIPT-2.6 UIC-CHAT-TRANSCRIPT-2.7 shows a grouped time and the actions on hover and focus', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const middle = page.locator('[data-lab-position="received-middle"]');
    await middle.scrollIntoViewIfNeeded();
    await expect(middle).toHaveAttribute('data-group-position', 'middle');
    await expect(middle.locator('.ui-chat-message__avatar')).toHaveCount(0);
    await expect(middle.locator('.ui-chat-message__author')).toHaveCount(0);
    await expect(middle).toHaveAccessibleName(/^Ana Lopez, Apr 20, 2026, 9:00\sAM$/);
    const header = middle.locator('.ui-chat-message__header');
    const actions = middle.locator('.ui-chat-message__actions');
    expect(await opacityOf(header)).toBe(0);
    expect(await opacityOf(actions)).toBe(0);
    await middle.locator('.ui-chat-message__content').hover();
    await expect(middle).toHaveAttribute('data-hovered', 'true');
    await expect.poll(() => opacityOf(header)).toBe(1);
    await expect.poll(() => opacityOf(actions)).toBe(1);
    await page.mouse.move(0, 0);
    await expect(middle).not.toHaveAttribute('data-hovered');
    await expect.poll(() => opacityOf(actions)).toBe(0);
    const copy = middle.getByRole('button', { name: 'Copy message' });
    await copy.focus();
    await expect(middle).toHaveAttribute('data-focus-within', 'true');
    await expect.poll(() => opacityOf(actions)).toBe(1);
    await expect.poll(() => opacityOf(header)).toBe(1);
    await copy.blur();
    await expect(middle).not.toHaveAttribute('data-focus-within');
  });

  test('UIC-CHAT-TRANSCRIPT-2.2 UIC-CHAT-TRANSCRIPT-2.8 UIC-CHAT-TRANSCRIPT-2.9 shows stopped replies, delivery and errors', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const stopped = matrixCell(page, 'from=received state=cancelled').getByRole('article');
    await expect(stopped).toHaveAttribute('data-status', 'cancelled');
    await expect(stopped.locator('.ui-chat-message__stopped')).toHaveText('Stopped');
    await expect(stopped.locator('.ui-chat-message__content')).toHaveText(
      'Checking the trail notes for the',
    );
    const failedReply = matrixCell(page, 'from=received state=error');
    await expect(failedReply.getByRole('alert')).toHaveText('The reply could not be finished.');
    await expect(failedReply.getByRole('button', { name: 'Retry' })).toBeVisible();
    for (const [delivery, label] of [
      ['sending', 'Sending'],
      ['sent', 'Sent'],
      ['delivered', 'Delivered'],
      ['read', 'Read'],
    ] as const) {
      const message = matrixCell(page, `delivery=${delivery}`).getByRole('article');
      await expect(message).toHaveAttribute('data-delivery', delivery);
      await expect(message.locator('.ui-chat-message__delivery-label')).toHaveText(label);
    }
    const failed = matrixCell(page, 'delivery=failed').getByRole('article');
    await expect(failed.locator('.ui-chat-message__delivery-label')).toHaveText('Not sent');
    await failed.getByRole('button', { name: 'Retry' }).click();
    await expect(failed).toHaveAttribute('data-delivery', 'sending');
    await expect(failed).toHaveAttribute('data-delivery', 'sent');
    await expect(failed.getByRole('button', { name: 'Retry' })).toHaveCount(0);
  });

  test('UIC-CHAT-TRANSCRIPT-2.10 UIC-CHAT-TRANSCRIPT-2.11 UIC-CHAT-TRANSCRIPT-2.12 shows edits, deletions, quotes, reactions and readers', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    await expect(teamMessage(page, 'm7').locator('.ui-chat-message__edited')).toHaveText('Edited');
    const deleted = teamMessage(page, 'm9');
    await expect(deleted).toHaveAttribute('data-deleted', 'true');
    await expect(deleted.locator('.ui-chat-message__content')).toHaveText('Message deleted');
    await expect(deleted.locator('.ui-chat-message__actions')).toHaveCount(0);
    const log = page.getByRole('log', { name: 'Team conversation' });
    await log.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await teamMessage(page, 'm8')
      .getByRole('button', { name: 'Quote from Maria Santos: So let us meet at eight.' })
      .click();
    await expect(teamMessage(page, 'm7')).toBeInViewport();
    const reactions = teamMessage(page, 'm11').locator('.ui-chat-message__reactions');
    await reactions.getByRole('button', { name: /🎉/ }).click();
    await expect(reactions.locator('.ui-reaction-bar__count')).toHaveText('2');
    await expect(
      teamMessage(page, 'm11').getByRole('group', {
        name: 'Seen by Ana Lopez, Dee Nolan and Eli Brandt',
      }),
    ).toBeVisible();
    await expect(
      teamMessage(page, 'm7').getByRole('group', { name: 'Seen by Cy Park' }),
    ).toBeVisible();
  });

  test('UIC-CHAT-TRANSCRIPT-5.5 lists every reader in a popover', async ({ page, lab }) => {
    await lab.open('chat-transcript');
    const receipts = matrixCell(page, 'readers=five').getByRole('group', {
      name: 'Seen by Ana Lopez, Ben Okoro and 3 others',
    });
    await receipts.scrollIntoViewIfNeeded();
    await receipts.getByRole('button').click();
    const popover = page.locator('.ui-avatar-group__popover:not([data-entering])');
    await expect(popover.getByRole('heading', { name: '5 people' })).toBeVisible();
    await expect(popover.getByRole('listitem')).toHaveCount(5);
    await expect(popover).toContainText('Eli Brandt');
    await lab.expectAccessible('.ui-avatar-group__popover');
    await page.keyboard.press('Escape');
    await expect(page.locator('.ui-avatar-group__popover')).toHaveCount(0);
    await expect(receipts.getByRole('button')).toBeFocused();
  });

  test('UIC-CHAT-TRANSCRIPT-5.1 UIC-CHAT-TRANSCRIPT-5.2 UIC-CHAT-TRANSCRIPT-5.3 UIC-CHAT-TRANSCRIPT-5.4 shows the conversation parts', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    for (const [day, text] of [
      ['today', 'Today'],
      ['yesterday', 'Yesterday'],
      ['earlier', 'Tuesday, April 14, 2026'],
    ] as const) {
      await expect(matrixCell(page, `day=${day}`).locator('.ui-chat-date-separator')).toHaveText(
        text,
      );
    }
    await expect(matrixCell(page, 'divider=unread')).toHaveText('New messages');
    for (const [typing, text] of [
      ['one', 'Ana Lopez is typing…'],
      ['two', 'Ana Lopez and Ben Okoro are typing…'],
      ['three or more', 'Ana Lopez and 2 others are typing…'],
      ['thinking', 'Helper is thinking…'],
      ['nobody', ''],
    ] as const) {
      await expect(matrixCell(page, `typing=${typing}`).getByRole('status')).toHaveText(text);
    }
    await expect(matrixCell(page, 'quote=static').locator('blockquote.ui-chat-quote')).toHaveText(
      'Ben Okoro Count me in. I can drive four people.',
    );
    await expect(
      matrixCell(page, 'quote=pressable').getByRole('button', {
        name: 'Quote from Ben Okoro: Count me in. I can drive four people.',
      }),
    ).toBeVisible();
  });

  test('UIC-CHAT-TRANSCRIPT-6.1 UIC-CHAT-TRANSCRIPT-6.2 lays out a group conversation by day, unread and author', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const log = page.getByRole('log', { name: 'Team conversation' });
    const parts = await log
      .locator('.ui-chat-date-separator, .ui-chat-unread-divider, .ui-chat-message')
      .evaluateAll((nodes) =>
        nodes.map((node) =>
          node.classList.contains('ui-chat-message')
            ? `${node.getAttribute('data-lab-message')}:${node.getAttribute('data-group-position')}`
            : (node.textContent ?? ''),
        ),
      );
    expect(parts).toEqual([
      'Yesterday',
      'm1:first',
      'm2:last',
      'm3:single',
      'm4:single',
      'm5:single',
      'Today',
      'm6:first',
      'm7:last',
      'New messages',
      'm8:first',
      'm9:middle',
      'm10:last',
      'm11:single',
      'm12:single',
    ]);
    await expect(page.locator('[data-lab-typing="team"]')).toHaveText('Cy Park is typing…');
    const losAngeles = page.locator('[data-lab-transcript="America/Los_Angeles"]');
    const tokyo = page.locator('[data-lab-transcript="Asia/Tokyo"]');
    await expect(losAngeles.locator('.ui-chat-date-separator')).toHaveCount(2);
    await expect(tokyo.locator('.ui-chat-date-separator')).toHaveCount(1);
    await expect(
      tokyo.locator('[data-group-position="first"] .ui-chat-message__content'),
    ).toHaveText('Still up?');
    await expect(
      losAngeles.locator('[data-group-position="single"] .ui-chat-message__content'),
    ).toHaveText(['Still up?', 'The bus leaves at six.', 'Set an alarm.']);
  });

  test('UIC-CHAT-TRANSCRIPT-5.6 passes axe on every message case and part in both themes', async ({
    page,
    lab,
  }) => {
    for (const theme of ['light', 'dark']) {
      await lab.open('chat-transcript', { theme });
      for (const title of messageSections) {
        await expect(section(page, title)).toBeVisible();
        await lab.expectAccessible(`[data-lab-section="${title}"]`);
      }
    }
  });
});
