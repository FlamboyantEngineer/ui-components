import { expect, test } from './fixtures.js';

test.describe('Chat native embedded controls', () => {
  test('UIC-CHAT-1.7 UIC-CHAT-5.3 searches full data and navigates messages by keyboard in a thousand-message window', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const demo = page.locator('[data-lab-demo="native-chat"]');
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('article[id="long-1"]')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Search this conversation' }).click();
    await demo
      .getByRole('searchbox', { name: 'Search this conversation' })
      .fill('weekend by the sea');
    await demo.getByRole('button', { name: 'Next match' }).click();
    const first = demo.locator('article[id="long-1"]');
    await expect(first).toHaveAttribute('data-highlighted', 'true');
    await demo.getByRole('button', { name: 'Close', exact: true }).click();
    await first.focus();
    await page.keyboard.press('ArrowDown');
    await expect(demo.locator('article[id="long-2"]')).toBeFocused();
    await page.keyboard.press('End');
    await expect(demo.locator('article[id="native-thinking"]')).toBeFocused();
    expect(await demo.locator('article').count()).toBeLessThan(40);
  });

  test('UIC-CHAT-1.5 UIC-CHAT-1.7 UIC-CHAT-PARTS-6.1 retains standalone expansion and partially answered questions across a virtual window and polling', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const demo = page.locator('[data-lab-demo="native-chat"]');
    await demo.scrollIntoViewIfNeeded();
    const result = demo.getByRole('button', { name: /^80 new check errors/ });
    await expect(result).toHaveAttribute('aria-expanded', 'false');
    await result.focus();
    await page.keyboard.press('Enter');
    await expect(result).toHaveAttribute('aria-expanded', 'true');
    const row = demo
      .locator('.ui-chat-tool-call')
      .filter({ has: page.getByRole('button', { name: /^80 new check errors/ }) });
    const details = Array.from(
      { length: 80 },
      (_, index) => `${index + 1}. <entry> **literal** check ${index + 1}`,
    ).join('\n');
    await expect(row.locator('code')).toHaveText(details);
    await expect(demo.locator('article[id="native-results"] time')).toHaveCount(0);
    await expect(demo.getByRole('button', { name: /^1 new check error/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await demo.getByRole('radio', { name: 'Blue', exact: true }).focus();
    await page.keyboard.press('Space');
    await demo.getByRole('button', { name: 'Next', exact: true }).click();
    await demo.getByRole('textbox', { name: /Any notes/ }).fill('A partial answer');
    await demo.getByRole('button', { name: 'Deny', exact: true }).click();
    await demo.getByRole('textbox', { name: /Reason/ }).fill('Keep the current version');
    await demo.getByRole('button', { name: 'Receive unchanged snapshot' }).click();
    await expect(result).toHaveAttribute('aria-expanded', 'true');
    await demo.getByRole('button', { name: 'Add later messages' }).click();
    const viewport = demo.locator('.ui-chat-transcript__log > .ui-scroll-region__viewport');
    await viewport.evaluate((element) => {
      element.scrollTop = 0;
    });
    await demo.locator('article[id="long-1"]').focus();
    await expect(demo.locator('article[id="native-results"]')).toHaveCount(0);
    expect(await demo.locator('article').count()).toBeLessThan(40);
    const jump = demo.getByRole('button', { name: /Jump to latest/ });
    await expect(async () => {
      const button = await jump.boundingBox();
      const frame = await demo.locator('.ui-chat-transcript').boundingBox();
      expect(
        button && frame && Math.abs(button.x + button.width / 2 - frame.x - frame.width / 2),
      ).toBeLessThan(2);
    }).toPass();
    await jump.click();
    await expect(result).toHaveAttribute('aria-expanded', 'true');
    await expect(demo.getByRole('textbox', { name: /Any notes/ })).toHaveValue('A partial answer');
    await expect(demo.getByRole('textbox', { name: /Reason/ })).toHaveValue(
      'Keep the current version',
    );
    await demo.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(demo.getByRole('radio', { name: 'Blue', exact: true })).toBeChecked();
    await demo.getByRole('checkbox', { name: 'Another conversation with reused IDs' }).focus();
    await page.keyboard.press('Space');
    await expect(result).toHaveAttribute('aria-expanded', 'false');
    await expect(demo.getByRole('radio', { name: 'Blue', exact: true })).not.toBeChecked();
  });

  test('UIC-CHAT-1.10 UIC-CHAT-3.15 UIC-CHAT-TRANSCRIPT-2.8 works in a narrow RTL panel with text-only status, fading and loading inertness', async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width: 420, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lab.open('chat', { theme: 'dark' });
    const demo = page.locator('[data-lab-demo="native-chat"]');
    await demo.evaluate((element) => element.setAttribute('dir', 'rtl'));
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('.ui-chat-header__avatar')).toHaveCount(0);
    await expect(demo.locator('.ui-chat-status-line__spinner')).toHaveCount(0);
    await expect(demo.locator('.ui-chat-status-line__text')).toHaveText(
      'Checking the remaining items…',
    );
    const composer = demo.getByRole('textbox', { name: 'Message', exact: true });
    await expect(composer.locator('[data-placeholder]')).toHaveAttribute(
      'data-placeholder',
      'Write a follow-up · Enter to queue',
    );
    await expect(async () => {
      const region = await demo.locator('.ui-loading-region').boundingBox();
      expect(region?.height).toBeGreaterThan(590);
      const title = await demo.locator('.ui-chat-header__title').boundingBox();
      const search = await demo
        .getByRole('button', { name: 'Search this conversation' })
        .boundingBox();
      expect(title && search && title.x >= search.x + search.width).toBe(true);
    }).toPass();
    await composer.fill('Send immediately');
    await page.keyboard.press('Control+Enter');
    const sent = demo.locator('article').filter({ hasText: 'Send immediately' });
    await expect(sent).toHaveAttribute('data-delivery', 'sending');
    await expect(sent.locator('.ui-chat-message__content')).toHaveCSS('opacity', '0.7');
    await expect(sent.locator('.ui-chat-message__delivery-label')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Settle delivery' }).click();
    await expect(sent.locator('.ui-chat-message__content')).toHaveCSS('opacity', '1');
    await demo.getByRole('checkbox', { name: 'Block while loading' }).focus();
    await page.keyboard.press('Space');
    await expect(demo.locator('.ui-loading-region__content')).toHaveAttribute('inert', '');
    await demo.getByRole('checkbox', { name: 'Block while loading' }).focus();
    await page.keyboard.press('Space');
    await expect(composer).toBeVisible();
  });

  test('UIC-CHAT-3.4 queues directly, reorders from the handle, edits through its menu and adjoins the composer', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const demo = page.locator('[data-lab-demo="native-chat"]');
    await demo.scrollIntoViewIfNeeded();
    const composer = demo.getByRole('textbox', { name: 'Message', exact: true });
    await composer.fill('Only in the queue');
    await page.keyboard.press('Enter');
    await expect(demo.locator('.ui-chat__queue-text').last()).toHaveText('Only in the queue');
    await expect(demo.locator('article').filter({ hasText: 'Only in the queue' })).toHaveCount(0);
    await expect(composer).toHaveText('');
    const handle = demo.getByRole('button', { name: 'Reorder queued message 3' });
    await handle.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect(demo.locator('.ui-chat__queue-text').nth(1)).toHaveText('Only in the queue');
    await demo.getByRole('button', { name: 'Actions for queued message 2' }).click();
    await page.getByRole('menuitem', { name: 'Edit queued message 2' }).click();
    await expect(composer).toHaveText('Only in the queue');
    await page.keyboard.press('Escape');
    await expect(async () => {
      const queue = await demo.locator('.ui-chat__queue').boundingBox();
      const input = await demo.locator('.ui-chat__composer').boundingBox();
      expect(queue && input && Math.abs(queue.y + queue.height - input.y)).toBeLessThan(1);
    }).toPass();
  });
});
