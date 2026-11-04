import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

test.describe('Chat Transcript lab: composer beside the transcript', () => {
  const column = (page: Page) => page.locator('[data-lab-column]');
  const viewport = (page: Page) => column(page).locator('.ui-scroll-region__viewport');
  const composer = (page: Page) =>
    page.getByRole('textbox', { name: 'Message beside the conversation' });
  const jump = (page: Page) =>
    column(page).getByRole('button', { name: /^Jump to latest$|new message/ });
  const distanceToBottom = (page: Page) =>
    viewport(page).evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop);

  /** Records the transcript viewport's height each time the composer reads its text's height. */
  const recordMeasuredHeights = (page: Page) =>
    page.evaluate(() => {
      const area = document.querySelector<HTMLTextAreaElement>('[data-lab-column] textarea');
      const view = document.querySelector<HTMLElement>(
        '[data-lab-column] .ui-scroll-region__viewport',
      );
      const read = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')?.get;
      if (!area || !view || !read) throw new Error('The column has no composer or viewport.');
      const heights: number[] = [];
      Object.assign(window, { measuredHeights: heights });
      Object.defineProperty(area, 'scrollHeight', {
        configurable: true,
        get(this: HTMLTextAreaElement) {
          heights.push(view.clientHeight);
          return read.call(this) as number;
        },
      });
    });
  const measuredHeights = (page: Page) =>
    page.evaluate(() => (window as unknown as { measuredHeights: number[] }).measuredHeights);

  test('UIC-MESSAGE-COMPOSER-1.1 UIC-CHAT-TRANSCRIPT-1.2 keeps following while the composer beside it measures', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    await column(page).scrollIntoViewIfNeeded();
    await expect.poll(() => distanceToBottom(page)).toBeLessThanOrEqual(1);
    const height = await viewport(page).evaluate((node) => node.clientHeight);
    await recordMeasuredHeights(page);
    await composer(page).click();
    // A keystroke that leaves the composer's height as it was.
    await page.keyboard.type('Draft');
    expect(await distanceToBottom(page)).toBeLessThanOrEqual(1);
    const measured = await measuredHeights(page);
    expect(measured.length).toBeGreaterThan(0);
    expect(new Set(measured)).toEqual(new Set([height]));
    // Wrapping, a new line, and replies arriving while the composer keeps focus.
    await page.keyboard.type(' text that wraps while a reply arrives. ');
    await page.keyboard.press('Shift+Enter');
    await expect.poll(() => distanceToBottom(page)).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: 'Receive a reply' }).click();
    await composer(page).click();
    await expect.poll(() => distanceToBottom(page)).toBeLessThanOrEqual(1);
    await expect(jump(page)).toBeHidden();
    // Shrinking back to one line.
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Short');
    await expect.poll(() => distanceToBottom(page)).toBeLessThanOrEqual(1);
    await expect(composer(page)).toBeFocused();
    await expect(composer(page)).toHaveValue('Short');
    await expect(jump(page)).toBeHidden();
  });

  test('UIC-CHAT-TRANSCRIPT-1.2 keeps the reading place while typing scrolled away, and follows again after the jump', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-transcript');
    await column(page).scrollIntoViewIfNeeded();
    await expect.poll(() => distanceToBottom(page)).toBeLessThanOrEqual(1);
    const box = await viewport(page).boundingBox();
    if (!box) throw new Error('The transcript has no box.');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -300);
    await expect.poll(() => distanceToBottom(page)).toBeGreaterThan(100);
    await expect(jump(page)).toBeVisible();
    const top = await viewport(page).evaluate((node) => node.scrollTop);
    await composer(page).click();
    await page.keyboard.type('Reading history while I type a line long enough to wrap');
    await page.getByRole('button', { name: 'Receive a reply' }).click();
    expect(await viewport(page).evaluate((node) => node.scrollTop)).toBeCloseTo(top, 0);
    await jump(page).click();
    await expect.poll(() => distanceToBottom(page)).toBeLessThanOrEqual(1);
    await composer(page).click();
    await page.keyboard.press('End');
    await page.keyboard.type(' and more');
    await page.keyboard.press('Shift+Enter');
    await page.getByRole('button', { name: 'Receive a reply' }).click();
    await expect.poll(() => distanceToBottom(page)).toBeLessThanOrEqual(1);
    await expect(jump(page)).toBeHidden();
  });
});
