import { expect, test } from './fixtures.js';

test('UIC-TEXTAREA-1.1 supports native multiline editing and states', async ({ lab, page }) => {
  await lab.open('textarea');
  const textarea = page.getByRole('textbox', { name: 'Notes (default)' });
  await textarea.pressSequentially('First');
  await textarea.press('Enter');
  await textarea.pressSequentially('Second');
  await expect(textarea).toHaveValue('First\nSecond');
  await expect(textarea).toHaveAttribute('data-focused', 'true');
  await expect(page.getByRole('textbox', { name: 'Notes (disabled)' })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Notes (read-only)' })).not.toBeEditable();
  await expect(page.getByRole('textbox', { name: 'Notes (invalid)' })).toHaveAttribute(
    'data-invalid',
    'true',
  );
});
