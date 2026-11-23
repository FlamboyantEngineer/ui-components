import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

/** Where the actions bar sits against the bubble's upper corners, in pixels. */
const offsets = (message: Locator) =>
  message.evaluate((node) => {
    const rect = (slot: string) =>
      (node.querySelector(`.ui-chat-message__${slot}`) as HTMLElement).getBoundingClientRect();
    const [bar, bubble, body] = [rect('actions'), rect('content'), rect('body')];
    const text = (node.querySelector('.ui-bubble__content') as HTMLElement).getBoundingClientRect();
    return {
      start: bar.left - bubble.left,
      end: bubble.right - bar.right,
      top: bar.top - bubble.top,
      bottom: bar.bottom - bubble.top,
      overText: bar.bottom - text.top,
      bodyWider: body.width - bubble.width,
    };
  });

/**
 * The bar overlaps the bubble's top edge, starting just inside its left corner, and reaches no
 * further down than the bubble's padding, so it covers none of the text.
 */
function expectAtUpperLeft(offset: Awaited<ReturnType<typeof offsets>>) {
  expect(offset.start).toBeGreaterThanOrEqual(0);
  expect(offset.start).toBeLessThanOrEqual(8);
  expect(offset.top).toBeLessThan(0);
  expect(offset.bottom).toBeGreaterThan(0);
  expect(offset.overText).toBeLessThanOrEqual(0);
}

test.describe('Chat Transcript lab: actions on a long message', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test('UIC-CHAT-TRANSCRIPT-2.7 anchors the actions to the bubble on hover and keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const demo = page.locator('[data-lab-demo="long-actions"]');
    const sent = demo.locator('article[data-message-id="long-actions-ask"]');
    const actions = sent.locator('.ui-chat-message__actions');
    await sent.scrollIntoViewIfNeeded();
    // The long message fills its bubble, and the row around it is wider still.
    expect((await offsets(sent)).bodyWider).toBeGreaterThan(40);

    await sent.locator('.ui-chat-message__content').hover();
    await expect(actions).toHaveCSS('opacity', '1');
    expectAtUpperLeft(await offsets(sent));

    await page.mouse.move(0, 0);
    await expect(actions).toHaveCSS('opacity', '0');
    // Keyboard focus: the reader enters the message, at its time, and tabs on to the bar.
    await sent.focus();
    await page.keyboard.press('Enter');
    await expect(sent.locator('.ui-chat-message__time')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(sent.getByRole('button', { name: 'Copy' })).toBeFocused();
    await expect(sent).toHaveAttribute('data-focus-within', 'true');
    await expect(actions).toHaveCSS('opacity', '1');
    expectAtUpperLeft(await offsets(sent));

    const reply = demo.locator('article[data-message-id="long-actions-reply"]');
    await reply.locator('.ui-chat-message__content').hover();
    await expect(reply.locator('.ui-chat-message__actions')).toHaveCSS('opacity', '1');
    const replyOffset = await offsets(reply);
    expect(replyOffset.end).toBeGreaterThanOrEqual(0);
    expect(replyOffset.end).toBeLessThanOrEqual(8);
  });
});
