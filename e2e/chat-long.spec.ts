import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const long = (page: Page) => page.locator('[data-lab-demo="working-session"]');

test.describe('Chat long conversation', () => {
  test('UIC-CHAT-1.7 mounts only the messages near the view and shows a time on hover', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const demo = long(page);
    await demo.scrollIntoViewIfNeeded();
    const transcript = demo.locator('.ui-chat-transcript');
    await expect(transcript).toHaveAttribute('data-virtualized', 'true');
    const latest = demo.locator('article[id="long-1000"]');
    await expect(latest).toBeVisible();
    expect(await demo.locator('article').count()).toBeLessThan(40);
    await latest.locator('.ui-chat-message__content').hover();
    await expect(page.locator('.ui-tooltip .ui-chat-message__time')).toBeVisible();
  });

  test('UIC-CHAT-1.7 mounts older messages as the reader scrolls up and lets the newest go', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const demo = long(page);
    await demo.scrollIntoViewIfNeeded();
    const viewport = demo.locator('.ui-chat-transcript__log > .ui-scroll-region__viewport');
    await expect(demo.locator('article[id="long-1000"]')).toBeVisible();
    await viewport.evaluate((element) => {
      element.scrollTop -= 20_000;
    });
    await expect(async () => {
      const ids = await demo
        .locator('article')
        .evaluateAll((articles) => articles.map((article) => Number(article.id.slice(5))));
      expect(Math.min(...ids)).toBeLessThan(990);
      expect(ids.length).toBeLessThan(40);
    }).toPass();
    await expect(demo.locator('article[id="long-990"]')).toHaveCount(0);
  });
});
