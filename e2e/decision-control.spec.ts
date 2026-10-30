import { expect, test } from './fixtures.js';

test.describe('Decision Control lab', () => {
  test('UIC-DECISION-CONTROL-1.1 UIC-DECISION-CONTROL-1.2 UIC-DECISION-CONTROL-1.3 UIC-DECISION-CONTROL-2.1 offers the decisions and the comment', async ({
    page,
    lab,
  }) => {
    await lab.open('decision-control');
    const form = page.getByRole('form', { name: 'Decision, reject, none' });
    await expect(form.getByRole('radio', { name: 'Reject' })).toBeChecked();
    await expect(form.getByRole('textbox', { name: /^Comment/ })).toHaveAttribute(
      'aria-required',
      'true',
    );
    await expect(
      page.locator('[data-lab-cell="picked=reject comment=none"] .ui-decision-control'),
    ).toHaveAttribute('data-decision', 'reject');
    const required = page.getByRole('form', { name: 'Decision, approve, required' });
    await expect(required.getByRole('textbox', { name: /^Comment/ })).toHaveAttribute(
      'aria-required',
      'true',
    );
    const none = page.getByRole('form', { name: 'Decision, none, optional' });
    await expect(none.getByRole('button', { name: 'Submit' })).toBeDisabled();
    await none.getByRole('radio', { name: 'Approve' }).click();
    await expect(none.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  test('UIC-DECISION-CONTROL-1.4 submits, records and shows failures', async ({ page, lab }) => {
    await lab.open('decision-control');
    const form = page.getByRole('form', { name: 'Submit and record' });
    await form.getByRole('radio', { name: 'Reject' }).click();
    await form.getByRole('button', { name: 'Submit' }).click();
    const comment = form.getByRole('textbox', { name: /^Comment/ });
    await expect(comment).toHaveAttribute('aria-invalid', 'true');
    await expect(comment).toBeFocused();
    await comment.fill('Too salty');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('[data-lab-record="submit"]')).toHaveText('reject: Too salty');
    await expect(comment).toHaveValue('');
    const failing = page.getByRole('form', { name: 'Submit and fail' });
    await failing.getByRole('button', { name: 'Submit' }).click();
    await expect(failing.getByRole('alert')).toHaveText(
      'The review closed before your decision arrived.',
    );
    const throwing = page.getByRole('form', { name: 'Submit and throw' });
    await throwing.getByRole('button', { name: 'Submit' }).click();
    await expect(throwing.getByRole('alert')).toHaveText('The decision could not be recorded.');
  });

  test('UIC-DECISION-CONTROL-1.4 keeps a comment typed while a submission is pending', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('decision-control');
    const form = page.getByRole('form', { name: 'Submit slowly' });
    const comment = form.getByRole('textbox', { name: /^Comment/ });
    await comment.fill('Submitted comment');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('.ui-decision-control', { has: form })).toHaveAttribute(
      'data-pending',
      'true',
    );
    await comment.fill('New unsent comment');
    await page.clock.runFor(1600);
    await expect(page.locator('[data-lab-record="slow"]')).toHaveText('approve: Submitted comment');
    await expect(comment).toHaveValue('New unsent comment');
    await form.getByRole('button', { name: 'Submit' }).click();
    await page.clock.runFor(1600);
    await expect(page.locator('[data-lab-record="slow"]')).toHaveText(
      'approve: New unsent comment',
    );
    await expect(comment).toHaveValue('');
  });

  test('UIC-DECISION-CONTROL-1.3 asks a reason for negative votes only', async ({ page, lab }) => {
    await lab.open('decision-control');
    const vote = page.getByRole('form', { name: 'Vote' });
    await vote.getByRole('radio', { name: '+2' }).click();
    await vote.getByRole('button', { name: 'Vote' }).click();
    await expect(page.locator('[data-lab-record="vote"]')).toHaveText('2');
    await vote.getByRole('radio', { name: '−2' }).click();
    await vote.getByRole('button', { name: 'Vote' }).click();
    await expect(vote.getByRole('textbox', { name: /^Comment/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('UIC-DECISION-CONTROL-1.5 signs the decision', async ({ page, lab }) => {
    await lab.open('decision-control');
    const form = page.getByRole('form', { name: 'Signed decision' });
    await form.getByRole('radio', { name: 'Approve' }).click();
    await form.getByRole('textbox', { name: /^Comment/ }).fill('Tasted and approved');
    await form.getByRole('button', { name: 'Submit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Sign your decision' });
    await expect(dialog).toContainText('Meaning of signature: Approve');
    await expect(dialog).toContainText('Tasted and approved');
    const password = dialog.getByLabel(/^Password/);
    await password.fill('wrong');
    await dialog.getByRole('button', { name: 'Sign' }).click();
    await expect(dialog.getByRole('alert')).toContainText('The password is incorrect.');
    await password.fill('sample');
    await dialog.getByRole('button', { name: 'Sign' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-lab-record="signed"]')).toHaveText(
      'approve: Tasted and approved (signed by Ada Park)',
    );
  });

  test('UIC-DECISION-CONTROL-2.1 passes axe in both themes', async ({ lab }) => {
    await lab.open('decision-control');
    await lab.expectAccessible();
    await lab.open('decision-control', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
