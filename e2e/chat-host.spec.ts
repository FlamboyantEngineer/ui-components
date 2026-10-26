import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const host = (page: Page) => page.locator('[data-lab-section="Host controls"]');
const composer = (page: Page) => host(page).getByRole('textbox', { name: 'Message' });

test.describe('Chat lab host controls', () => {
  test('UIC-CHAT-2.4 UIC-CHAT-3.7 quotes an answer, keeps the message and quote when refused, and sends once on retry', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const answer = host(page).locator('article[id="host-answer"]');
    await answer.hover();
    await answer.getByRole('button', { name: 'Quote', exact: true }).click();
    const banner = host(page).locator('.ui-chat__banner');
    await expect(banner).toContainText('Quoting');
    await expect(composer(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(banner).toHaveCount(0);

    await answer.hover();
    await answer.getByRole('button', { name: 'Quote', exact: true }).click();
    await page.keyboard.type('Is the 8:05 the direct one?');
    await page.keyboard.press('Control+Enter');
    await page.keyboard.press('Control+Enter');
    await expect(host(page).locator('.ui-chat__composer')).toHaveAttribute(
      'data-submitting',
      'true',
    );
    await expect(host(page).getByRole('alert')).toContainText('Not sent: Service unavailable');
    await expect(composer(page)).toHaveText('Is the 8:05 the direct one?');
    await expect(banner).toContainText('Two do');

    await page.keyboard.press('Control+Enter');
    const sent = host(page).locator('article').filter({ hasText: 'Is the 8:05 the direct one?' });
    await expect(sent).toHaveCount(1);
    const quote = sent.getByRole('button', { name: /^Quote from Trip planner/ });
    await expect(quote).toContainText('Two do');
    await expect(composer(page)).toHaveText('');
    await expect(banner).toHaveCount(0);
    await quote.click();
    await expect(answer).toHaveAttribute('data-highlighted', 'true');
    await expect(answer).toBeFocused();
  });

  test('UIC-CHAT-3.8 UIC-CHAT-3.1 puts the host’s checkboxes before the model picker, wraps them, and sends blank context', async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width: 420, height: 900 });
    await lab.open('chat');
    const toolbar = host(page).locator('.ui-message-composer__toolbar');
    const text = (await toolbar.textContent()) ?? '';
    expect(text.indexOf('Allow changes')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('Allow changes')).toBeLessThan(text.indexOf('Balanced'));
    const send = host(page).getByRole('button', { name: 'Send' });
    await send.scrollIntoViewIfNeeded();
    await expect(send).toBeInViewport({ ratio: 1 });
    const frame = await host(page).locator('.ui-chat__composer').boundingBox();
    const button = await send.boundingBox();
    const tools = await toolbar.boundingBox();
    expect(button && frame && button.x + button.width <= frame.x + frame.width).toBe(true);
    expect(tools && button && tools.height > button.height * 1.5, 'the tools wrap').toBe(true);

    await composer(page).click();
    await page.keyboard.type('First line');
    await page.keyboard.press('Enter');
    await page.keyboard.type('second line');
    await expect(composer(page)).toContainText('second line');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await expect(send).toHaveAttribute('aria-disabled', 'true');
    await toolbar.getByText('Ask about the selection').click();
    await expect(send).not.toHaveAttribute('aria-disabled');
  });

  test('UIC-CHAT-3.9 UIC-CHAT-3.8 starts the tools with the + menu and sends what its items add', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    await host(page).getByText('Refuse the next message', { exact: true }).click();
    const toolbar = host(page).locator('.ui-message-composer__toolbar');
    await expect(toolbar.locator(':scope > *').first()).toHaveClass(
      /ui-message-composer__menu-button/,
    );
    await expect(toolbar.getByRole('button', { name: 'Attach files' })).toHaveCount(0);
    const text = (await toolbar.textContent()) ?? '';
    expect(text.indexOf('Allow changes')).toBeLessThan(text.indexOf('Balanced'));
    const plus = toolbar.getByRole('button', { name: 'Add and more' });
    const menu = page.getByRole('menu', { name: 'Add and more' });
    await plus.click();
    const menuBox = await menu.boundingBox();
    const frameBox = await host(page).locator('.ui-chat__composer').boundingBox();
    expect(
      menuBox && frameBox && menuBox.y + menuBox.height <= frameBox.y + 1,
      'the menu opens above the composer',
    ).toBe(true);
    await menu.getByRole('menuitemcheckbox', { name: /^Plan mode/ }).click();
    await expect(menu.getByRole('menuitemcheckbox', { name: /^Plan mode/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await menu.getByRole('menuitem', { name: /^Insert a goal prompt/ }).click();
    await expect(composer(page)).toBeFocused();
    await page.keyboard.type('reach the coast by noon ');
    await plus.click();
    await menu.getByRole('menuitem', { name: /^Calendar/ }).click();
    await expect(composer(page).locator('.ui-message-composer__pill')).toHaveText(['/calendar']);
    const chooser = page.waitForEvent('filechooser');
    await plus.click();
    await menu.getByRole('menuitem', { name: /^Attach files/ }).click();
    await (
      await chooser
    ).setFiles({ name: 'Timetable.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') });
    const files = host(page).getByRole('list', { name: 'Attachments' });
    await expect(files).toContainText('Timetable.pdf');
    await composer(page).focus();
    await page.keyboard.press('Control+Enter');
    const sent = host(page).locator('article').filter({ hasText: 'Goal: reach the coast by noon' });
    await expect(sent).toHaveCount(1);
    await expect(sent).toContainText('/calendar');
    await expect(host(page).locator('article').filter({ hasText: 'First the steps' })).toHaveCount(
      1,
    );
    await expect(files).toHaveCount(0);
  });
});
