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
