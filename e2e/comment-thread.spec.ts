import { cellSelector, expect, test } from './fixtures.js';

const cell = (id: string) => `${cellSelector(id)} .ui-comment-thread`;

test.describe('Comment Thread lab', () => {
  test('UIC-COMMENT-THREAD-1.1 UIC-COMMENT-THREAD-1.4 UIC-COMMENT-THREAD-1.6 draws each state', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-thread');
    const open = page.locator(cell('thread=open mode=interactive'));
    await expect(open).toHaveAttribute('data-selected', 'true');
    await expect(open.locator('blockquote')).toHaveText('Ship the tasting samples by Friday');
    await expect(open.getByRole('article')).toHaveCount(2);
    await expect(open.getByRole('article', { name: 'Jon Berg' })).toContainText('3 hours ago');
    await expect(open.getByRole('article', { name: 'Maria Santos' })).toContainText('Edited');
    await expect(open.getByRole('textbox', { name: 'Reply' })).toBeVisible();
    await expect(open.getByRole('button', { name: 'Resolve' })).toBeVisible();

    const fresh = page.locator(cell('thread=new mode=interactive'));
    await expect(fresh.getByRole('list')).toHaveCount(0);
    await expect(fresh.getByRole('textbox', { name: 'Add a comment' })).toBeVisible();

    const resolved = page.locator(cell('thread=resolved mode=interactive'));
    await expect(resolved).toHaveAttribute('data-resolved', 'true');
    await expect(resolved.locator('.ui-comment-thread__status')).toHaveText('Resolved');
    await expect(resolved.getByRole('textbox')).toHaveCount(0);
    await expect(resolved.getByRole('button', { name: 'Reopen' })).toBeVisible();

    const readOnly = page.locator(cell('thread=open mode=read-only'));
    await expect(readOnly).toHaveAttribute('data-readonly', 'true');
    await expect(readOnly.getByRole('textbox')).toHaveCount(0);
    await expect(readOnly.getByRole('button', { name: 'Comment actions' })).toHaveCount(0);
    await expect(readOnly.getByRole('button', { name: 'Resolve' })).toHaveCount(0);
  });

  test('UIC-COMMENT-THREAD-1.5 reveals the hidden replies of a long thread', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-thread');
    const thread = page.locator('[data-lab-thread="long"]');
    await expect(thread.getByRole('article')).toHaveCount(3);
    await thread.getByRole('button', { name: 'Show 4 more replies' }).click();
    await expect(thread.getByRole('article')).toHaveCount(7);
    await expect(thread.getByRole('listitem').nth(1)).toBeFocused();
    await expect(thread.getByRole('listitem').nth(1)).toContainText('Bananas are on the list.');
  });

  test('UIC-COMMENT-THREAD-1.2 UIC-COMMENT-THREAD-1.7 UIC-COMMENT-THREAD-1.4 replies, reports a failure and resolves', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-thread');
    const thread = page.locator('[data-lab-thread="live"]');
    const box = thread.getByRole('textbox', { name: 'Reply' });
    await box.fill('I will bring the figs.');
    await box.press('ControlOrMeta+Enter');
    await expect(thread.getByRole('article')).toHaveCount(4);
    await expect(thread.getByRole('article').last()).toContainText('I will bring the figs.');
    await expect(box).toHaveValue('');

    await page.getByRole('switch', { name: 'Fail the next reply' }).focus();
    await page.keyboard.press('Space');
    await box.fill('This one fails');
    await thread.getByRole('button', { name: 'Reply' }).click();
    await expect(thread.getByRole('alert')).toHaveText(/could not be posted/);
    await expect(box).toHaveValue('This one fails');

    await thread.getByRole('button', { name: 'Resolve' }).click();
    await expect(page.locator('[data-lab-output="action"]')).toHaveText('resolved');
    await expect(thread).toHaveAttribute('data-resolved', 'true');
    await expect(thread.getByRole('textbox')).toHaveCount(0);
    await thread.getByRole('button', { name: 'Reopen' }).click();
    await expect(thread.getByRole('textbox', { name: 'Reply' })).toBeVisible();
  });

  test('UIC-COMMENT-THREAD-2.2 UIC-COMMENT-THREAD-2.3 UIC-COMMENT-THREAD-2.4 edits, deletes and runs actions', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-thread');
    const thread = page.locator('[data-lab-thread="live"]');
    const own = thread.getByRole('article', { name: 'Maria Santos' });
    const menu = own.getByRole('button', { name: 'Comment actions' });
    await menu.click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const editor = own.getByRole('textbox', { name: 'Edit comment' });
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Monday works for the kitchen.');
    await editor.fill('Monday works for everyone.');
    await editor.press('ControlOrMeta+Enter');
    await expect(own.locator('.ui-comment-thread-reply__body')).toHaveText(
      'Monday works for everyone.',
    );
    await expect(menu).toBeFocused();

    await thread
      .getByRole('article', { name: 'Jon Berg' })
      .getByRole('button', { name: 'Comment actions' })
      .click();
    await expect(page.getByRole('menuitem')).toHaveText(['Copy link']);
    await page.getByRole('menuitem', { name: 'Copy link' }).click();
    await expect(page.locator('[data-lab-output="action"]')).toHaveText('copy-link on comment 1');

    await menu.click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete comment' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(thread.getByRole('article', { name: 'Maria Santos' })).toHaveCount(0);
  });

  test('UIC-COMMENT-THREAD-2.1 reacts and renders caller content', async ({ page, lab }) => {
    await lab.open('comment-thread');
    const first = page.locator('[data-lab-thread="live"]').getByRole('article').first();
    await first.getByRole('button', { name: '👍 1, reacted by Lena Ortiz' }).click();
    await expect(
      first.getByRole('button', { name: '👍 2, reacted by Maria Santos and Lena Ortiz' }),
    ).toHaveAttribute('aria-pressed', 'true');

    const caller = page.locator('[data-lab-thread="caller"]');
    await expect(caller.locator('.ui-comment-thread-reply__body strong')).toHaveText('bold');
    await expect(caller.getByRole('textbox', { name: 'Reply in Markdown' })).toBeVisible();
    await caller.getByRole('button', { name: 'Comment actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await caller.getByRole('textbox', { name: 'Edit Markdown' }).fill('Now **urgent**.');
    await caller.getByRole('button', { name: 'Update' }).click();
    await expect(caller.locator('.ui-comment-thread-reply__body strong')).toHaveText('urgent');
  });

  test('UIC-COMMENT-THREAD-2.1 reads times against the caller clock', async ({ page, lab }) => {
    await lab.open('comment-thread');
    const week = page.locator(`${cellSelector('fallback=7 days')} .ui-comment-thread-reply__time`);
    await expect(week).toHaveText(['12 minutes ago', '3 days ago']);
    const day = page.locator(`${cellSelector('fallback=1 day')} .ui-comment-thread-reply__time`);
    await expect(day.last()).toHaveText(/^Apr 17, 2026/);
  });

  test('UIC-COMMENT-THREAD-1.8 passes axe', async ({ page, lab }) => {
    await lab.open('comment-thread');
    await expect(page.getByRole('group', { name: 'Comment thread' }).first()).toBeVisible();
    await lab.expectAccessible();
  });
});
