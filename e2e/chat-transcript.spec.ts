import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

test.describe('Chat Transcript lab: transcript behaviour', () => {
  const transcript = (page: Page, name: string) => page.locator(`[data-lab-transcript="${name}"]`);
  const viewportOf = (page: Page, name: string) =>
    transcript(page, name).locator('.ui-scroll-region__viewport');
  const distanceToBottom = (viewport: Locator) =>
    viewport.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop);
  /** Where an element's top sits below the top of its transcript's viewport. */
  const offsetInView = (target: Locator) =>
    target.evaluate((node) => {
      const viewport = node.closest('.ui-scroll-region__viewport') as HTMLElement;
      return node.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    });
  const behaviourSections = [
    'Keyboard model',
    'Follow and anchor',
    'Empty conversation',
    'Older history',
    'Highlighted message',
    'Unread messages',
    'Virtualized history',
  ];

  test('UIC-CHAT-TRANSCRIPT-3.1 UIC-CHAT-TRANSCRIPT-3.2 UIC-CHAT-TRANSCRIPT-3.3 moves through the feed by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const feed = page.getByRole('feed', { name: 'Keyboard conversation' });
    const composer = page.getByRole('textbox', { name: 'Message the planner' });
    await composer.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(feed.locator('#k5')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(feed.locator('#k2')).toBeFocused();
    await expect(feed.locator('#k2')).toHaveAttribute('tabindex', '0');
    const link = feed.getByRole('link', { name: '9:40 ferry' });
    const copy = feed.getByRole('button', { name: 'Copy message' });
    await expect(link).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('Enter');
    await expect(link).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(copy).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(feed.locator('#k2')).toBeFocused();
    await expect(link).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('Home');
    await expect(feed.locator('#k1')).toBeFocused();
    await expect
      .poll(() => viewportOf(page, 'keyboard').evaluate((node) => node.scrollTop))
      .toBe(0);
    await page.keyboard.press('End');
    await expect(feed.locator('#k5')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(composer).toBeFocused();
  });

  test('UIC-CHAT-TRANSCRIPT-3.4 UIC-CHAT-TRANSCRIPT-3.5 pages natively and leaves for the composer on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const feed = page.getByRole('feed', { name: 'Keyboard conversation' });
    const viewport = viewportOf(page, 'keyboard');
    const composer = page.getByRole('textbox', { name: 'Message the planner' });
    await composer.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(feed.locator('#k5')).toBeFocused();
    const first = feed.locator('#k1');
    for (let step = 0; step < 5; step += 1) {
      if ((await offsetInView(first)) >= 0) break;
      const before = await viewport.evaluate((node) => node.scrollTop);
      const active = await feed.evaluate((node) => node.ownerDocument.activeElement?.id);
      await page.keyboard.press('PageUp');
      await expect
        .poll(() => feed.evaluate((node) => node.ownerDocument.activeElement?.id))
        .not.toBe(active);
      await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeLessThan(before);
    }
    await expect(first).toBeFocused();
    const [row, view] = [await first.boundingBox(), await viewport.boundingBox()];
    if (!row || !view) throw new Error('The first message and its viewport must be rendered.');
    expect(row.y).toBeGreaterThanOrEqual(view.y);
    expect(row.y + row.height).toBeLessThanOrEqual(view.y + view.height);
    await page.keyboard.press('Escape');
    await expect(composer).toBeFocused();
  });

  test('UIC-CHAT-TRANSCRIPT-1.2 UIC-CHAT-TRANSCRIPT-1.3 UIC-CHAT-TRANSCRIPT-3.6 follows a streaming reply and announces it once', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('chat-transcript');
    const viewport = viewportOf(page, 'follow');
    await expect.poll(() => distanceToBottom(viewport)).toBeLessThanOrEqual(1);
    const ask = page.getByRole('textbox', { name: 'Ask in follow mode' });
    await ask.fill('How do we get to the island?');
    await ask.press('Enter');
    await page.clock.runFor(1500);
    await expect(transcript(page, 'follow').locator('#follow-reply-2')).toContainText('morning');
    await expect.poll(() => distanceToBottom(viewport)).toBeLessThanOrEqual(1);
    await viewport.evaluate((node) => node.scrollTo({ top: 0 }));
    const jump = transcript(page, 'follow').getByRole('button', { name: 'Jump to latest' });
    await expect(jump).toBeVisible();
    await page.clock.runFor(1500);
    expect(await viewport.evaluate((node) => node.scrollTop)).toBe(0);
    await jump.click();
    await expect(jump).toBeHidden();
    await expect(transcript(page, 'follow').locator('#follow-reply-2')).toBeFocused();
    await page.clock.runFor(1000);
    await expect.poll(() => distanceToBottom(viewport)).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-lab-announcement="follow"]')).toHaveText(
      'Last announcement: (none yet)',
    );
    // Stopping completes the reply, which is then announced once.
    await page.getByRole('button', { name: 'Stop' }).first().click();
    await expect(page.locator('[data-lab-announcement="follow"]')).toHaveText(
      /^Last announcement: New message from Trip Planner: The morning ferry is/,
    );
  });

  test('UIC-CHAT-TRANSCRIPT-1.5 anchors the sent message at the top while the reply fills in', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('chat-transcript');
    const ask = page.getByRole('textbox', { name: 'Ask in anchor mode' });
    await ask.fill('Which beach is quietest?');
    await ask.press('Enter');
    const sent = transcript(page, 'anchor').locator('#anchor-sent-1');
    const reply = transcript(page, 'anchor').locator('#anchor-reply-2');
    await expect.poll(() => offsetInView(sent)).toBeCloseTo(12, 0);
    await page.clock.runFor(500);
    await expect(reply).toContainText('morning');
    const early = await reply.evaluate((node) => node.getBoundingClientRect().height);
    await expect.poll(() => offsetInView(sent)).toBeCloseTo(12, 0);
    await page.clock.runFor(1000);
    await expect
      .poll(() => reply.evaluate((node) => node.getBoundingClientRect().height))
      .toBeGreaterThan(early);
    await expect.poll(() => offsetInView(sent)).toBeCloseTo(12, 0);
    await expect(
      transcript(page, 'anchor').getByRole('button', { name: 'Jump to latest' }),
    ).toBeHidden();
    await viewportOf(page, 'anchor').evaluate((node) => node.scrollBy({ top: -40 }));
    await page.clock.runFor(500);
    await expect.poll(() => offsetInView(sent)).toBeCloseTo(52, 0);
  });

  test('UIC-CHAT-TRANSCRIPT-4.1 UIC-CHAT-TRANSCRIPT-4.2 loads older history while keeping the place', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('chat-transcript');
    const viewport = viewportOf(page, 'history');
    await viewport.evaluate((node) => node.scrollTo({ top: 0 }));
    await expect(
      transcript(page, 'history').getByRole('progressbar', { name: 'Loading older messages' }),
    ).toBeVisible();
    const first = transcript(page, 'history').locator('#history-m61');
    const before = await offsetInView(first);
    await page.clock.runFor(800);
    await expect(transcript(page, 'history').locator('#history-m41')).toBeAttached();
    await expect.poll(() => offsetInView(first)).toBeCloseTo(before, 0);
    await expect(page.locator('[data-lab-announcement="history"]')).toHaveText(
      /older messages loaded/,
    );
  });

  test('UIC-CHAT-TRANSCRIPT-4.3 scrolls to a highlighted message, marks it and focuses it', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    await page.getByRole('button', { name: 'Show message 3' }).click();
    const message = transcript(page, 'highlight').locator('#highlight-m3');
    await expect(message).toBeFocused();
    await expect(message).toHaveAttribute('data-highlighted', 'true');
    await expect.poll(() => offsetInView(message)).toBeGreaterThanOrEqual(0);
    await page.getByRole('button', { name: 'Clear highlight' }).click();
    await expect(message).not.toHaveAttribute('data-highlighted');
  });

  test('UIC-CHAT-TRANSCRIPT-4.4 UIC-CHAT-TRANSCRIPT-4.5 counts arrivals and jumps to the first unread message', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const unread = transcript(page, 'unread');
    await expect(page.locator('[data-lab-read="unread"]')).toHaveText('Read up to: unread-m40');
    const bar = unread.locator('.ui-chat-transcript__unread');
    await expect(bar).toContainText('12 unread');
    await bar.getByRole('button', { name: 'Jump' }).click();
    await expect(unread.locator('#unread-m29')).toBeFocused();
    await expect
      .poll(() => offsetInView(unread.locator('.ui-chat-unread-divider')))
      .toBeCloseTo(12, 0);
    await expect(bar).toBeHidden();
    const receive = page
      .locator('[data-lab-section="Unread messages"]')
      .getByRole('button', { name: 'Receive a message' });
    await receive.click();
    await receive.click();
    await expect(unread.getByRole('button', { name: '2 new messages' })).toBeVisible();
  });

  test('UIC-CHAT-TRANSCRIPT-1.6 virtualizes five thousand messages', async ({ page, lab }) => {
    await lab.open('chat-transcript');
    const long = transcript(page, 'virtualized');
    const viewport = viewportOf(page, 'virtualized');
    await expect.poll(() => long.getByRole('article').count()).toBeLessThan(80);
    await expect.poll(() => distanceToBottom(viewport)).toBeLessThanOrEqual(1);
    await expect(long.locator('#long-m5000')).toBeVisible();
    await long.locator('#long-m5000').focus();
    await page.keyboard.press('Home');
    await expect(long.locator('#long-m1')).toBeFocused();
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0);
    await page.keyboard.press('ArrowDown');
    await expect(long.locator('#long-m2')).toBeFocused();
    await page.keyboard.press('End');
    await expect(long.locator('#long-m5000')).toBeFocused();
    await expect.poll(() => distanceToBottom(viewport)).toBeLessThanOrEqual(1);
    await viewport.evaluate((node) => node.scrollTo({ top: node.scrollHeight / 2 }));
    // The message drawn across the middle of the view is mounted.
    await expect(async () => {
      const id = await viewport.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const middle = box.top + box.height / 2;
        const hit = [...node.querySelectorAll('article')].find((article) => {
          const rect = article.getBoundingClientRect();
          return rect.top <= middle && rect.bottom >= middle;
        });
        return hit?.id ?? '';
      });
      expect(Number(id.replace('long-m', ''))).toBeGreaterThan(1500);
    }).toPass();
    expect(await long.getByRole('article').count()).toBeLessThan(80);
  });

  for (const isAway of [false, true]) {
    test(`UIC-CHAT-TRANSCRIPT-1.6 releases a batch while ${isAway ? 'reading older messages' : 'following'}`, async ({
      page,
      lab,
    }) => {
      await lab.open('chat-transcript');
      const long = transcript(page, 'virtualized');
      const viewport = viewportOf(page, 'virtualized');
      const section = page.locator('[data-lab-section="Virtualized history"]');
      await expect(async () => {
        expect(await long.getByRole('article').count()).toBeLessThan(80);
        expect(await distanceToBottom(viewport)).toBeLessThanOrEqual(1);
      }).toPass();
      if (isAway) {
        await viewport.evaluate((node) => node.scrollTo({ top: node.scrollHeight / 2 }));
        await expect(long.getByRole('button', { name: 'Jump to latest' })).toBeVisible();
      }
      const visibleMessage = async () =>
        viewport.evaluate((node) => {
          const box = node.getBoundingClientRect();
          const middle = box.top + box.height / 2;
          const hit = [...node.querySelectorAll('article')].find((article) => {
            const rect = article.getBoundingClientRect();
            return rect.top <= middle && rect.bottom >= middle;
          });
          return hit ? { id: hit.id, offset: hit.getBoundingClientRect().top - box.top } : null;
        });
      await expect(async () => expect(await visibleMessage()).not.toBeNull()).toPass();
      const before = await visibleMessage();
      if (!before) throw new Error('A message must fill the middle of the viewport.');
      await section.getByRole('button', { name: 'Receive 100 messages' }).click();
      await expect(async () => {
        await expect(section.locator('[data-lab-mounted="virtualized"]')).toHaveText(
          /^\d+ of 5100 messages mounted$/,
        );
        expect(await long.getByRole('article').count()).toBeLessThan(80);
        if (isAway) {
          expect(await offsetInView(long.locator(`#${before.id}`))).toBeCloseTo(before.offset, 0);
          await expect(long.getByRole('button', { name: '100 new messages' })).toBeVisible();
        } else {
          expect(await distanceToBottom(viewport)).toBeLessThanOrEqual(1);
          await expect(long.locator('#long-batch-m5100')).toBeVisible();
        }
      }).toPass();
      await viewport.evaluate((node) => node.scrollTo({ top: node.scrollHeight / 3 }));
      await expect(async () => {
        expect(await long.getByRole('article').count()).toBeLessThan(80);
        expect(await visibleMessage()).not.toBeNull();
        await expect(long.locator('#long-batch-m5001')).toHaveCount(0);
        await expect(long.locator('#long-batch-m5100')).toHaveCount(1);
      }).toPass();
    });
  }

  test('UIC-CHAT-TRANSCRIPT-1.1 shows an empty state until the first message', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const empty = transcript(page, 'empty');
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty.getByRole('feed')).toHaveCount(0);
    await expect(empty.locator('.ui-chat-transcript__empty')).toContainText('Ask the planner');
    await empty.getByRole('button', { name: 'Find a bakery near the harbour' }).click();
    await expect(empty).not.toHaveAttribute('data-empty');
    await expect(
      empty.getByRole('feed', { name: 'New conversation' }).locator('.ui-chat-message__content'),
    ).toHaveText('Find a bakery near the harbour');
  });

  test('UIC-CHAT-TRANSCRIPT-1.1 passes axe on every behaviour case in both themes', async ({
    page,
    lab,
  }) => {
    for (const theme of ['light', 'dark']) {
      await lab.open('chat-transcript', { theme });
      await viewportOf(page, 'follow').evaluate((node) => node.scrollTo({ top: 0 }));
      await expect(
        transcript(page, 'follow').getByRole('button', { name: 'Jump to latest' }),
      ).toBeVisible();
      for (const title of behaviourSections) {
        await lab.expectAccessible(`[data-lab-section="${title}"]`);
      }
    }
  });
});

