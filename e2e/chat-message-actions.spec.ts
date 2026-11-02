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

  test('UIC-CHAT-TRANSCRIPT-2.12 UIC-CHAT-MESSAGE-ACTIONS-3.2 UIC-CHAT-MESSAGE-ACTIONS-4.1 UIC-REACTION-BAR-1.7 sums reactions in one chip at the bottom right of each message', async ({
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
    const summary = (id: string) =>
      message(page, id).locator('.ui-chat-message__reactions .ui-reaction-bar__summary');
    const total = (id: string) => summary(id).locator('.ui-reaction-bar__count');
    // One chip per message: no per-emoji chips and no add button beside it.
    const ana = message(page, 'ana');
    await ana.scrollIntoViewIfNeeded();
    await expect(summary('ana')).toHaveCount(1);
    await expect(ana.locator('.ui-reaction-bar__reaction, .ui-reaction-bar__add')).toHaveCount(0);
    await expect(total('ana')).toHaveText('5');
    await expect(summary('ana').locator('.ui-reaction-bar__emoji')).toHaveText(['👍', '🎉', '❤️']);
    await expect(summary('ana')).toHaveAttribute('data-reacted', 'true');
    await expect(summary('ana')).toHaveAccessibleName(/^5 reactions: .*You reacted with 🎉$/);
    // React from the received message's context menu adds to the total.
    await ana.getByText('I can meet you at the river at noon.').click({ button: 'right' });
    await page
      .getByRole('menu', { name: 'Message actions' })
      .getByRole('menuitem', { name: 'Add reaction' })
      .click();
    await pick('grinning face');
    await expect(log(page, 'conversation')).toHaveText('react 😀 on ana');
    await expect(total('ana')).toHaveText('6');
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
    await expect(total('question')).toHaveText('2');
    await expect(total('ana')).toHaveText('6');
    // The chip opens the picker for its own message; choosing a reaction of the reader's takes it back.
    await summary('question').click();
    await pick('party popper');
    await expect(log(page, 'conversation')).toContainText('take back 🎉 on question');
    await expect(total('question')).toHaveText('1');
    await expect(summary('question')).toBeFocused();
    // A message without reactions has no chip; React in its bar adds the first.
    const answer = message(page, 'answer');
    await expect(answer.locator('.ui-chat-message__reactions')).toHaveCount(0);
    await answer.hover();
    await answer
      .locator('.ui-chat-message-actions')
      .getByRole('button', { name: 'Add reaction' })
      .click();
    await pick('thumbs up');
    await expect(total('answer')).toHaveText('1');
    // Each chip overlaps the bubble's bottom edge at its end, sent or received.
    for (const id of ['question', 'answer', 'ana']) {
      const placement = await message(page, id).evaluate((node) => {
        const content = node.querySelector('.ui-chat-message__content')?.getBoundingClientRect();
        const chip = node.querySelector('.ui-reaction-bar__summary')?.getBoundingClientRect();
        if (!content || !chip) return null;
        return {
          overlapsBottom: chip.top < content.bottom && chip.bottom > content.bottom,
          atEnd: chip.right <= content.right && content.right - chip.right <= 12,
          clearOfText: chip.top >= content.bottom - chip.height / 2 - 1,
        };
      });
      expect(placement, id).toEqual({ overlapsBottom: true, atEnd: true, clearOfText: true });
    }
  });
});

test.describe('Chat Message Actions lab: emoji options', () => {
  const demo = (page: Page) => page.locator('[data-lab-demo="emoji-options"]');
  const output = (page: Page, name: string) => demo(page).locator(`[data-lab-output="${name}"]`);
  const picker = (page: Page) => page.getByRole('dialog', { name: 'Emoji picker' });
  const openFromBar = async (page: Page) => {
    const entry = message(page, 'emoji');
    await entry.scrollIntoViewIfNeeded();
    await entry.hover();
    await entry
      .locator('.ui-chat-message-actions')
      .getByRole('button', { name: 'Add reaction' })
      .click();
    await expect(picker(page)).toBeVisible();
  };
  const openFromMenu = async (page: Page) => {
    await message(page, 'emoji')
      .getByText('Meet at the station at eight.')
      .click({ button: 'right' });
    await page
      .getByRole('menu', { name: 'Message actions' })
      .getByRole('menuitem', { name: 'Add reaction' })
      .click();
    await expect(picker(page)).toBeVisible();
  };

  test('UIC-CHAT-MESSAGE-ACTIONS-3.2 offers the host’s custom and recent emoji from the bar and the menu', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-message-actions');
    await openFromBar(page);
    await expect(picker(page).getByRole('tab', { name: 'Custom' })).toBeVisible();
    await expect(
      picker(page).getByRole('grid', { name: 'Recently used' }).getByRole('row'),
    ).toHaveText(['🚆']);
    const search = page.getByRole('searchbox', { name: 'Search emoji' });
    await search.fill('see you');
    await page.keyboard.press('Enter');
    await expect(picker(page)).toBeHidden();
    await expect(output(page, 'reacted')).toHaveText(':see_you:');
    await expect(output(page, 'recent')).toContainText('🚆');
    await expect(output(page, 'recent')).toContainText('see_you');
    await openFromMenu(page);
    await expect(
      picker(page).getByRole('grid', { name: 'Recently used' }).getByRole('row').first(),
    ).toHaveAccessibleName(/see you/i);
    await search.fill('party popper');
    await page.keyboard.press('Enter');
    await expect(output(page, 'reacted')).toHaveText('🎉');
    await expect(output(page, 'recent')).toHaveText(/^🎉 /);
  });

  test('UIC-CHAT-MESSAGE-ACTIONS-3.2 loads the emoji through the host’s loader, slow or failing', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-message-actions');
    await demo(page).getByRole('button', { name: 'Load slow' }).click();
    await expect(output(page, 'loader')).toHaveText('slow');
    await openFromMenu(page);
    await expect(picker(page).getByRole('status')).toHaveText('Loading');
    await expect(output(page, 'load attempts')).toHaveText('1');
    await expect(picker(page).getByRole('tab', { name: 'Smileys & Emotion' })).toBeVisible();
    await expect(output(page, 'load attempts')).toHaveText('1');
    await page.keyboard.press('Escape');
    await expect(picker(page)).toBeHidden();
    await demo(page).getByRole('button', { name: 'Load fails once' }).click();
    await openFromBar(page);
    await expect(picker(page)).toContainText('Emoji could not be loaded.');
    await expect(output(page, 'load attempts')).toHaveText('1');
    await page.keyboard.press('Escape');
    await expect(picker(page)).toBeHidden();
    await openFromBar(page);
    await expect(picker(page).getByRole('tab', { name: 'Smileys & Emotion' })).toBeVisible();
    await expect(output(page, 'load attempts')).toHaveText('2');
  });
});
