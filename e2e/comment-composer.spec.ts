import { cellSelector, expect, test } from './fixtures.js';

const cell = (id: string) => `${cellSelector(id)} .ui-comment-composer`;

test.describe('Comment Composer lab', () => {
  test('UIC-COMMENT-COMPOSER-1.1 UIC-COMMENT-COMPOSER-1.4 UIC-COMMENT-COMPOSER-1.6 draws each state', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-composer');
    const empty = page.locator(cell('draft=empty state=default'));
    await expect(empty.getByRole('textbox', { name: 'Add a comment' })).toHaveAttribute(
      'placeholder',
      'Add a comment',
    );
    await expect(empty.getByRole('button', { name: 'Comment' })).toBeDisabled();
    await expect(empty.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
    const draft = page.locator(cell('draft=draft state=default'));
    await expect(draft.getByRole('button', { name: 'Comment' })).toBeEnabled();
    await expect(draft.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(
      page.locator(cell('draft=empty state=with onCancel')).getByRole('button', { name: 'Cancel' }),
    ).toBeVisible();
    const disabled = page.locator(cell('draft=draft state=disabled'));
    await expect(disabled).toHaveAttribute('data-disabled', 'true');
    await expect(disabled.getByRole('textbox')).toBeDisabled();
    await expect(disabled.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
    // The text box grows with its text from two rows.
    const emptyHeight = (await empty.getByRole('textbox').boundingBox())?.height ?? 0;
    expect(emptyHeight).toBeGreaterThan(30);
  });

  test('UIC-COMMENT-COMPOSER-1.2 UIC-COMMENT-COMPOSER-1.3 sends with the chord and keeps a failed draft', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('comment-composer');
    const composer = page.locator('[data-lab-composer="pending"]');
    const box = composer.getByRole('textbox', { name: 'Reply' });
    await box.fill('Pears on Monday');
    await box.press('Enter');
    await box.pressSequentially('please');
    await box.press('ControlOrMeta+Enter');
    await expect(composer).toHaveAttribute('data-pending', 'true');
    await expect(page.locator('[data-lab-output="status"]')).toHaveText('sending');
    await page.clock.runFor(1600);
    await expect(composer).not.toHaveAttribute('data-pending');
    await expect(box).toHaveValue('');
    await expect(page.locator('[data-lab-output="posted"] li')).toHaveText([
      'Pears on Monday\nplease',
    ]);

    await page.getByRole('switch', { name: 'Fail the next submit' }).focus();
    await page.keyboard.press('Space');
    await box.fill('Figs too');
    await composer.getByRole('button', { name: 'Send' }).click();
    await page.clock.runFor(1600);
    await expect(page.locator('[data-lab-output="status"]')).toHaveText('failed');
    await expect(box).toHaveValue('Figs too');
  });

  test('UIC-COMMENT-COMPOSER-1.5 UIC-COMMENT-COMPOSER-1.4 resumes a stored draft and cancels it', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-composer');
    const box = page.locator('[data-lab-composer="stored"]').getByRole('textbox');
    await box.fill('Half-written note');
    await page.getByRole('button', { name: 'Unmount composer' }).click();
    await expect(box).toHaveCount(0);
    await page.getByRole('button', { name: 'Mount composer' }).click();
    await expect(box).toHaveValue('Half-written note');
    await box.press('Escape');
    await expect(box).toHaveValue('');
    await expect(page.locator('[data-lab-output="cancelled"]')).toHaveText('1');
  });

  test('UIC-COMMENT-COMPOSER-1.3 keeps newer drafts and other threads when a submit settles', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('comment-composer');
    const pending = page.locator('[data-lab-composer="pending"]').getByRole('textbox');
    await pending.fill('First note');
    await pending.press('ControlOrMeta+Enter');
    await pending.fill('Second note');
    await page.clock.runFor(1600);
    await expect(pending).toHaveValue('Second note');

    const composer = page.locator('[data-lab-composer="threads"]');
    await composer.getByRole('textbox', { name: 'Reply in Orchard' }).fill('Orchard reply');
    await page.getByRole('button', { name: 'Open Market' }).click();
    const market = composer.getByRole('textbox', { name: 'Reply in Market' });
    await market.fill('Market draft');
    await page.getByRole('button', { name: 'Open Orchard' }).click();
    await composer.getByRole('button', { name: 'Comment' }).click();
    await page.getByRole('button', { name: 'Open Market' }).click();
    await expect(composer).not.toHaveAttribute('data-pending');
    await page.clock.runFor(1600);
    await expect(page.locator('[data-lab-output="thread-posted"] li')).toHaveText([
      'Orchard reply',
    ]);
    await expect(market).toHaveValue('Market draft');
    await page.getByRole('button', { name: 'Open Orchard' }).click();
    await expect(composer.getByRole('textbox', { name: 'Reply in Orchard' })).toHaveValue('');
  });

  test('UIC-COMMENT-COMPOSER-1.2 UIC-COMMENT-COMPOSER-1.4 leaves composing keys to the input method', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-composer');
    const box = page.locator('[data-lab-composer="pending"]').getByRole('textbox');
    await box.fill('Composing');
    for (const key of ['Enter', 'Escape']) {
      await box.evaluate((element, key) => {
        const init = {
          key,
          ctrlKey: key === 'Enter',
          isComposing: true,
          bubbles: true,
          cancelable: true,
        };
        element.dispatchEvent(new KeyboardEvent('keydown', init));
      }, key);
    }
    await expect(page.locator('[data-lab-output="status"]')).toHaveText('idle');
    await expect(box).toHaveValue('Composing');
  });

  test('UIC-COMMENT-COMPOSER-1.7 passes axe', async ({ lab }) => {
    await lab.open('comment-composer');
    await lab.expectAccessible();
  });
});

