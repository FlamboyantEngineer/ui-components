import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const output = (page: Page, scope: string, name: string) =>
  demo(page, scope).locator(`[data-lab-output="${name}"]`);

// Options of several components that their labs gained so each one can be tried by hand.
test.describe('Lab options', () => {
  test('UIC-ACTIVITY-FEED-2.1 reports a failed older page and loads it on retry', async ({
    page,
    lab,
  }) => {
    await lab.open('activity-feed');
    const feed = demo(page, 'feed-load-error');
    await feed.scrollIntoViewIfNeeded();
    await expect(output(page, 'feed-load-error', 'load error')).toHaveText('The server is busy');
    await feed.getByRole('button', { name: /older|more/i }).click();
    await expect(feed.getByText('renamed')).toBeVisible();
  });

  test('UIC-CHAT-LIST-1.11 reports a failed page of history and loads it on retry', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-list');
    const list = demo(page, 'history-load-error');
    const loadMore = list.getByRole('button', { name: 'Load more' });
    await loadMore.click();
    await expect(output(page, 'history-load-error', 'load error')).toHaveText('The server is busy');
    await expect(list.getByText('Choosing a reading lamp')).toHaveCount(0);
    await loadMore.click();
    await expect(list.getByText('Choosing a reading lamp')).toBeVisible();
  });

  test('UIC-VERSION-HISTORY-1.11 unfolds versions from the host and at first', async ({
    page,
    lab,
  }) => {
    await lab.open('version-history');
    const host = demo(page, 'host-folding');
    await host.getByRole('button', { name: 'Unfold every named version' }).click();
    await expect(output(page, 'host-folding', 'host expanded')).toHaveText('f5, f2');
    await host.getByRole('button', { name: 'Fold them all' }).click();
    await expect(output(page, 'host-folding', 'host expanded')).toHaveText('none');
  });

  test('UIC-CHAT-SOURCES-1.4 lets the host show the sources', async ({ page, lab }) => {
    await lab.open('chat-sources');
    const sources = demo(page, 'host-expanded');
    await sources.getByRole('button', { name: 'Host shows the sources' }).click();
    await expect(output(page, 'host-expanded', 'expanded')).toHaveText('true');
    await expect(sources.getByRole('link').first()).toBeVisible();
  });

  test('UIC-PROGRESS-BAR-1.4 writes the value in the host format', async ({ page, lab }) => {
    await lab.open('progress-bar');
    await expect(demo(page, 'format-options').getByRole('progressbar').first()).toHaveAttribute(
      'aria-valuetext',
      /45\s?MB/,
    );
  });

  test('UIC-CONSTRAINT-EDITOR-1.3 orders bounds with the host compare', async ({ page, lab }) => {
    await lab.open('constraint-editor');
    await expect(output(page, 'compare', 'hex constraints')).toContainText('"default":"1F"');
  });

  test('UIC-MESSAGE-COMPOSER-1.2 UIC-MESSAGE-COMPOSER-5.1 adds its own menu and reports a refused send', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const composer = demo(page, 'own-menu');
    const input = composer.getByRole('textbox', { name: 'Message with sending options' });
    await input.fill('Lunch at noon');
    await input.press('Enter');
    await expect(output(page, 'own-menu', 'send error')).toHaveText(
      'The host refused the message.',
    );
    await expect(input).toHaveValue('Lunch at noon');
  });

  test('UIC-MINI-APP-1.3 restarts with an allowed origin in its policy', async ({ page, lab }) => {
    await lab.open('mini-app');
    const app = demo(page, 'network');
    await expect(output(page, 'network', 'ready')).toHaveText('1');
    await app.getByRole('button', { name: 'Allow https://cdn.example.org' }).click();
    await expect(output(page, 'network', 'ready')).toHaveText('2');
    await expect(
      app.frameLocator('iframe').getByText(/connect-src[^;]*https:\/\/cdn\.example\.org/),
    ).toBeVisible();
  });

  test('UIC-TEXT-FIELD-3.5 shows a password at first with defaultRevealed', async ({
    page,
    lab,
  }) => {
    await lab.open('text-field');
    await expect(page.getByLabel('Shared code', { exact: true })).toHaveAttribute('type', 'text');
  });

  test('UIC-FORM-LAYOUT-3.2 follows the host selection', async ({ page, lab }) => {
    await lab.open('form-layout');
    const designer = demo(page, 'host-selection');
    await designer.getByRole('button', { name: 'Host selects Full name' }).click();
    await expect(output(page, 'host-selection', 'Selected')).toHaveText('name');
  });

  test('UIC-SEPARATOR-1.1 draws a rule as a div', async ({ page, lab }) => {
    await lab.open('separator');
    await expect(demo(page, 'element').locator('div.ui-separator')).toHaveCount(1);
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.2 shows an inherited value and resets to it', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const strip = page.locator('[data-lab-inherited-strip]');
    await expect(strip.getByText('8 px on every side')).toBeVisible();
    await strip.getByLabel('Padding top').fill('4');
    await expect(strip.locator('[data-lab-output="padding"]')).toContainText('top 4');
    await strip.getByRole('button', { name: /Reset/ }).click();
    await expect(strip.locator('[data-lab-output="padding"]')).toHaveText('inherited');
  });

  test('UIC-COMMENT-THREAD-3.2 reads the host mention format with parse', async ({ page, lab }) => {
    await lab.open('comment-thread');
    const text = demo(page, 'host-mention-format');
    await expect(text.locator('.ui-comment-text__mention')).toHaveText(['Jon Berg', 'Lena Ortiz']);
    await expect(text).not.toContainText('<@');
  });
});
