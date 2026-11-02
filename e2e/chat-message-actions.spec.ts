import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const bar = (page: Page, commands: string) =>
  matrixCell(page, `commands=${commands}`).locator(`.ui-chat-message-actions`);
const log = (page: Page, name: string) => page.locator(`[data-lab-log="${name}"]`);
const message = (page: Page, id: string) => page.locator(`[data-lab-message="${id}"]`);

/** Waits until an overlay has settled, so axe sees its final colours. */
async function expectSettled(overlay: Locator) {
  await expect(overlay).not.toHaveAttribute('data-entering');
  await expect(overlay).not.toHaveAttribute('data-exiting');
}

test.describe('Chat Message Actions lab', () => {
  test('UIC-CHAT-MESSAGE-ACTIONS-1.1 UIC-CHAT-MESSAGE-ACTIONS-1.2 moves between the commands with the arrow keys', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-message-actions');
    const all = bar(page, 'all');
    await expect(all).toHaveRole('toolbar');
    await expect(all).toHaveAccessibleName('Message actions');
    await expect(all.getByRole('button')).toHaveCount(7);
    await expect(bar(page, 'copy').getByRole('button')).toHaveCount(1);
    await all.getByRole('button', { name: 'Copy' }).focus();
    const names: string[] = [];
    for (let step = 0; step < 7; step += 1) {
      names.push(
        await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? ''),
      );
      await page.keyboard.press('ArrowRight');
    }
    expect(names).toEqual([
      'Copy',
      'Good response',
      'Bad response',
      'Reply',
      'Add reaction',
      'Edit',
      'Delete',
    ]);
    await expect(all.getByRole('button', { name: 'Delete' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(all.getByRole('button', { name: 'Edit' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(all.getByRole('button', { name: 'Edit' })).not.toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(all.getByRole('button', { name: 'Edit' })).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-CHAT-MESSAGE-ACTIONS-1.3 copies and shows the copied state', async ({
    page,
    lab,
    baseURL,
  }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(baseURL ?? 'http://127.0.0.1/').origin,
    });
    await lab.open('chat-message-actions');
    const copyBar = bar(page, 'copy');
    await copyBar.getByRole('button', { name: 'Copy' }).click();
    await expect(copyBar).toHaveAttribute('data-copied', 'true');
    await expect(copyBar.locator('.ui-button__icon')).toHaveAttribute('data-glyph', 'check');
    await expect(copyBar.getByRole('status')).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'Take the 28 tram to the castle, then walk down to the river.',
    );
    await expect(copyBar).not.toHaveAttribute('data-copied', { timeout: 4000 });
  });

  test('UIC-CHAT-MESSAGE-ACTIONS-2.3 UIC-CHAT-MESSAGE-ACTIONS-2.4 rates with reasons and a comment from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-message-actions');
    const reasons = bar(page, 'reasons');
    const up = reasons.getByRole('button', { name: 'Good response' });
    await up.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'What went well?' });
    await expect(dialog).toBeVisible();
    await expect(up).toHaveAttribute('aria-expanded', 'true');
    await expect(reasons).toHaveAttribute('data-open', 'true');
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Accurate' })).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(dialog.getByRole('button', { name: 'Too long' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const comment = dialog.getByRole('textbox', { name: 'Comment (optional)' });
    await comment.focus();
    await page.keyboard.type('Clear directions');
    // A secondary click in the comment opens its field menu; Escape closes only that menu.
    await comment.click({ button: 'right' });
    await expect(page.getByRole('menu', { name: 'Comment (optional) actions' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expect(comment).toBeFocused();
    await page.keyboard.press('End');
    await expectSettled(page.locator('.ui-chat-message-actions__feedback'));
    await lab.expectAccessible('.ui-chat-message-actions__feedback');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Submit' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(log(page, 'reasons')).toHaveText(
      'rating up; reasons Accurate, Too long; comment "Clear directions"',
    );
    await expect(up).toBeFocused();
    await expect(up).toHaveAttribute('aria-pressed', 'true');
    await expect(reasons).not.toHaveAttribute('data-open');
    await page.keyboard.press('Enter');
    await expect(log(page, 'reasons')).toHaveText('rating cleared');
    await expect(up).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'What went wrong?' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(log(page, 'reasons')).toHaveText('rating down');
    await expect(reasons.getByRole('button', { name: 'Bad response' })).toBeFocused();
  });

  test('UIC-CHAT-MESSAGE-ACTIONS-3.2 reacts with an emoji from the picker', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-message-actions');
    const reply = bar(page, 'reply');
    await reply.getByRole('button', { name: 'Add reaction' }).click();
    const search = page.getByRole('searchbox', { name: 'Search emoji' });
    await expect(search).toBeFocused();
    await expect(reply).toHaveAttribute('data-open', 'true');
    const popover = page.locator('.ui-chat-message-actions__emoji-popover');
    await expectSettled(popover);
    await search.fill('party popper');
    await page.keyboard.press('Enter');
    await expect(popover).toBeHidden();
    await expect(log(page, 'reply')).toHaveText('react 🎉');
    await expect(reply.getByRole('button', { name: 'Add reaction' })).toBeFocused();
  });

  test('UIC-CHAT-MESSAGE-ACTIONS-3.3 deletes after a confirmation', async ({ page, lab }) => {
    await lab.open('chat-message-actions');
    const own = bar(page, 'own');
    const remove = own.getByRole('button', { name: 'Delete' });
    await remove.click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete message?' });
    await expect(dialog).toBeVisible();
    await expect(own).toHaveAttribute('data-open', 'true');
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await expectSettled(page.locator('.ui-modal-overlay, .ui-modal').first());
    await lab.expectAccessible('[role="alertdialog"]');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(remove).toBeFocused();
    await expect(log(page, 'own')).toHaveText('');
    await remove.click();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog).toBeHidden();
    await expect(log(page, 'own')).toHaveText('delete');
  });

  test('UIC-CHAT-MESSAGE-ACTIONS-3.4 shows the bar on hover and focus and keeps it while its overlay is open', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-message-actions');
    const answer = message(page, 'answer');
    const answerBar = answer.locator('.ui-chat-message-actions');
    await answer.scrollIntoViewIfNeeded();
    await expect(answerBar).toHaveCSS('opacity', '0');
    await answer.hover();
    await expect(answerBar).toHaveCSS('opacity', '1');
    await answerBar.getByRole('button', { name: 'Bad response' }).click();
    const dialog = page.getByRole('dialog', { name: 'What went wrong?' });
    await expect(dialog).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(answerBar).toHaveAttribute('data-open', 'true');
    await expect(answerBar).toHaveCSS('opacity', '1');
    await dialog.getByRole('button', { name: 'Skip' }).click();
    await expect(log(page, 'conversation')).toHaveText('rating down');
    // Escape returns to the message and Down moves to the next one, whose commands show in turn
    // (the transcript's keyboard model: Tab cycles inside a message).
    await answerBar.getByRole('button', { name: 'Bad response' }).focus();
    await page.keyboard.press('Escape');
    await expect(answer).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(message(page, 'ana')).toBeFocused();
    await expect(answerBar).toHaveCSS('opacity', '0');
    await message(page, 'ana')
      .locator('.ui-chat-message-actions')
      .getByRole('button', { name: 'Copy' })
      .focus();
    await expect(message(page, 'ana').locator('.ui-chat-message-actions')).toHaveCSS(
      'opacity',
      '1',
    );
  });

  test('UIC-CHAT-MESSAGE-ACTIONS-4.1 UIC-CHAT-MESSAGE-ACTIONS-4.2 offers the commands in a context menu', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-message-actions');
    const ana = message(page, 'ana');
    await ana.scrollIntoViewIfNeeded();
    await ana.getByText('I can meet you at the river at noon.').click({ button: 'right' });
    const menu = page.getByRole('menu', { name: 'Message actions' });
    await expect(menu).toBeVisible();
    await expect(menu.locator('[role^="menuitem"]')).toHaveText(['Copy', 'Reply', 'Add reaction']);
    await expectSettled(page.locator('.ui-menu-popover'));
    await lab.expectAccessible('.ui-menu-popover');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    const anaCopy = ana.getByRole('button', { name: 'Copy' });
    await anaCopy.focus();
    await page.keyboard.press('Shift+F10');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(ana.locator('.ui-chat-message-actions__status')).toHaveText('Copied');
    await expect(anaCopy).toBeFocused();

    const answer = message(page, 'answer');
    await answer.getByText('Take the 28 tram').click({ button: 'right' });
    await menu.getByRole('menuitemcheckbox', { name: 'Good response' }).click();
    const dialog = page.getByRole('dialog', { name: 'What went well?' });
    await expect(dialog).toBeVisible();
    await expect(answer.locator('.ui-chat-message-actions')).toHaveAttribute('data-open', 'true');
    await dialog.getByRole('button', { name: 'Helpful' }).click();
    await dialog.getByRole('button', { name: 'Submit' }).click();
    await expect(log(page, 'conversation')).toHaveText('rating up; reasons Helpful');
    await expect(
      answer.getByRole('button', { name: 'Good response', includeHidden: true }),
    ).toHaveAttribute('aria-pressed', 'true');

    const question = message(page, 'question');
    await question.getByText('Which tram goes to the castle?').click({ button: 'right' });
    await menu.getByRole('menuitem', { name: 'Edit' }).click();
    const field = question.getByRole('textbox', { name: 'Edit message' });
    await expect(field).toBeVisible();
    const prevented = await field.evaluate(
      (node) =>
        !node.dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }),
        ),
    );
    expect(prevented).toBe(false);
    await expect(menu).toBeHidden();
    await question.getByRole('button', { name: 'Save' }).click();
    await question.getByText('Which tram goes to the castle?').click({ button: 'right' });
    await menu.getByRole('menuitem', { name: 'Delete' }).click();
    await page
      .getByRole('alertdialog', { name: 'Delete message?' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(question).toContainText('Message deleted');
    await expect(log(page, 'conversation')).toContainText('delete question');
  });

  test('UIC-CHAT-TRANSCRIPT-2.12 UIC-CHAT-MESSAGE-ACTIONS-3.2 UIC-CHAT-MESSAGE-ACTIONS-4.1 shows reactions at the bottom right of each message', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-message-actions');
    const pick = async (name: string) => {
      const search = page.getByRole('searchbox', { name: 'Search emoji' });
      await expect(search).toBeFocused();
      await search.fill(name);
      await page.keyboard.press('Enter');
      await expect(search).toBeHidden();
    };
    const chips = (id: string) =>
      message(page, id).locator('.ui-chat-message__reactions .ui-reaction-bar__reaction');
    // From the received message's context menu.
    const ana = message(page, 'ana');
    await ana.scrollIntoViewIfNeeded();
    await ana.getByText('I can meet you at the river at noon.').click({ button: 'right' });
    await page
      .getByRole('menu', { name: 'Message actions' })
      .getByRole('menuitem', { name: 'Add reaction' })
      .click();
    await pick('party popper');
    await expect(log(page, 'conversation')).toHaveText('react 🎉 on ana');
    await expect(chips('ana')).toHaveCount(2);
    await expect(chips('ana').nth(1)).toHaveAttribute('aria-pressed', 'true');
    // From the sent message's bar, after an edit: the reaction stays with that message.
    const question = message(page, 'question');
    await question.getByText('Which tram goes to the castle?').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await question.getByRole('button', { name: 'Save' }).click();
    await question.hover();
    await question
      .locator('.ui-chat-message-actions')
      .getByRole('button', { name: 'Add reaction' })
      .click();
    await pick('party popper');
    await expect(log(page, 'conversation')).toContainText('react 🎉 on question');
    await expect(chips('question')).toHaveCount(2);
    await expect(chips('ana')).toHaveCount(2);
    // A chip takes the reaction back, and the next press adds it again.
    await chips('question').nth(1).click();
    await expect(log(page, 'conversation')).toContainText('take back 🎉 on question');
    await expect(chips('question')).toHaveCount(1);
    await chips('ana').first().click();
    await expect(chips('ana').first()).toHaveAttribute('aria-pressed', 'true');
    // Every message sets its reactions at its bottom right, under the content and the footer.
    for (const id of ['question', 'ana']) {
      const placement = await message(page, id).evaluate((node) => {
        const box = (selector: string) => node.querySelector(selector)?.getBoundingClientRect();
        const content = box('.ui-chat-message__content');
        const chips = [
          ...node.querySelectorAll('.ui-chat-message__reactions .ui-reaction-bar > *'),
        ];
        const last = chips.at(-1)?.getBoundingClientRect();
        const reactions = box('.ui-chat-message__reactions');
        return {
          below: (reactions?.top ?? 0) >= (content?.bottom ?? 0) - 0.5,
          atEnd: Math.abs((last?.right ?? 0) - (reactions?.right ?? 0)) <= 1,
          withinMessage: (reactions?.right ?? 0) <= (content?.right ?? 0) + 0.5,
        };
      });
      expect(placement).toEqual({ below: true, atEnd: true, withinMessage: true });
    }
  });
});