test.describe('Comment Composer host cases', () => {
  test('UIC-COMMENT-COMPOSER-1.5 UIC-COMMENT-COMPOSER-1.3 a page-owned draft keeps the host edit over a pending submit', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-composer');
    const demo = page.locator('[data-lab-demo="host-draft"]');
    const box = demo.getByRole('textbox', { name: 'Reply' });
    const draft = demo.locator('[data-lab-output="draft"]');
    const submits = demo.locator('[data-lab-output="submits"] li');
    await expect(box).toHaveAttribute('placeholder', 'Write a reply to Maria');

    await demo.getByRole('button', { name: 'Replace the draft' }).click();
    await expect(box).toHaveValue('Looks good to me.');
    await expect(draft).toHaveText('"Looks good to me."');
    await box.press('ControlOrMeta+Enter');
    await expect(submits).toHaveText(['sent: Looks good to me.']);
    await demo.getByRole('button', { name: 'Reset the draft' }).click();
    await box.fill('A newer thought');
    await expect(submits).toHaveText(['sent: Looks good to me.', 'saved: Looks good to me.']);
    // The submitted draft is no longer the draft, so the success leaves the host's text.
    await expect(box).toHaveValue('A newer thought');

    await demo
      .getByRole('radiogroup', { name: 'Submit' })
      .getByRole('radio', { name: 'fails' })
      .click();
    await box.press('ControlOrMeta+Enter');
    await expect(submits.last()).toHaveText('failed: A newer thought');
    await expect(box).toHaveValue('A newer thought');
    await expect(draft).toHaveText('"A newer thought"');

    await demo
      .getByRole('radiogroup', { name: 'Submit' })
      .getByRole('radio', { name: 'succeeds' })
      .click();
    await box.press('ControlOrMeta+Enter');
    await expect(submits.last()).toHaveText('saved: A newer thought');
    await expect(box).toHaveValue('');
    await expect(draft).toHaveText('""');
    await lab.expectAccessible('[data-lab-demo="host-draft"]');
  });

  test('UIC-COMMENT-COMPOSER-1.7 UIC-COMMENT-COMPOSER-1.1 focuses its text box as it mounts', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-composer');
    const demo = page.locator('[data-lab-demo="focus-on-mount"]');
    await demo.getByRole('button', { name: 'Reply' }).click();
    const box = demo.getByRole('textbox', { name: 'Quick reply' });
    await expect(box).toBeFocused();
    await expect(box).toHaveAttribute('placeholder', 'Say something kind');
    await page.keyboard.type('Thanks!');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(box).toHaveCount(0);
  });
  test('UIC-COMMENT-COMPOSER-1.7 UIC-MESSAGE-COMPOSER-4.14 focuses a rich text box with mentions as it mounts', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-composer');
    const demo = page.locator('[data-lab-demo="focus-on-mount-mentions"]');
    await demo.getByRole('button', { name: 'Reply' }).click();
    const box = demo.getByRole('textbox', { name: 'Quick reply' });
    await expect(box).toBeFocused();
    await page.keyboard.type('Thanks!');
    await expect(box).toHaveText('Thanks!');
  });

  test('UIC-COMMENT-COMPOSER-2.1 UIC-COMMENT-COMPOSER-2.2 UIC-COMMENT-COMPOSER-2.3 mentions people from the search', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-composer');
    const composer = page.locator('[data-lab-composer="mentions"]');
    const box = composer.getByRole('textbox', { name: 'Add a comment' });
    await expect(box.locator('.ui-message-composer__pill')).toHaveText('Lena Ortiz');
    await box.click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(' Ask @ma');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option', { name: /Maria Santos/ })).toBeVisible();
    await expect(box).toHaveAttribute('aria-controls', (await list.getAttribute('id')) ?? '');
    await lab.expectAccessible('[data-lab-composer="mentions"]');
    await page.keyboard.press('Enter');
    await expect(list).toHaveCount(0);
    await expect(box.locator('.ui-message-composer__pill')).toHaveText([
      'Lena Ortiz',
      'Maria Santos',
    ]);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await expect(box.locator('.ui-message-composer__pill')).toHaveCount(1);
    await page.keyboard.type('@jo');
    await expect(page.getByRole('option', { name: /Jon Berg/ })).toBeVisible();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(page.locator('[data-lab-output="mentions"] li')).toHaveText([
      '@[Lena Ortiz](lena) can you taste the pear sauce? Ask @[Jon Berg](jon)',
    ]);
  });

  test('UIC-COMMENT-COMPOSER-2.4 mentions a group with its size', async ({ page, lab }) => {
    await lab.open('comment-composer');
    const composer = page.locator('[data-lab-composer="mentions"]');
    const box = composer.getByRole('textbox', { name: 'Add a comment' });
    await box.click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(' @ba');
    await page.getByRole('option', { name: 'Bakers Team · 4 members' }).waitFor();
    await page.keyboard.press('Enter');
    await expect(box.locator('.ui-message-composer__pill')).toHaveText(['Lena Ortiz', 'Bakers']);
  });
});
