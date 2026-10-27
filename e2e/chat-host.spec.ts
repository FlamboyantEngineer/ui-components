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

  test('UIC-CHAT-3.8 UIC-CHAT-3.1 fills both ends of the composer row, shrinks it to icons when narrow, and sends blank context', async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width: 420, height: 900 });
    await lab.open('chat');
    const frame = host(page).locator('.ui-chat__composer');
    const start = host(page).locator('.ui-message-composer__start');
    const end = host(page).locator('.ui-message-composer__end');
    await expect(start.getByRole('button')).toHaveCount(3);
    await expect(start.getByRole('button').first()).toHaveAccessibleName('Add and more');
    await expect(end.getByRole('button', { name: /^Model:/ })).toBeVisible();
    await expect(end.getByRole('button').last()).toHaveAccessibleName('Send');
    await expect(frame).toHaveAttribute('data-compact', 'true');
    await expect(start.getByRole('button', { name: 'Plan' })).toHaveAttribute(
      'data-content',
      'icon',
    );
    const send = host(page).getByRole('button', { name: 'Send' });
    await send.scrollIntoViewIfNeeded();
    await expect(send).toBeInViewport({ ratio: 1 });
    const frameBox = await frame.boundingBox();
    const button = await send.boundingBox();
    expect(button && frameBox && button.x + button.width <= frameBox.x + frameBox.width).toBe(true);

    await composer(page).click();
    await page.keyboard.type('First line');
    await page.keyboard.press('Enter');
    await page.keyboard.type('second line');
    await expect(composer(page)).toContainText('second line');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await expect(send).toHaveAttribute('aria-disabled', 'true');
    await end.getByRole('button', { name: 'Ask about the selection' }).click();
    await expect(send).not.toHaveAttribute('aria-disabled');
  });

  test('UIC-CHAT-3.9 UIC-CHAT-3.8 starts the row with the + menu and sends what its items add', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    await host(page).getByText('Refuse the next message', { exact: true }).click();
    const start = host(page).locator('.ui-message-composer__start');
    await expect(start.locator(':scope > *').first()).toHaveClass(
      /ui-message-composer__menu-button/,
    );
    await expect(host(page).getByRole('button', { name: 'Attach files' })).toHaveCount(0);
    const plus = start.getByRole('button', { name: 'Add and more' });
    const menu = page.getByRole('menu', { name: 'Add and more' });
    // The composer at the bottom of the window, where it sits in a conversation.
    await plus.evaluate((element) => element.scrollIntoView({ block: 'end' }));
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
    await expect(start.getByRole('button', { name: 'Plan' })).toHaveAttribute(
      'aria-pressed',
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

  test('UIC-CHAT-3.11 inserts sidebar records at the caret, skips one already there, and sends them in a new and an existing conversation', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const section = page.locator('[data-lab-section="Records from a sidebar"]');
    const input = section.getByRole('textbox', { name: 'Message' });
    const pills = input.locator('.ui-message-composer__pill');
    const add = (label: string) =>
      section.getByRole('button', { name: `Add ${label} to the message` });
    await input.click();
    await page.keyboard.type('Please check first');
    for (let step = 0; step < 6; step += 1) await page.keyboard.press('ArrowLeft');
    await add('TRIP-4').focus();
    await page.keyboard.press('Enter');
    await expect(input).toBeFocused();
    await expect(pills).toHaveCount(1);
    await expect(pills.first()).toHaveAttribute('data-kind', 'reference');
    await expect(input).toHaveText(/^Please check .+ first$/);
    await add('TRIP-4').click();
    await expect(section.getByRole('status').last()).toHaveText(
      'TRIP-4 is already in the message.',
    );
    await expect(pills).toHaveCount(1);
    await add('NOTE-12').click();
    await expect(pills).toHaveCount(2);
    await page.keyboard.press('Control+z');
    await expect(pills).toHaveCount(1);
    await add('NOTE-12').click();
    await page.keyboard.press('Enter');
    await expect(section.getByText('Looking at TRIP-4, NOTE-12.', { exact: true })).toBeVisible();
    await expect(input).toHaveText('');

    await section.getByRole('radio', { name: 'Existing conversation' }).click();
    await expect(section.getByText('Add the records you want me to look at.')).toBeVisible();
    await add('NOTE-9').click();
    await expect(input).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(section.getByText('Looking at NOTE-9.', { exact: true })).toBeVisible();
  });
});