test.describe('Chat Transcript lab: messages and conversation parts', () => {
  const section = (page: Page, title: string) => page.locator(`[data-lab-section="${title}"]`);
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
    const viewport = page.locator('[data-lab-transcript="team"] .ui-scroll-region__viewport');
    await viewport.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await teamMessage(page, 'm8')
      .getByRole('button', { name: 'Quote from Maria Santos: So let us meet at eight.' })
      .click();
    await expect(teamMessage(page, 'm7')).toBeInViewport();
    const reactions = teamMessage(page, 'm11').locator('.ui-chat-message__reactions');
    await reactions.getByRole('button', { name: /🎉/ }).click();
    await expect(reactions.locator('.ui-reaction-bar__count')).toHaveText('2');
    await expect(
      teamMessage(page, 'm11').getByRole('group', {
        name: 'Seen by Ana Lopez, Dee Nolan, and Eli Brandt',
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
    const feed = page.getByRole('feed', { name: 'Team conversation' });
    const parts = await feed
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

test.describe('Chat Transcript lab: embedded in a panel', () => {
  const transcript = (page: Page, name: string) => page.locator(`[data-lab-transcript="${name}"]`);
  const frameOf = (target: Locator) =>
    target.evaluate((node) => {
      const style = getComputedStyle(node);
      const viewport = node.querySelector('.ui-scroll-region__viewport') as HTMLElement;
      return {
        border: style.borderTopWidth,
        radius: style.borderTopLeftRadius,
        background: style.backgroundColor,
        padding: getComputedStyle(viewport).paddingTop,
      };
    });

  test('UIC-CHAT-TRANSCRIPT-1.7 drops the frame when embedded and keeps the transcript behaviour', async ({
    page,
    lab,
  }) => {
    for (const theme of ['light', 'dark']) {
      await lab.open('chat-transcript', { theme });
      for (const width of ['narrow', 'wide']) {
        const framed = transcript(page, `framed-${width}`);
        const embedded = transcript(page, `embedded-${width}`);
        await expect(framed).toHaveAttribute('data-presentation', 'framed');
        await expect(embedded).toHaveAttribute('data-presentation', 'embedded');
        const framedStyle = await frameOf(framed);
        expect(framedStyle.border).toBe('1px');
        expect(framedStyle.radius).not.toBe('0px');
        expect(framedStyle.background).not.toBe('rgba(0, 0, 0, 0)');
        expect(await frameOf(embedded)).toEqual({
          border: '0px',
          radius: '0px',
          background: 'rgba(0, 0, 0, 0)',
          padding: framedStyle.padding,
        });
        const bubble = embedded.locator(
          '.ui-chat-message[data-origin="received"] .ui-chat-message__content',
        );
        const panelBackground = await embedded.evaluate((node) => {
          const panel = node.closest('[data-lab-cell]')?.firstElementChild;
          if (!panel) throw new Error('No panel');
          return getComputedStyle(panel).backgroundColor;
        });
        expect(
          await bubble.last().evaluate((node) => getComputedStyle(node).backgroundColor),
        ).not.toBe(panelBackground);
      }
      await lab.expectAccessible('[data-lab-section="Embedded in a panel"]');
    }
    const embedded = transcript(page, 'embedded-wide');
    const viewport = embedded.locator('.ui-scroll-region__viewport');
    const distanceToBottom = () =>
      viewport.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop);
    await expect.poll(distanceToBottom).toBeLessThan(2);
    await viewport.evaluate((node) => node.scrollTo({ top: 0 }));
    const jump = embedded.getByRole('button', { name: 'Jump to latest' });
    await jump.click();
    await expect.poll(distanceToBottom).toBeLessThan(2);
    const feed = embedded.getByRole('feed', { name: 'Conversation in a wide panel, embedded' });
    await expect(feed.locator('#embedded-wide-reply-4')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(feed.locator('#embedded-wide-reply-3')).toBeFocused();
    await expect(jump).toHaveCount(0);
  });

  test('UIC-CHAT-TRANSCRIPT-3.7 UIC-CHAT-TRANSCRIPT-4.1 starts over for another conversation with the same ids', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const demo = page.locator('[data-lab-demo="conversation-switch"]');
    const requests = demo.locator('[data-lab-output="older-requests"]');
    await expect(requests).toHaveText('Older history asked for: kitchen 1, garden 0');
    await expect(demo.locator('[data-lab-output="last-read"]')).toHaveText('Last read: kitchen m2');
    await demo.getByRole('radio', { name: 'Garden' }).click();
    await expect(requests).toHaveText('Older history asked for: kitchen 1, garden 1');
    await expect(demo.locator('[data-lab-output="last-read"]')).toHaveText('Last read: garden m2');
    await lab.expectAccessible('[data-lab-demo="conversation-switch"]');
  });
});

test.describe('Chat Transcript lab: options', () => {
  const message = (page: Page, cell: string) =>
    matrixCell(page, cell).locator('.ui-chat-message').first();
  const heightOf = (target: Locator) =>
    target.evaluate((node) => node.getBoundingClientRect().height);

  test('UIC-CHAT-TRANSCRIPT-2.7 UIC-CHAT-TRANSCRIPT-2.13 keeps the footer time line or collapses it until shown', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const reserved = message(page, 'line=reserved');
    const collapsing = message(page, 'line=collapsing');
    await expect(reserved).not.toHaveAttribute('data-collapse-footer-time');
    await expect(collapsing).toHaveAttribute('data-collapse-footer-time');
    const reservedFooter = reserved.locator('.ui-chat-message__footer[data-time-only]');
    const collapsingFooter = collapsing.locator('.ui-chat-message__footer[data-time-only]');
    await collapsing.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    expect(await heightOf(reservedFooter)).toBeGreaterThan(4);
    await expect.poll(() => heightOf(collapsingFooter)).toBeLessThan(1);
    await collapsing.hover();
    await expect.poll(() => heightOf(collapsingFooter)).toBeGreaterThan(4);
    await lab.expectAccessible('[data-lab-section="Footer time line"]');
  });

  test('UIC-CHAT-TRANSCRIPT-2.13 draws the caret only on a streaming message that asks for it', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const caret = (cell: string) =>
      message(page, cell)
        .locator('.ui-chat-message__content')
        .evaluate((node) => getComputedStyle(node, '::after').content);
    await expect(message(page, 'caret=on status=streaming')).toHaveAttribute(
      'data-streaming-caret',
    );
    expect(await caret('caret=on status=streaming')).toBe('"▍"');
    for (const cell of ['caret=on status=complete', 'caret=off status=streaming']) {
      await expect(message(page, cell)).not.toHaveAttribute('data-streaming-caret');
      expect(await caret(cell)).toBe('none');
    }
    await expect(message(page, 'caret=off status=streaming')).toHaveAttribute('aria-busy', 'true');
  });

  test('UIC-CHAT-TRANSCRIPT-5.5 shows at most maxVisible readers before the count', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const overflow = (limit: string) =>
      matrixCell(page, `max visible=${limit}`).locator('.ui-avatar-group__overflow');
    await expect(overflow('2')).toHaveText('+3');
    await expect(overflow('default (3)')).toHaveText('+2');
    await expect(overflow('5')).toHaveCount(0);
    await lab.expectAccessible('[data-lab-section="Read receipts limit"]');
  });

  test('UIC-CHAT-TRANSCRIPT-6.2 groups messages within maxGap', async ({ page, lab }) => {
    await lab.open('chat-transcript');
    const positions = (gap: string) =>
      matrixCell(page, `max gap=${gap}`)
        .locator('.ui-chat-message')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-group-position')));
    expect(await positions('default (5 min)')).toEqual(['first', 'last', 'single', 'single']);
    expect(await positions('15 min')).toEqual(['first', 'middle', 'last', 'single']);
  });
});
