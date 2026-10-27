import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

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
    await expect(replyTime).toHaveCSS('opacity', '0');
    await reply.locator('.ui-chat-message__content').hover();
    await expect(replyTime).toHaveCSS('opacity', '1');
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
    await demo.getByText('Beside the name').click();
    await expect(demo.getByRole('radio', { name: 'Beside the name' })).toBeChecked();
    await expect(reply.locator('.ui-chat-message__avatar')).toBeVisible();
    await expect(reply.locator('.ui-chat-message__author')).toHaveText('Trip planner');
    await expect(reply.locator('.ui-chat-message__header .ui-chat-message__time')).toBeVisible();
    await expect(reply.locator('.ui-chat-message__footer')).toHaveCount(0);
    expect(await background(reply)).not.toBe(transparent);
    await demo.getByText('Hidden', { exact: true }).click();
    await expect(demo.locator('.ui-chat-message__time')).toHaveCount(0);
    await lab.expectAccessible('[data-lab-demo="display"]');
  });

  test('UIC-CHAT-TRANSCRIPT-2.13 places or hides the time and draws a plain message without a background', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    const cell = (id: string) => page.locator(`[data-lab-cell="${id}"]`).getByRole('article');
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
