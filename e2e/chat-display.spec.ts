import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const display = (page: Page) => page.locator('[data-lab-demo="display"]');
const background = (message: Locator) =>
  message
    .locator('.ui-chat-message__content')
    .evaluate((content) => getComputedStyle(content).backgroundColor);
const transparent = 'rgba(0, 0, 0, 0)';

test.describe('Chat message display', () => {
  test('UIC-CHAT-1.8 hides avatars and names, shows times under the messages on hover, and draws replies without a background', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const demo = display(page);
    const question = demo.locator('article[id="display-1"]');
    const reply = demo.locator('article[id="display-2"]');
    const replyTime = reply.locator('.ui-chat-message__footer .ui-chat-message__time');
    await expect(demo.locator('.ui-chat-message__avatar')).toHaveCount(0);
    await expect(demo.locator('.ui-chat-message__author')).toHaveCount(0);
    await expect(demo.locator('.ui-chat-message__header')).toHaveCount(0);
    const replyFooter = reply.locator('.ui-chat-message__footer');
    await expect(replyTime).toHaveCSS('opacity', '0');
    await expect(replyFooter).toHaveAttribute('data-time-only', 'true');
    expect((await replyFooter.boundingBox())?.height).toBe(0);
    const toolCalls = demo.locator('article[id="display-4"]');
    await expect(toolCalls.locator('.ui-chat-message__content')).toBeVisible();
    await expect(toolCalls.locator('.ui-chat-message__time')).toHaveCount(0);
    // A written reply with sources keeps its one time; an entry of sources alone shows none.
    await expect(demo.locator('article[id="display-5"] .ui-chat-message__time')).toHaveCount(1);
    const sourcesOnly = demo.locator('article[id="display-6"]');
    await sourcesOnly.locator('.ui-chat-message__content').hover();
    await expect(sourcesOnly.locator('.ui-chat-message__time')).toHaveCount(0);
    await reply.locator('.ui-chat-message__content').hover();
    await expect(replyTime).toHaveCSS('opacity', '1');
    await expect.poll(async () => (await replyFooter.boundingBox())?.height).toBeGreaterThan(8);
    await expect(reply.locator('.ui-chat-message__actions')).toHaveCSS('opacity', '1');
    await expect(reply).toHaveAccessibleName(/^Trip planner, /);
    expect(await background(question)).not.toBe(transparent);
    expect(await background(reply)).toBe(transparent);
    const [replyBox, feedBox] = await Promise.all([
      reply.boundingBox(),
      demo.locator('.ui-chat-transcript__feed').boundingBox(),
    ]);
    expect(replyBox?.width).toBeCloseTo(feedBox?.width ?? 0, 0);

    for (const name of ['Avatars', 'Names', 'Background on replies']) {
      const option = demo.getByRole('checkbox', { name });
      await option.focus();
      await page.keyboard.press('Space');
      await expect(option).toBeChecked();
    }
    const messageTimes = demo.getByRole('radiogroup', { name: 'Message times' });
    await messageTimes.getByText('Beside the name').click();
    await expect(messageTimes.getByRole('radio', { name: 'Beside the name' })).toBeChecked();
    await expect(reply.locator('.ui-chat-message__avatar')).toBeVisible();
    await expect(reply.locator('.ui-chat-message__author')).toHaveText('Trip planner');
    await expect(reply.locator('.ui-chat-message__header .ui-chat-message__time')).toBeVisible();
    await expect(reply.locator('.ui-chat-message__footer')).toHaveCount(0);
    expect(await background(reply)).not.toBe(transparent);
    await messageTimes.getByText('Hidden', { exact: true }).click();
    await expect(demo.locator('.ui-chat-message__time')).toHaveCount(0);
    await lab.expectAccessible('[data-lab-demo="display"]');
  });

  test('UIC-CHAT-1.8 places the times of entries without written text on their own and shows a time in a tooltip', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const demo = display(page);
    const reply = demo.locator('article[id="display-2"]');
    const toolCalls = demo.locator('article[id="display-4"]');
    await demo
      .getByRole('radiogroup', { name: 'Times without written text' })
      .getByText('Beside the name')
      .click();
    await expect(
      toolCalls.locator('.ui-chat-message__header .ui-chat-message__time'),
    ).toBeVisible();
    await expect(reply.locator('.ui-chat-message__header')).toHaveCount(0);
    // A collapsed footer time takes no room, so the message is as tall with the time in a tooltip.
    const collapsedHeight = (await reply.boundingBox())?.height;
    const roomOnHover = demo.getByRole('checkbox', { name: 'Room for the time only on hover' });
    await roomOnHover.focus();
    await page.keyboard.press('Space');
    await expect(reply).not.toHaveAttribute('data-collapse-footer-time');
    await page.mouse.move(0, 0);
    expect((await reply.locator('.ui-chat-message__footer').boundingBox())?.height).toBeGreaterThan(
      8,
    );
    await roomOnHover.focus();
    await page.keyboard.press('Space');
    await page.mouse.move(0, 0);
    await demo
      .getByRole('radiogroup', { name: 'Message times' })
      .getByText('In a tooltip, on hover')
      .click();
    await expect(reply.locator('.ui-chat-message__time')).toHaveCount(0);
    expect((await reply.boundingBox())?.height).toBe(collapsedHeight);
    await reply.locator('.ui-chat-message__content').hover();
    const tooltip = page.locator('.ui-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator('.ui-chat-message__time')).toBeVisible();
    const [tooltipBox, timeBox] = await Promise.all([
      tooltip.boundingBox(),
      tooltip.locator('.ui-chat-message__time').boundingBox(),
    ]);
    expect((tooltipBox?.height ?? 0) - (timeBox?.height ?? 0)).toBeLessThan(12);
    await expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    await demo.getByRole('radiogroup', { name: 'Times without written text' }).hover();
    await expect(tooltip).toHaveCount(0);
  });

  test('UIC-CHAT-TRANSCRIPT-2.13 places or hides the time and draws a plain message without a background', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const cell = (id: string) => matrixCell(page, id).getByRole('article');
    const plain = cell('variant=plain author=neither time=none from=received');
    const bubble = cell('variant=bubble author=neither time=header from=received');
    await expect(plain).toHaveAttribute('data-variant', 'plain');
    await expect(plain.locator('.ui-chat-message__avatar')).toHaveCount(0);
    await expect(plain.locator('.ui-chat-message__header')).toHaveCount(0);
    await expect(bubble.locator('.ui-chat-message__time')).toBeVisible();
    const footer = cell('variant=bubble author=neither time=footer from=received');
    await expect(footer.locator('.ui-chat-message__header')).toHaveCount(0);
    await expect(footer.locator('.ui-chat-message__footer .ui-chat-message__time')).toHaveCSS(
      'opacity',
      '0',
    );
    await footer.locator('.ui-chat-message__content').hover();
    await expect(footer.locator('.ui-chat-message__time')).toHaveCSS('opacity', '1');
    await expect(plain).toHaveAccessibleName(/^Helper, /);
    expect(await background(plain)).toBe(transparent);
    expect(await background(bubble)).not.toBe(transparent);
    await expect(
      cell('variant=bubble author=avatar only time=header from=sent').locator(
        '.ui-chat-message__author',
      ),
    ).toHaveCount(0);
    await lab.expectAccessible('[data-lab-section="Avatar, name, time and background"]');
  });
});

