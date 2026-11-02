import type { Locator, Page } from '@playwright/test';
import { expect, formatLabUrl, test, waitForLab } from './fixtures.js';

const note = 'AI can make mistakes. Check important information.';
const section = (page: Page, title: string) => page.locator(`[data-lab-section="${title}"]`);

async function openChat(page: Page, pause?: number) {
  const url = formatLabUrl('chat');
  await page.goto(pause ? `${url}&pause=${pause}` : url);
  await waitForLab(page);
}

/** The disclaimer under the chat in `scope`, checked to sit below its composer, in view. */
async function expectDisclaimerUnderComposer(scope: Locator) {
  const disclaimer = scope.locator('.ui-chat__disclaimer');
  await expect(disclaimer).toHaveText(note);
  await disclaimer.scrollIntoViewIfNeeded();
  await expect(disclaimer).toBeInViewport();
  const composer = await scope.locator('.ui-chat__composer').boundingBox();
  const box = await disclaimer.boundingBox();
  if (!composer || !box) throw new Error('The composer or the disclaimer has no box.');
  expect(box.y).toBeGreaterThanOrEqual(composer.y + composer.height - 0.5);
  // Outside the feed and the composer's frame.
  await expect(scope.getByRole('feed').getByText(note)).toHaveCount(0);
  await expect(scope.locator('.ui-chat__composer').getByText(note)).toHaveCount(0);
}

test.describe('Chat disclaimer', () => {
  test('UIC-CHAT-1.9 shows the disclaimer under an empty conversation and after its first turn', async ({
    page,
  }) => {
    await openChat(page);
    const empty = section(page, 'Starting a conversation');
    await expectDisclaimerUnderComposer(empty);
    await empty.getByRole('button', { name: 'Plan a weekend in Lisbon' }).click();
    await expect(empty.locator('article').first()).toContainText('Plan a weekend in Lisbon');
    await expectDisclaimerUnderComposer(empty);
  });

  test('UIC-CHAT-1.9 keeps the disclaimer in view, unannounced, while a reply streams', async ({
    page,
  }) => {
    await openChat(page, 80);
    const assistant = section(page, 'Assistant, live');
    await expectDisclaimerUnderComposer(assistant);
    await assistant.getByRole('textbox', { name: 'Message' }).click();
    await page.keyboard.type('What should I pack?');
    await page.keyboard.press('Enter');
    await expect(assistant.locator('.ui-chat__status')).not.toHaveCount(0);
    await expectDisclaimerUnderComposer(assistant);
    const live = await assistant
      .locator('.ui-chat__disclaimer')
      .evaluate((element) =>
        Boolean(element.closest('[aria-live], [role="status"], [role="log"]')),
      );
    expect(live).toBe(false);
  });

  test('UIC-CHAT-1.9 wraps the disclaimer in a narrow panel without crowding the controls', async ({
    page,
  }) => {
    await openChat(page);
    const empty = section(page, 'Starting a conversation');
    const chat = empty.locator('.ui-chat');
    // A side panel no wider than a phone's narrowest column.
    await chat.evaluate((root) => {
      (root.parentElement as HTMLElement).style.width = '220px';
    });
    const disclaimer = empty.locator('.ui-chat__disclaimer');
    await expectDisclaimerUnderComposer(empty);
    const sizes = await chat.evaluate((root) => {
      const note = root.querySelector<HTMLElement>('.ui-chat__disclaimer');
      const lineHeight = note ? Number.parseFloat(getComputedStyle(note).lineHeight) : 1;
      return {
        root: [root.scrollWidth, root.clientWidth],
        lines: (note?.getBoundingClientRect().height ?? 0) / lineHeight,
      };
    });
    expect(sizes.root[0]).toBeLessThanOrEqual(sizes.root[1]);
    expect(sizes.lines).toBeGreaterThan(1.5);
    const send = await empty.getByRole('button', { name: 'Send' }).boundingBox();
    const box = await disclaimer.boundingBox();
    if (!send || !box) throw new Error('Send or the disclaimer has no box.');
    expect(box.y).toBeGreaterThanOrEqual(send.y + send.height);
  });
});