test.describe('Plain reply width', () => {
  for (const theme of ['light', 'dark']) {
    test(`UIC-CHAT-TRANSCRIPT-2.13 fills the row with a plain reply and keeps its width as its activity opens (${theme})`, async ({
      page,
      lab,
    }) => {
      await lab.open('chat-transcript', { theme });
      const section = page.locator('[data-lab-section="Plain reply width"]');
      await section.scrollIntoViewIfNeeded();
      await lab.expectAccessible('[data-lab-section="Plain reply width"]');
      const box = async (locator: Locator) => {
        const bounds = await locator.boundingBox();
        if (!bounds) throw new Error('not rendered');
        return bounds;
      };
      for (const width of ['narrow', 'wide']) {
        for (const avatar of ['shown', 'hidden']) {
          const cell = (steps: string) =>
            matrixCell(section, `width=${width} avatar=${avatar} steps=${steps}`);
          for (const steps of ['collapsed', 'expanded', 'long output']) {
            const feed = await box(cell(steps).locator('.ui-chat-transcript__feed'));
            const reply = cell(steps).locator('article[id="reply"]');
            const body = await box(reply.locator('.ui-chat-message__body'));
            const sent = await box(cell(steps).locator('article[id="ask"]'));
            expect(body.x + body.width).toBeCloseTo(feed.x + feed.width, 0);
            expect(sent.x + sent.width).toBeCloseTo(feed.x + feed.width, 0);
            expect(sent.width).toBeLessThan(feed.width);
            const avatarCount = await reply.locator('.ui-chat-message__avatar').count();
            expect(avatarCount).toBe(avatar === 'shown' ? 1 : 0);
            if (avatar === 'hidden') expect(body.x).toBeCloseTo(feed.x, 0);
          }

          const collapsed = cell('collapsed').locator('article[id="reply"]');
          const trigger = collapsed.getByRole('button', { name: /Read a file, ran a command/ });
          const text = collapsed.getByText('The map builds.');
          const lineHeight = (await box(text)).height;
          const offset = async () => {
            const [body, feed] = await Promise.all([
              box(collapsed.locator('.ui-chat-message__body')),
              box(cell('collapsed').locator('.ui-chat-transcript__feed')),
            ]);
            return { start: body.x - feed.x, width: body.width };
          };
          const before = await offset();
          expect((await box(trigger)).height).toBeLessThan(lineHeight * 1.5);
          await trigger.click();
          await expect(trigger).toHaveAttribute('aria-expanded', 'true');
          await collapsed.getByRole('button', { name: /^Build/ }).click();
          const after = await offset();
          expect(after.start).toBeCloseTo(before.start, 0);
          expect(after.width).toBeCloseTo(before.width, 0);

          await cell('long output')
            .getByRole('button', { name: /^Build/ })
            .click();
          const output = cell('long output').locator(
            '.ui-chat-tool-call__json .ui-scroll-region__viewport',
          );
          const overflow = await output.evaluate(
            (viewport) => viewport.scrollWidth - viewport.clientWidth,
          );
          expect(overflow).toBeGreaterThan(0);
          const message = await box(cell('long output').locator('article[id="reply"]'));
          const feed = await box(cell('long output').locator('.ui-chat-transcript__feed'));
          expect(message.width).toBeCloseTo(feed.width, 0);
        }
      }
    });
  }

  test('UIC-CHAT-1.8 UIC-CHAT-TRANSCRIPT-2.13 draws the streaming caret only when asked and only while text streams', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const caret = async (option: string, reply: string) => {
      const message = page
        .locator(`[aria-label="Conversation (${option}, ${reply})"]`)
        .locator('article')
        .last();
      return message
        .locator('.ui-chat-message__content')
        .evaluate((content) => getComputedStyle(content, '::after').content);
    };
    const replies = ['writing', 'thinking', 'tool call', 'complete', 'cancelled'];
    for (const reply of replies) expect(await caret('default', reply)).toBe('none');
    expect(await caret('streamingCaret', 'writing')).toBe('"▍"');
    for (const reply of replies.slice(1)) expect(await caret('streamingCaret', reply)).toBe('none');
    const writing = page
      .locator('[aria-label="Conversation (default, writing)"]')
      .locator('article')
      .last();
    await expect(writing).toHaveAttribute('aria-busy', 'true');
  });
});
